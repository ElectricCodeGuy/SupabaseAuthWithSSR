import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

const contentAnalysisSchema = z.object({
  preliminary_answer_1: z
    .string()
    .describe(
      'Generate a preliminary answer based on the provided text context. The answer should be a concise, informative response that addresses the specifics of the context under consideration. Responses must be tailored to provide clear, preliminary insights or guidance relevant to the presented scenario.'
    ),
  preliminary_answer_2: z
    .string()
    .describe(
      'Generate a second preliminary answer based on the provided text context. The answer should be a concise, informative response that addresses the specifics of the context under consideration. Responses must be tailored to provide clear, preliminary insights or guidance relevant to the presented scenario.'
    ),
  tags: z
    .array(z.string())
    .describe(
      'Identify and tag key concepts or topics within the provided text for categorization and indexing purposes. Each tag in the array represents a specific topic, theme, or concept found within the text, ensuring they accurately reflect the nuances and specifics of the subject matter being addressed.'
    ),
  hypothetical_question_1: z
    .string()
    .describe(
      'Generate a hypothetical question based on the provided text. The question should explore possible scenarios, implications, or considerations that arise from the content. Questions aim to provoke thought, analysis, or discussion on potential outcomes or interpretations.'
    ),
  hypothetical_question_2: z
    .string()
    .describe(
      'Generate a second hypothetical question based on the provided text. The question should explore possible scenarios, implications, or considerations that arise from the content. Questions aim to provoke thought, analysis, or discussion on potential outcomes or interpretations.'
    )
});

export const preliminaryAnswerChainAgent = async (
  content: string,
  userId: string
) => {
  const SystemPrompt =
    'Given the content provided below, perform a comprehensive analysis. Generate two preliminary answers, tag key concepts or topics, and generate two hypothetical questions. Ensure all outputs address specific elements mentioned in the text. Focus on interpreting key themes, implications of specific concepts, and potential real-life applications or consequences. Answers and questions should be detailed and thought-provoking. The output language should be in the same as the input text.';

  const { object, usage } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: SystemPrompt,
    prompt: content,
    schema: contentAnalysisSchema,
    mode: 'json',
    abortSignal: AbortSignal.timeout(15000),
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'upload_doc_preliminary',
      metadata: {
        userId
      },
      recordInputs: true,
      recordOutputs: true
    }
  });

  return { object, usage };
};

const documentMetadataSchema = z.object({
  descriptiveTitle: z
    .string()
    .describe(
      'Generate a descriptive title that accurately represents the main topic or theme of the entire document.'
    ),

  shortDescription: z
    .string()
    .describe(
      'Provide a explanatory description that summarizes what the document is about, its key points, and its potential significance.'
    ),

  mainTopics: z
    .array(z.string())
    .describe('List up to 5 main topics or themes discussed in the document.'),

  keyEntities: z
    .array(z.string())
    .describe(
      'Identify up to 10 key entities (e.g., people, organizations, laws, concepts) mentioned in the document.'
    ),
  primaryLanguage: z
    .string()
    .describe('Identify the primary language used in the document content.')
});

export const generateDocumentMetadata = async (
  content: string,
  userId: string
) => {
  const SystemPrompt = `
  Analyze the provided document content thoroughly and generate comprehensive metadata. 
  Your task is to extract key information that will help in understanding the document's context, 
  relevance, and potential applications. This metadata will be used to provide context for AI-assisted 
  querying of document chunks, so focus on information that will be most useful for understanding 
  and answering questions about the document content.

  Remember, this metadata will be crucial in providing context for AI systems when answering user queries about the document.
  The output language should be in the same as the input text.
  `;

  const { object, usage, finishReason } = await generateObject({
    model: openai('gpt-4o-mini'),
    system: SystemPrompt,
    prompt: content,
    schema: documentMetadataSchema,
    mode: 'json',
    temperature: 0,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'upload_doc_main',
      metadata: {
        userId
      },
      recordInputs: true,
      recordOutputs: true
    }
  });

  return { object, usage, finishReason };
};
