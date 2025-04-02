import { type NextRequest, NextResponse } from 'next/server';
import { embed } from 'ai';
import { getSession } from '@/lib/server/supabase';
import { createAdminClient } from '@/lib/server/admin';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import {
  preliminaryAnswerChainAgent,
  generateDocumentMetadata
} from './agentchains';
import { voyage } from 'voyage-ai-provider';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

const embeddingModel = voyage.textEmbeddingModel('voyage-3-large', {
  inputType: 'document',
  truncation: false,
  outputDimension: 1024,
  outputDtype: 'int8'
});

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized;
}

interface DocumentRecord {
  user_id: string;
  embedding: string; // Changed from number[] to string
  text_content: string;
  title: string;
  timestamp: string;
  ai_title: string;
  ai_description: string;
  ai_maintopics: string[];
  ai_keyentities: string[];
  primary_language: string;
  filter_tags: string;
  page_number: number;
  total_pages: number;
  chunk_number: number;
  total_chunks: number;
}

async function processFile(pages: string[], fileName: string, userId: string) {
  let selectedDocuments = pages;
  if (pages.length > 19) {
    selectedDocuments = [...pages.slice(0, 10), ...pages.slice(-10)];
  }

  const combinedDocumentContent = selectedDocuments.join('\n\n');
  const { object } = await generateDocumentMetadata(
    combinedDocumentContent,
    userId
  );

  const now = new TZDate(new Date(), 'Europe/Copenhagen');
  const timestamp = format(now, 'yyyy-MM-dd');
  const sanitizedFilename = sanitizeFilename(fileName);
  const filterTags = `${sanitizedFilename}[[${timestamp}]]`;
  const totalPages = pages.length;

  const processingBatchSize = 100;
  const upsertBatchSize = 100;

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  const chunks = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const pageChunks = chunks(pages, processingBatchSize);
  console.log('Processing page chunks:', pageChunks.length);
  const supabase = createAdminClient();

  for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
    console.log(`Processing chunk ${chunkIndex + 1} of ${pageChunks.length}`);
    const batch = pageChunks[chunkIndex];
    let batchRecords: DocumentRecord[] = [];

    await Promise.all(
      batch.map(async (doc: string, index: number) => {
        if (!doc) {
          console.error('Document is undefined, skipping document');
          return;
        }

        const pageNumber = chunkIndex * processingBatchSize + index + 1;
        console.log(`Processing page ${pageNumber} of ${totalPages}`);

        try {
          const { combinedPreliminaryAnswers, usage } =
            await processDocumentWithAgentChains(
              doc,
              object.descriptiveTitle,
              object.shortDescription,
              object.mainTopics,
              userId
            );

          totalPromptTokens += usage.promptTokens;
          totalCompletionTokens += usage.completionTokens;

          const combinedContent = combinedPreliminaryAnswers
            ? `
      File Name: ${fileName}
      Date: ${timestamp}
      Page: ${pageNumber} of ${totalPages}
      Title: ${object.descriptiveTitle}
      Description: ${object.shortDescription}
      Main Topics: ${object.mainTopics}
      Key Entities: ${object.keyEntities}
      
      Content:
      ${doc}
      
      Preliminary Analysis:
      ${combinedPreliminaryAnswers}
      `
            : `
      File Name: ${fileName}
      Date: ${timestamp}
      Page: ${pageNumber} of ${totalPages}
      Title: ${object.descriptiveTitle}
      
      Content:
      ${doc}
      `;

          // FIXED: Generate a single embedding for the entire content
          // instead of iterating character by character
          try {
            const { embedding } = await embed({
              model: embeddingModel,
              value: combinedContent
            });

            if (!embedding) {
              console.log('No embedding generated, skipping document');
              return;
            }

            batchRecords.push({
              user_id: userId,
              embedding: `[${embedding.join(',')}]`,
              text_content: doc,
              title: fileName,
              timestamp,
              ai_title: object.descriptiveTitle,
              ai_description: object.shortDescription,
              ai_maintopics: object.mainTopics,
              ai_keyentities: object.keyEntities,
              primary_language: object.primaryLanguage,
              filter_tags: filterTags,
              page_number: pageNumber,
              total_pages: totalPages,
              chunk_number: 1, // Since we're now treating each page as one document
              total_chunks: 1 // Since we're now treating each page as one document
            });
          } catch (embedError) {
            console.error(
              `Error generating embedding for page ${pageNumber}:`,
              embedError
            );
          }
        } catch (error) {
          console.error(`Error processing document page: ${pageNumber}`, error);
        }
      })
    );

    // Only attempt to upsert if we have records
    if (batchRecords.length > 0) {
      // Upsert records in batches
      const upsertBatches = chunks(batchRecords, upsertBatchSize);
      console.log(`Processing ${upsertBatches.length} upsert batches`);

      for (const batch of upsertBatches) {
        try {
          console.log(`Upserting batch of ${batch.length} records`);
          const { error } = await supabase
            .from('vector_documents')
            .upsert(batch, {
              onConflict:
                'user_id, title, timestamp, page_number, chunk_number',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('Error upserting batch to Supabase:', error);
          } else {
            console.log(
              `Successfully upserted batch of ${batch.length} records`
            );
          }
        } catch (error) {
          console.error('Error upserting batch to Supabase:', error);
        }
      }
    } else {
      console.warn('No records to upsert for this batch');
    }

    // Clear batch records for next iteration
    batchRecords = [];
  }

  console.log('Final Token Usage:', totalPromptTokens, totalCompletionTokens);
  return filterTags;
}

async function processDocumentWithAgentChains(
  doc: string,
  ai_title: string,
  ai_description: string,
  ai_maintopics: string[],
  userId: string
): Promise<{
  combinedPreliminaryAnswers: string;
  usage: { promptTokens: number; completionTokens: number };
}> {
  const prompt = `
  Title: ${ai_title}
  Description: ${ai_description}
  Main Topics: ${ai_maintopics.join(', ')}
  Document: ${doc}
  `;

  try {
    const result = await preliminaryAnswerChainAgent(prompt, userId);

    const { object, usage } = result;
    console.log('Result:', object);
    // If tags is potentially undefined, use nullish coalescing
    const tagTaxProvisions = object.tags.join(', ') || '';

    const combinedPreliminaryAnswers = [
      object.preliminary_answer_1,
      object.preliminary_answer_2,
      tagTaxProvisions,
      object.hypothetical_question_1,
      object.hypothetical_question_2
    ].join('\n');
    return {
      combinedPreliminaryAnswers,
      usage: {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens
      }
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Processing timeout after 15 seconds'
    ) {
      console.log('Skipping document processing due to timeout');
    } else {
      console.error(`Error processing document with agent chains: ${error}`);
    }

    return {
      combinedPreliminaryAnswers: '',
      usage: {
        promptTokens: 0,
        completionTokens: 0
      }
    };
  }
}
export async function POST(req: NextRequest) {
  try {
    // Check for Llama Cloud API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      console.error('LLAMA_CLOUD_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: LLAMA_CLOUD_API_KEY is missing' },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }

    const userId = session.id;

    const { jobId, fileName } = await req.json();

    const markdownResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/markdown`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
          Accept: 'application/json'
        }
      }
    );

    if (!markdownResponse.ok) {
      console.error(
        'Failed to get Markdown result:',
        markdownResponse.statusText
      );
      return NextResponse.json(
        {
          error: `Failed to get Markdown result: ${markdownResponse.statusText}`
        },
        { status: 500 }
      );
    }

    const markdown = await markdownResponse.text();
    const pages = markdown
      .split('\\n---\\n')
      .map((page) => page.trim())
      .filter((page) => page !== '');

    const filterTags = await processFile(pages, fileName, userId);

    return NextResponse.json({ status: 'SUCCESS', filterTags });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
