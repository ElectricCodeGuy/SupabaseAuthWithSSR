// File: /api/checkdoc.ts

import { type NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { embed } from 'ai';
import { getSession } from '@/lib/server/supabase';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import {
  preliminaryAnswerChainAgent,
  generateDocumentMetadata
} from './agentchains';
import { openai } from '@ai-sdk/openai';
import { recursiveTextSplitter } from './textspliter';
import { encodingForModel } from 'js-tiktoken';
import { backOff, IBackOffOptions } from 'exponential-backoff';
import { type LanguageModelUsage } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const embeddingBackOffOptions: IBackOffOptions = {
  numOfAttempts: 3,
  startingDelay: 5000, // 5 seconds
  maxDelay: 10000, // 10 seconds
  timeMultiple: 2,
  jitter: 'full',
  delayFirstAttempt: false,
  retry: (error, attemptNumber) => {
    console.error(
      `Embedding attempt ${attemptNumber} failed with error: ${error}`
    );
    return attemptNumber < 3; // Only retry twice (3 attempts total)
  }
};

async function getEmbeddingWithRetry(text: string) {
  try {
    return await backOff(async () => {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-large'),
        value: text
      });

      return embedding;
    }, embeddingBackOffOptions);
  } catch (error) {
    console.error('Failed to get embedding after all retries:', error);
    return null;
  }
}

function initPineconeIndex(userId: string) {
  const namespace = `document_${userId}`;
  const indexName = process.env.PINECONE_INDEX_NAME!;
  const pinecone = new Pinecone();
  return pinecone.index(indexName).namespace(namespace);
}

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized;
}
interface PineconeRecord {
  id: string;
  values: number[];
  metadata: {
    text: string;
    title: string;
    timestamp: string;
    ai_title: string;
    ai_description: string;
    ai_maintopics: string[];
    ai_keyentities: string[];
    filterTags: string;
    page: number;
    totalPages: number;
    chunk: number;
    totalChunks: number;
  };
}

async function processFile(pages: string[], fileName: string, userId: string) {
  const pineconeIndex = initPineconeIndex(userId);

  let selectedDocuments = pages;
  if (pages.length > 19) {
    selectedDocuments = [...pages.slice(0, 10), ...pages.slice(-10)];
  }

  const combinedDocumentContent = selectedDocuments.join('\n\n');

  const { object } = await generateDocumentMetadata(combinedDocumentContent);

  const now = new TZDate(new Date(), 'Europe/Copenhagen');
  const timestamp = format(now, 'yyyy-MM-dd');
  const sanitizedFilename = sanitizeFilename(fileName);
  const filterTags = `${sanitizedFilename}[[${timestamp}]]`;
  const totalPages = pages.length;

  const processingBatchSize = 200; // For processing documents
  const upsertBatchSize = 100; // For Pinecone upserts

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  const tokenizer = encodingForModel('text-embedding-3-large');

  const chunks = <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const pageChunks = chunks(pages, processingBatchSize);

  for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
    const batch = pageChunks[chunkIndex];
    let batchRecords: PineconeRecord[] = [];

    await Promise.all(
      batch.map(async (doc: string, index: number) => {
        if (!doc) {
          console.error('Document is undefined, skipping document');
          return;
        }

        const pageNumber = chunkIndex * processingBatchSize + index + 1;

        try {
          const { combinedPreliminaryAnswers, usage } =
            await processDocumentWithAgentChains(
              doc,
              object.descriptiveTitle,
              object.shortDescription,
              object.mainTopics
            );

          totalPromptTokens += usage.promptTokens;
          totalCompletionTokens += usage.completionTokens;

          // If we got no preliminary answers (due to timeout), use a simpler content structure
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

          let contentChunks: string[];
          if (tokenizer.encode(combinedContent).length > 8000) {
            contentChunks = recursiveTextSplitter(combinedContent, 7500, 200);
          } else {
            contentChunks = [combinedContent];
          }
          for (let i = 0; i < contentChunks.length; i++) {
            const chunk = contentChunks[i];

            const embedding = await getEmbeddingWithRetry(chunk);

            // Skip this chunk if embedding failed
            if (!embedding) {
              continue;
            }

            const uniqueId = `${filterTags}_${totalPages}_${pageNumber}_${i}`;

            batchRecords.push({
              id: String(uniqueId),
              values: embedding,
              metadata: {
                text: doc,
                title: fileName,
                timestamp,
                ai_title: object.descriptiveTitle,
                ai_description: object.shortDescription,
                ai_maintopics: object.mainTopics,
                ai_keyentities: object.keyEntities,
                filterTags,
                page: pageNumber,
                totalPages,
                chunk: i + 1,
                totalChunks: contentChunks.length
              }
            });
          }
        } catch (error) {
          console.error(`Error processing document page: ${pageNumber}`, error);
        }
      })
    );

    // Upsert records in batches of 50
    const pineconeUpsertBatches = chunks(batchRecords, upsertBatchSize);
    for (const upsertBatch of pineconeUpsertBatches) {
      try {
        await pineconeIndex.upsert(upsertBatch);
      } catch (error) {
        console.error('Error upserting batch to Pinecone:', error);
      }
    }

    // Clear batchRecords after processing
    batchRecords = [];
  }
  console.log('Token Usage:', totalPromptTokens, totalCompletionTokens);
  return filterTags;
}

type ContentAnalysisType = {
  preliminary_answer_1: string;
  preliminary_answer_2: string;
  hypothetical_question_1: string;
  hypothetical_question_2: string;
  tags: string[];
};

interface AgentChainResult {
  object: ContentAnalysisType;
  usage: LanguageModelUsage;
}

async function processDocumentWithAgentChains(
  doc: string,
  ai_title: string,
  ai_description: string,
  ai_maintopics: string[]
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

  // Create a promise that rejects after 15 seconds
  const timeout: Promise<never> = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Processing timeout after 15 seconds'));
    }, 15000);
  });

  try {
    // Race between the actual processing and the timeout
    const result = await Promise.race<AgentChainResult>([
      preliminaryAnswerChainAgent(prompt),
      timeout
    ]);

    if (!result) {
      console.error('Failed to process document with agent chains');
      return {
        combinedPreliminaryAnswers: '',
        usage: {
          promptTokens: 0,
          completionTokens: 0
        }
      };
    }

    const { object, usage } = result;

    const tagTaxProvisions = object.tags?.join(', ') || '';

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