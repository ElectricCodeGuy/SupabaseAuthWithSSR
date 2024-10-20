import React from 'react';
import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import { streamText, generateId } from 'ai';
import { Box, Typography, CircularProgress } from '@mui/material';
import { BotMessage, UserMessage } from './component/botmessage';
import { v4 as uuidv4 } from 'uuid';
import { saveChatToSupbabase } from './lib/SaveToDb';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/server/supabase';
import { createServerSupabaseClient } from '@/lib/server/server';

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

  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0
    };
  }
  const userInfo = await getUserInfo(session.id);
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

    const result = await streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
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
          session.id,
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

  const supabase = createServerSupabaseClient();

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

    return {
      success: true,
      message: 'Conversation reset successfully.'
    };
  } catch (error) {
    console.error('Error resetting chat messages:', error);
    return {
      success: false,
      message:
        'Error resetting chat messages. Please try again later or contact support.'
    };
  }
}
type ServerMessage = {
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
  ChatHistoryUpdate: (
    full_name: string,
    chatId: string
  ) => Promise<ChatHistoryUpdateResult>;
  resetMessages: () => Promise<ResetResult>;
};

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    ChatHistoryUpdate,
    resetMessages
  },
  initialUIState,
  initialAIState
});
