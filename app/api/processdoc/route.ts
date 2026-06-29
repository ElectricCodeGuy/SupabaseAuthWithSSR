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

const embeddingModel = voyage('voyage-4-large');

interface MistralOCRResponse {
  pages: Array<{
    index: number;
    markdown: string;
    images: Array<unknown>;
    dimensions: { dpi: number; height: number; width: number } | null;
  }>;
  model: string;
  usage_info: { pages_processed: number; doc_size_bytes: number };
}

type DocumentVectorRecord = TablesInsert<'user_documents_vec'>;

async function processFile(pages: string[], fileName: string, userId: string) {
  let selectedDocuments = pages;
  if (pages.length > 19) {
    selectedDocuments = [...pages.slice(0, 10), ...pages.slice(-10)];
  }

  const combinedDocumentContent = selectedDocuments.join('\n\n');
  const { output } = await generateDocumentMetadata(combinedDocumentContent);

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
        ai_title: output.descriptiveTitle,
        ai_description: output.shortDescription,
        ai_maintopics: output.mainTopics,
        ai_keyentities: output.keyEntities,
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
              output.descriptiveTitle,
              output.shortDescription,
              output.mainTopics
            );

          const combinedContent = combinedPreliminaryAnswers
            ? `
      ${fileName} \n
      ${output.descriptiveTitle} \n
      ${output.shortDescription} \n
      ${output.mainTopics} \n
      ${output.keyEntities} \n\n
      
      ${doc} \n\n
      
      ${combinedPreliminaryAnswers}
      `
            : `
      ${output.descriptiveTitle} \n\n
      
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
  ai_maintopics: string[]
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
    const result = await preliminaryAnswerChainAgent(prompt);

    const { output } = result;

    // If tags is potentially undefined, use nullish coalescing
    const tagTaxProvisions = output.tags.join(', ') || '';

    const combinedPreliminaryAnswers = [
      output.preliminary_answer_1,
      output.preliminary_answer_2,
      tagTaxProvisions,
      output.hypothetical_question_1,
      output.hypothetical_question_2
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
    // OCR is done with Mistral (mistral-ocr-latest) instead of LlamaParse.
    if (!process.env.MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: MISTRAL_API_KEY is missing' },
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

    const { filePath, fileName } = await req.json();
    if (!filePath || !fileName) {
      return NextResponse.json(
        { error: 'Missing filePath or fileName' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Download the uploaded PDF from storage
    const { data: fileData, error: dlError } = await supabase.storage
      .from('userfiles')
      .download(filePath);

    if (dlError || !fileData) {
      return NextResponse.json(
        { error: `Download failed: ${dlError?.message}` },
        { status: 500 }
      );
    }

    // 2. Upload the file to Mistral for OCR
    const uploadForm = new FormData();
    uploadForm.append('purpose', 'ocr');
    uploadForm.append(
      'file',
      new Blob([await fileData.arrayBuffer()]),
      fileName
    );

    const uploadRes = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      body: uploadForm
    });

    if (!uploadRes.ok) {
      console.error('Mistral upload failed:', uploadRes.statusText);
      return NextResponse.json(
        { error: 'Mistral upload failed' },
        { status: 500 }
      );
    }

    const { id: mistralFileId } = await uploadRes.json();

    // 3. Wait briefly for file processing, then get a signed URL
    await new Promise((r) => setTimeout(r, 3000));

    const urlRes = await fetch(
      `https://api.mistral.ai/v1/files/${mistralFileId}/url?expiry=24`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
        }
      }
    );

    if (!urlRes.ok) {
      return NextResponse.json(
        { error: 'Failed to get Mistral signed URL' },
        { status: 500 }
      );
    }

    const { url: signedUrl } = await urlRes.json();

    // 4. Run OCR — returns one markdown block per page
    const ocrRes = await fetch('https://api.mistral.ai/v1/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: { type: 'document_url', document_url: signedUrl },
        include_image_base64: false
      })
    });

    if (!ocrRes.ok) {
      return NextResponse.json({ error: 'OCR failed' }, { status: 500 });
    }

    const ocrResult: MistralOCRResponse = await ocrRes.json();

    const pages = ocrResult.pages
      .sort((a, b) => a.index - b.index)
      .map((p) => p.markdown.trim())
      .filter((p) => p);

    if (!pages.length) {
      return NextResponse.json(
        { error: 'No text found in document' },
        { status: 422 }
      );
    }

    // 5. Embed pages + store metadata in user_documents / user_documents_vec
    await processFile(pages, fileName, userId);
    revalidatePath('/chat', 'layout');
    revalidatePath('/filer');
    return NextResponse.json({ status: 'SUCCESS' });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
