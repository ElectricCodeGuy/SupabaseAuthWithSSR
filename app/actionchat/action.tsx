import React from 'react';
import {
  createAI,
  getMutableAIState,
  createStreamableUI,
  getAIState
} from 'ai/rsc';
import { streamText, generateId, smoothStream, embed } from 'ai';
import { Box, Typography, CircularProgress } from '@mui/material';
import { BotMessage, UserMessage } from './component/botmessage';
import { v4 as uuidv4 } from 'uuid';
import { saveChatToSupbabase } from './lib/SaveToDb';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';
import { redirect } from 'next/navigation';
import { Pinecone, type Index } from '@pinecone-database/pinecone';

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-5-sonnet-20240620');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  return anthropic('claude-3-5-sonnet-20240620');
};

async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<typeof AI>();

  const userInfo = await getUserInfo();
  if (!userInfo) {
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }

  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 4,
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',

        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'textSecondary',
          fontStyle: 'italic'
        }}
      >
        Searching...
      </Typography>
    </Box>
  );

  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Found relevant website. Scraping data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Analyzing scraped data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Generating response...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    const result = streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
      experimental_transform: smoothStream({ delayInMs: 20 }),
      messages: [
        ...aiState.get().map((info) => ({
          role: info.role,
          content: info.content,
          name: info.name
        }))
      ],
      onFinish: async (event) => {
        const { text, usage } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
        /*  If you want to track the usage of the AI model, you can use the following code:'
      import { track } from '@vercel/analytics/server';
        track('ailoven', {
          systemPromptTemplate,
          currnetUserMessage,
          fullResponse: text,
          promptTokens,
          completionTokens,
          totalTokens
        });
      }
      Check out Vercel track functionallity
          */
      }
    });

    let fullResponse = '';
    for await (const textDelta of result.textStream) {
      fullResponse += textDelta;
      uiStream.update(<BotMessage>{fullResponse}</BotMessage>);
    }

    uiStream.done();
  })();
  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId
  };
}

type ChatSessionWithMessages = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  chat_messages: {
    id: string;
    is_user_message: boolean;
    content: string | null;
    created_at: string;
  }[];
};

async function ChatHistoryUpdate(
  full_name: string,
  chatId: string
): Promise<ChatHistoryUpdateResult> {
  'use server';
  const session = await getSession();
  if (!session) {
    return { uiMessages: [], chatId: '' };
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { data: chatData, error } = await supabase
      .from('chat_sessions')
      .select(
        `
        id,
        user_id,
        created_at,
        updated_at,
        chat_messages (
          id,
          is_user_message,
          content,
          created_at
        )
      `
      )
      .eq('id', chatId)
      .eq('user_id', session.id)
      .order('created_at', {
        ascending: true,
        referencedTable: 'chat_messages'
      })
      .single();

    if (error) throw error;

    if (!chatData) {
      return { uiMessages: [], chatId: '' };
    }

    const typedChatData = chatData as ChatSessionWithMessages;

    const combinedMessages: {
      role: 'user' | 'assistant';
      id: string;
      content: string;
    }[] = typedChatData.chat_messages.map((message) => ({
      role: message.is_user_message ? 'user' : 'assistant',
      id: message.id,
      content: message.content || ''
    }));

    const aiState = getMutableAIState<typeof AI>();
    const aiStateMessages: ServerMessage[] = combinedMessages.map(
      (message) => ({
        role: message.role,
        content: message.content
      })
    );
    aiState.done(aiStateMessages);

    const uiMessages: ClientMessage[] = combinedMessages.map((message) => {
      if (message.role === 'user') {
        return {
          id: message.id,
          role: 'user',
          display: (
            <UserMessage full_name={full_name}>{message.content}</UserMessage>
          ),
          chatId: chatId
        };
      } else {
        return {
          id: message.id,
          role: 'assistant',
          display: <BotMessage>{message.content}</BotMessage>,
          chatId: chatId
        };
      }
    });

    return { uiMessages, chatId };
  } catch (error) {
    console.error('Error fetching chat data from Supabase:', error);
    return { uiMessages: [], chatId: '' };
  }
}

type ResetResult = {
  success: boolean;
  message: string;
};
async function resetMessages(): Promise<ResetResult> {
  'use server';

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Error: User not found. Please try again later.'
    };
  }

  const aiState = getMutableAIState<typeof AI>();

  try {
    // Clear all messages from the AI state

    // Clear all messages from the AI state by setting it to an empty array
    aiState.update([]);

    // Call done to finalize the state update
    aiState.done([]);
  } catch (error) {
    console.error('Error resetting chat messages:', error);
    return {
      success: false,
      message:
        'Error resetting chat messages. Please try again later or contact support.'
    };
  }
  redirect('/actionchat');
}

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function initPineconeIndex(ns: string): Promise<Index> {
  const indexName = process.env.PINECONE_INDEX_NAME!;
  const pinecone = new Pinecone();
  return pinecone.index(indexName).namespace(ns);
}

async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-large'),
    value: text
  });
  return embedding;
}

interface DocumentMetadata {
  text: string;
  title: string;
  timestamp: string;
  ai_title: string;
  ai_description: string;
  ai_maintopics: string;
  ai_keyentities: string;
  filterTags: string;
  page: number;
  totalPages: number;
  chunk: number;
  totalChunks: number;
}

async function uploadFilesAndQuery(
  currentUserMessage: string,
  chatId: string,
  model_select: 'claude3' | 'chatgpt4',
  selectedFiles: string[]
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<typeof AI>();

  const userInfo = await getUserInfo();
  if (!userInfo) {
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }

  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content: currentUserMessage
    }
  ]);

  const uiStream = createStreamableUI(
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 2,
        p: 2,
        borderRadius: 4,
        bgcolor: 'grey.100',
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',

        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: 'textSecondary',
          fontStyle: 'italic'
        }}
      >
        Searching...
      </Typography>
    </Box>
  );
  // We need to come up with a better way to handle this.
  // This is a temporary solution to avoid the issue of the user not being able to see the response.
  const sanitizedFilenames = selectedFiles.map((filename) => {
    // Split the filename and timestamp
    const [name, timestamp] = filename.split('[[');

    // Sanitize only the filename part
    const sanitizedName = sanitizeFilename(name);

    // Reconstruct the filename with the original timestamp
    return timestamp ? `${sanitizedName}[[${timestamp}` : sanitizedName;
  });

  (async () => {
    const pineconeIndex = await initPineconeIndex(`document_${userInfo.id}`);

    const filter = {
      filterTags: { $in: sanitizedFilenames }
    };

    const queryEmbedding = await embedQuery(currentUserMessage);

    const queryResponse = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 40,
      includeMetadata: true,
      filter: filter
    });

    const searchResults =
      queryResponse.matches?.map((match) => ({
        pageContent: match.metadata?.text || '',
        metadata: match.metadata as unknown as DocumentMetadata
      })) || [];

    uiStream.update(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'grey.100',
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',

          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: 'textSecondary',
            fontStyle: 'italic'
          }}
        >
          Relevant data is found. Generating response...
        </Typography>
      </Box>
    );

    const formattedSearchResults = (() => {
      // Group results by document (using title and timestamp as identifier)
      const groupedResults = searchResults.reduce(
        (acc, result) => {
          const key = `${result.metadata.title}[[${result.metadata.timestamp}]]`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(result);
          return acc;
        },
        {} as Record<string, typeof searchResults>
      );

      // Sort and format each group
      return Object.entries(groupedResults)
        .map(([_key, docs]) => {
          // Sort documents by page number
          docs.sort(
            (a, b) => (a.metadata.page as number) - (b.metadata.page as number)
          );

          // Extract common metadata (only once per document)
          const {
            ai_title,
            ai_description,
            ai_maintopics,
            ai_keyentities,
            title,
            timestamp
          } = docs[0].metadata;

          // Format the document group
          return `
<document>
  <metadata>
    <title>${title}</title>
    <timestamp>${timestamp}</timestamp>
    <ai_title>${ai_title}</ai_title>
    <ai_description>${ai_description}</ai_description>
    <ai_maintopics>${ai_maintopics}</ai_maintopics>
    <ai_keyentities>${ai_keyentities}</ai_keyentities>
  </metadata>
  <content>
    ${docs
      .map(
        (doc) => `
    <page number="${doc.metadata.page}">
      <reference_link>[${doc.metadata.title}, s.${doc.metadata.page}](<?pdf=${doc.metadata.title.replace(/ /g, '_').trim()}&p=${doc.metadata.page}>)</reference_link>
      <text>${doc.pageContent}</text>
    </page>`
      )
      .join('')}
  </content>
</document>`;
        })
        .join('\n');
    })();

    const systemPromptTemplate = (() => {
      // Get actual document examples from search results
      const documentExamples = searchResults
        .slice(0, 2)
        .map(
          (result) =>
            `[${result.metadata.title}, s.${result.metadata.page}](<?pdf=${result.metadata.title.replace(/ /g, '_').trim()}&p=${result.metadata.page}>)`
        )
        .join(' og ');
      return `
<instructions>
Based on the content in the search results extracted from the uploaded files, please provide an answer to the question. The search results contain information relevant to the query.

IMPORTANT: Every time you use information from the documents, you must immediately add a reference after the relevant information. The reference MUST be in Markdown link format and include the document title and page number as a search parameter.

The Markdown link format must be exactly as follows:

[Document title, p.X](<?pdf=Document_title&p=X>)

where X is the page number.

For example:
"The law states that... ${documentExamples}"

This Markdown link format is crucial as it makes the references clickable and leads directly to the relevant page in the document. Please use this Markdown reference format consistently throughout your answer.

If the given content does not seem to contain sufficient information to answer the question, please suggest asking the question differently or provide more context. Do your best to help based on the available information.

If relevant information cannot be found to answer the question, please inform about this and suggest a rephrasing or request additional details.

Please respond in the same language as the user's question.
</instructions>

<search_results>
${formattedSearchResults}
</search_results>
`;
    })();

    const result = streamText({
      model: getModel(model_select),
      system: systemPromptTemplate,
      messages: [
        ...aiState
          .get()
          .slice(-7)
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      onFinish: async (event) => {
        const { usage, text } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse }
        ]);
      }
    });

    let fullResponse = '';
    for await (const textDelta of result.textStream) {
      fullResponse += textDelta;
      uiStream.update(<BotMessage>{fullResponse}</BotMessage>);
    }
    uiStream.done();
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          p: 2,
          borderRadius: 4,
          bgcolor: 'error.light',
          color: 'error.contrastText',
          backgroundImage: 'linear-gradient(45deg, #FFCCCB, #FFB6C1)',
          boxShadow: '0 3px 5px 2px rgba(255, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'error.main'
          }
        }}
      >
        <Typography variant="body1">
          An error occurred while processing your request. Please try again
          later.
        </Typography>
      </Box>
    );
  });

  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId
  };
}

export type ServerMessage = {
  role: 'user' | 'assistant';
  content: string;
  name?: string;
};

export type ClientMessage = {
  id: string | number | null;
  role: 'user' | 'assistant';
  display: React.ReactNode;
  chatId?: string | null;
};

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

export type SubmitMessageResult = {
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: string;
  display?: React.ReactNode;
  chatId?: string;
};

export type ChatHistoryUpdateResult = {
  uiMessages: ClientMessage[];
  chatId: string;
};

type Actions = {
  submitMessage: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  uploadFilesAndQuery: (
    currentUserMessage: string,
    chatId: string,
    model_select: 'claude3' | 'chatgpt4',
    selectedFiles: string[]
  ) => Promise<SubmitMessageResult>;
  ChatHistoryUpdate: (
    full_name: string,
    chatId: string
  ) => Promise<ChatHistoryUpdateResult>;
  resetMessages: () => Promise<ResetResult>;
};

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    uploadFilesAndQuery,
    ChatHistoryUpdate,
    resetMessages
  },
  onGetUIState: async () => {
    'use server';

    // Get current history from app state
    const historyFromApp = getAIState();

    if (historyFromApp) {
      const session = await getSession();
      // If in sync, return current app state
      return historyFromApp.map((message: ServerMessage) => ({
        id: generateId(),
        role: message.role,
        display:
          message.role === 'user' ? (
            <UserMessage
              full_name={session?.user_metadata.full_name || 'Unknown'}
            >
              {message.content}
            </UserMessage>
          ) : (
            <BotMessage>{message.content}</BotMessage>
          )
      }));
    } else {
      return;
    }
  },
  initialUIState,
  initialAIState
});
