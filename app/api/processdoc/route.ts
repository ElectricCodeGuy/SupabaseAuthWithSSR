import { type NextRequest, NextResponse } from 'next/server';
import { embed } from 'ai';
import { getSession } from '@/lib/server/supabase';
import { createAdminClient } from '@/lib/server/admin';
import {
  preliminaryAnswerChainAgent,
  generateDocumentMetadata
} from './agentchains';
import { voyage } from 'voyage-ai-provider';
import type { TablesInsert } from '@/types/database';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export const maxDuration = 800;

const embeddingModel = voyage('voyage-3-large');

type DocumentVectorRecord = TablesInsert<'user_documents_vec'>;

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

  const totalPages = pages.length;

  const processingBatchSize = 100;
  const upsertBatchSize = 100;

  const chunks = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const pageChunks = chunks(pages, processingBatchSize);

  const supabase = createAdminClient();

  // Upsert the document metadata
  const { error: docError, data: docData } = await supabase
    .from('user_documents')
    .upsert(
      {
        user_id: userId,
        title: fileName.trim(),
        ai_title: object.descriptiveTitle,
        ai_description: object.shortDescription,
        ai_maintopics: object.mainTopics,
        ai_keyentities: object.keyEntities,
        total_pages: totalPages,
        file_path: `${userId}/${fileName}`,
        created_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,title'
      }
    )
    .select('id')
    .single();

  if (docError) {
    console.error('Error upserting document metadata:', docError);
    throw new Error(`Failed to create document record: ${docError.message}`);
  }

  // Get the document ID (either from upsert response or the generated UUID)
  const finalDocumentId = docData.id;

  // Now process each page chunk and create vector entries
  for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
    const batch = pageChunks[chunkIndex];
    let vectorBatchRecords: DocumentVectorRecord[] = [];

    await Promise.all(
      batch.map(async (doc: string, index: number) => {
        if (!doc) {
          console.error('Document is undefined, skipping document');
          return;
        }

        const pageNumber = chunkIndex * processingBatchSize + index + 1;

        try {
          const { combinedPreliminaryAnswers } =
            await processDocumentWithAgentChains(
              doc,
              object.descriptiveTitle,
              object.shortDescription,
              object.mainTopics,
              userId
            );

          const combinedContent = combinedPreliminaryAnswers
            ? `
      ${fileName} \n
      ${object.descriptiveTitle} \n
      ${object.shortDescription} \n
      ${object.mainTopics} \n
      ${object.keyEntities} \n\n
      
      ${doc} \n\n
      
      ${combinedPreliminaryAnswers}
      `
            : `
      ${object.descriptiveTitle} \n\n
      
      ${doc}
      `;

          try {
            const { embedding } = await embed({
              model: embeddingModel,
              value: combinedContent,
              providerOptions: {
                voyage: {
                  inputType: 'document',
                  truncation: false,
                  outputDimension: 1024,
                  outputDtype: 'int8'
                }
              }
            });

            if (!embedding) {
              console.error('No embedding generated, skipping document');
              return;
            }

            vectorBatchRecords.push({
              document_id: finalDocumentId,
              page_number: pageNumber,
              text_content: doc,
              embedding: `[${embedding.join(',')}]`
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
    if (vectorBatchRecords.length > 0) {
      // Upsert vector records in batches
      const upsertBatches = chunks(vectorBatchRecords, upsertBatchSize);

      for (const batch of upsertBatches) {
        const { error } = await supabase
          .from('user_documents_vec')
          .upsert(batch, {
            onConflict: 'document_id,page_number'
          });

        if (error) {
          console.error('Error upserting vector batch to Supabase:', error);
        }
      }
    } else {
      console.warn('No vector records to upsert for this batch');
    }

    // Clear batch records for next iteration
    vectorBatchRecords = [];
  }
}

// Rest of your code remains unchanged...
async function processDocumentWithAgentChains(
  doc: string,
  ai_title: string,
  ai_description: string,
  ai_maintopics: string[],
  userId: string
): Promise<{
  combinedPreliminaryAnswers: string;
}> {
  const prompt = `
  Title: ${ai_title}
  Description: ${ai_description}
  Main Topics: ${ai_maintopics.join(', ')}
  Document: ${doc}
  `;

  try {
    const result = await preliminaryAnswerChainAgent(prompt, userId);

    const { object } = result;

    // If tags is potentially undefined, use nullish coalescing
    const tagTaxProvisions = object.tags.join(', ') || '';

    const combinedPreliminaryAnswers = [
      object.preliminary_answer_1,
      object.preliminary_answer_2,
      tagTaxProvisions,
      object.hypothetical_question_1,
      object.hypothetical_question_2
    ].join('\n');
    return { combinedPreliminaryAnswers };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Processing timeout after 15 seconds'
    ) {
      console.error(`Error processing document with agent chains: ${error}`);
    }

    return {
      combinedPreliminaryAnswers: ''
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

    const userId = session.sub;

    const { jobId, fileName } = await req.json();

    const markdownResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/markdown`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LLAMA_CLOUD_API_KEY}`,
          Accept: 'application/json'
        },
        cache: 'no-store'
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

    // Parse the JSON response to extract just the markdown property
    const responseJson = await markdownResponse.json();

    // Extract the clean markdown content from the response
    const markdownContent = responseJson.markdown as string;

    // Use the correct page splitting pattern
    const pages = markdownContent
      .split('\n---\n')
      .map((page) => page.trim())
      .filter((page) => page !== '');

    await processFile(pages, fileName, userId);
    revalidatePath('/chat', 'layout');
    return NextResponse.json({ status: 'SUCCESS' });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
