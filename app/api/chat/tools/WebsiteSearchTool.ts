// app/api/chat/tools/WebsiteSearchTool.ts
import { tool } from 'ai';
import { z } from 'zod';
import { generateObject, pruneMessages } from 'ai';
import { google } from '@ai-sdk/google';

// Rough token estimate: ~4 characters per token
const MAX_CONTENT_CHARS = 40000; // ~10000 tokens

// Zod schema for query variations
const websiteSearchSchema = z.object({
  queryVariation1: z
    .string()
    .min(1)
    .describe(
      'En variation, der er målrettet officielle myndighedshjemmesider (f.eks. Ankestyrelsen, STAR, ministerierne, Erhvervsstyrelsen, Finanstilsynet). Brug præcis terminologi der matcher disse myndigheders sprogbrug.'
    ),
  queryVariation2: z
    .string()
    .min(1)
    .describe(
      'En variation, der fokuserer på aktualitet og nyeste udvikling inden for emnet. Inkluder tidsmæssige aspekter og fokuser på opdateret information. Outputtet skal være på dansk og er påkrævet.'
    ),
  queryVariation3: z
    .string()
    .min(1)
    .describe(
      'En variation, der fokuserer på praktiske eksempler og anvendelse. Søg efter cases, vejledninger og konkrete implementeringer. Outputtet skal være på dansk og er påkrævet.'
    )
});

// Type definitions
interface SearchResultURL {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
}

type ExaSearchResult = {
  id: string;
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
};

type ExaAPIResponse = {
  requestId: string;
  autopromptString?: string;
  autoDate?: string;
  resolvedSearchType?: string;
  results: ExaSearchResult[];
};

// Make sure the structure matches other tools exactly
export const websiteSearchTool = tool({
  description:
    'Search the web for up-to-date information about legal or governmental topics. This tool is particularly effective for finding information on official Danish government websites, recent developments, and practical implementation guides.',
  inputSchema: z.object({
    query: z.string().describe('The query to search for on the web')
  }),
  execute: async (args, { messages }) => {
    // Generate improved search queries
    const currentDate = new Date().toISOString().split('T')[0];

    // Prune messages to remove tool calls and reasoning blocks
    const prunedMessages = pruneMessages({
      messages: messages,
      reasoning: 'before-last-message',
      toolCalls: 'all',
      emptyMessages: 'remove'
    });

    const queryOptimizationPrompt = `
      <metadata>
      <current_date>${currentDate}</current_date>
      </metadata>
      
      Som en ekspert i informationssøgning, optimér brugerens forespørgsel til tre forskellige variationer. 
      Brug ovenstående dato som reference for aktualitet.
      
      <instructions>
      1. Den første variation skal specifikt målrettes danske myndigheders officielle hjemmesider:
         - Ministerier (f.eks. Erhvervsministeriet, Justitsministeriet, Finansministeriet)
         - Styrelser (f.eks. Erhvervsstyrelsen, Finanstilsynet, Datatilsynet)
         - Nævn og råd (f.eks. Ankestyrelsen, Forbrugerklagenævnet)
         - Andre offentlige institutioner (f.eks. STAR, ATP, Finanstilsynet)
      
      2. Den anden variation skal fokusere på aktualitet (med udgangspunkt i ${currentDate}):
         - Nye regler og ændringer
         - Aktuelle fortolkninger
         - Nyeste praksis og guidelines
      
      3. Den tredje variation skal fokusere på praktisk implementering:
         - Konkrete eksempler
         - Vejledninger og guides
         - Best practices og anbefalinger
      </instructions>

      <example>
      Original: "Hvad er reglerne for digitale kontrakter?"

      Variation 1: "Erhvervsstyrelsens vejledning om digitale kontrakter og digital signering"
      Variation 2: "Nyeste regler ${currentDate.split('-')[0]} for digitale kontrakter og e-signering"
      Variation 3: "Praktisk guide implementering digitale kontrakter erhvervslivet"
      </example>
      Besked som skal optimeres: ${args.query}
      `;

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: queryOptimizationPrompt,
      schema: websiteSearchSchema,
      messages: prunedMessages
    });

    const websiteQueries = [
      object.queryVariation1,
      object.queryVariation2,
      object.queryVariation3
    ].filter((query) => query !== undefined && query.trim() !== '');

    // Execute searches for each query variation using Exa API
    const searchPromises = websiteQueries.map(async (query) => {
      try {
        const response = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.EXA_API_KEY || ''
          },
          body: JSON.stringify({
            query: query,
            type: 'auto',
            numResults: 2,
            excludeDomains: ['lovguiden.dk', 'retsinformation.dk'],
            userLocation: 'DK',
            contents: {
              text: true
            }
          })
        });

        if (!response.ok) {
          throw new Error(
            `Exa API error: ${response.status} ${response.statusText}`
          );
        }

        const data: ExaAPIResponse = await response.json();

        // Use the results directly from Exa
        return data.results.map((result: ExaSearchResult) => ({
          title: result.title,
          url: result.url,
          content: result.text || '',
          publishedDate: result.publishedDate
        }));
      } catch (error) {
        console.error('Error fetching from Exa API:', error);
        return [];
      }
    });

    const searchResultsArray = await Promise.all(searchPromises);

    // Deduplicate search results by URL
    const uniqueSearchResults = searchResultsArray
      .flat()
      .reduce((acc, result) => {
        if (!acc.some((r: SearchResultURL) => r.url === result.url)) {
          acc.push(result);
        }
        return acc;
      }, [] as SearchResultURL[]);

    const searchResults = uniqueSearchResults;

    // Build context array with truncated content if needed
    const contextArray = searchResults.map((result) => {
      let content = result.content;

      // Truncate if content exceeds max characters (~10000 tokens)
      if (content && content.length > MAX_CONTENT_CHARS) {
        content = content.slice(0, MAX_CONTENT_CHARS);
      }

      return {
        type: 'website',
        title: result.title,
        url: result.url,
        content: content,
        publishedDate: result.publishedDate
      };
    });

    // Create instructions for the AI
    const instructions = `
      Baseret på indholdet fra de fundne websider skal du give et koncist og præcist svar på brugerens spørgsmål. Hvis informationen ikke er tilstrækkelig, skal du bede om mere information eller afklaring.

      Følg disse retningslinjer når du svarer:

      1. Integrer kilderne direkte i dit svar som inline referencer ved hjælp af Markdown-linkformatering:
        Eksempel: Ifølge [Sidens titel](URL) er det beskrevet at...

      2. Når du refererer til specifikt indhold eller afsnit fra websiderne, skal du altid inkludere dem som inline links:
        Som beskrevet i [Relevant sektion eller overskrift](URL), gælder følgende...

      3. Sørg for at linke til alle relevante kilder, du refererer til, som en naturlig del af teksten. Dette gør det nemt for læseren at verificere informationen.

      4. Hvis du refererer til specifikt indhold på en side, men kun har et overordnet link, skal du:
        - Linke til hovedsiden: [Sidens titel](URL)
        - Nævne den specifikke sektion eller information i teksten
        Eksempel: På [Hjemmesidens navn](URL) under afsnittet "Specifik sektion" fremgår det, at...

      5. Dit svar skal være:
        - Præcist og koncist
        - Indeholde alle relevante detaljer
        - Have kilder integreret naturligt i teksten
        - Være let at læse og forstå

      6. Undgå at samle referencer i slutningen af dit svar. De skal være en naturlig del af teksten, så læseren nemt kan følge kilderne undervejs.

      7. Hvis informationen kommer fra flere forskellige sider, skal du væve dem sammen til et sammenhængende svar, hvor kilderne supplerer hinanden.

      Husk: 
      - Vær objektiv og faktuel i din formidling
      - Sørg for at alle påstande er understøttet af kilder
      - Skriv i et klart og professionelt sprog
      - Bevar den samme høje standard for kildehenvisninger som i akademisk skrivning`;

    // Return results in consistent format with other tools
    return {
      instructions: instructions,
      context: contextArray
    };
  }
});
