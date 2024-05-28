'use server';
import React from 'react';
import { createAI, getMutableAIState, createStreamableUI } from 'ai/rsc';
import { streamText, Message } from 'ai';
import { Box, Typography, CircularProgress } from '@mui/material';
import { BotMessage, UserMessage } from './component/botmessage';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';
import { format } from 'date-fns';
import { saveChatToRedis } from './lib/redis';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { getUserInfo, getSession } from '@/lib/client/supabase';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

const getModel = (selectedModel: 'claude3' | 'chatgpt4') => {
  if (selectedModel === 'claude3') {
    return anthropic('claude-3-opus-20240229');
  } else if (selectedModel === 'chatgpt4') {
    return openai('gpt-4o');
  }
  throw new Error('Invalid model selected');
};

async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<{
  success?: boolean;
  message?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  id?: number;
  display?: React.ReactElement;
  chatId?: string;
}> {
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
      content: currentUserMessage,
      id: uuidv4()
    }
  ]);

  const uiStream = createStreamableUI(
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      mb={2}
      p={2}
      borderRadius={4}
      bgcolor="grey.100"
      sx={{
        backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
        boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
        transition: 'background-color 0.3s ease',
        ':hover': {
          bgcolor: 'grey.200'
        }
      }}
    >
      <Typography variant="body1" color="textSecondary" fontStyle="italic">
        Searching...
      </Typography>
    </Box>
  );

  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    uiStream.update(
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        p={2}
        borderRadius={4}
        bgcolor="grey.100"
        sx={{
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography variant="body1" color="textSecondary" fontStyle="italic">
          Found relevant website. Scraping data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    uiStream.update(
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        p={2}
        borderRadius={4}
        bgcolor="grey.100"
        sx={{
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography variant="body1" color="textSecondary" fontStyle="italic">
          Analyzing scraped data...
        </Typography>
        <CircularProgress size={20} sx={{ marginLeft: 2 }} />
      </Box>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    uiStream.update(
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
        p={2}
        borderRadius={4}
        bgcolor="grey.100"
        sx={{
          backgroundImage: 'linear-gradient(45deg, #e0eaFC #cfdef3)',
          boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
          transition: 'background-color 0.3s ease',
          ':hover': {
            bgcolor: 'grey.200'
          }
        }}
      >
        <Typography variant="body1" color="textSecondary" fontStyle="italic">
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...aiState.get().map((info: any) => ({
          role: info.role,
          content: info.content,
          name: info.name
        }))
      ],
      onFinish: async (event) => {
        const { text } = event;
        //const { promptTokens, completionTokens, totalTokens } = usage;

        await saveChatToRedis(
          CurrentChatSessionId,
          session.id,
          text,
          fullResponse
        );

        aiState.done([
          ...aiState.get(),
          { role: 'assistant', content: fullResponse, id: uuidv4() }
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
    id: Date.now(),
    display: uiStream.value,
    chatId: CurrentChatSessionId
  };
}

type MessageFromDB = {
  id: string;
  prompt: string;
  completion: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

async function ChatHistoryUpdate(
  full_name: string,
  chatId: string,
  userId: string
): Promise<{
  uiMessages: { id: number | string | null; display: React.ReactNode }[];
  chatId: string;
}> {
  'use server';

  async function fetchChatData(chatKey: string): Promise<{
    metadata: Omit<MessageFromDB, 'prompt' | 'completion'> | null;
    prompts: string[];
    completions: string[];
  }> {
    try {
      const pipeline = redis.pipeline();
      pipeline.hgetall(chatKey);
      pipeline.lrange(`${chatKey}:prompts`, 0, -1);
      pipeline.lrange(`${chatKey}:completions`, 0, -1);

      const [metadata, prompts, completions] = await pipeline.exec();

      return {
        metadata: metadata as Omit<
          MessageFromDB,
          'prompt' | 'completion'
        > | null,
        prompts: prompts as string[],
        completions: completions as string[]
      };
    } catch (error) {
      console.error('Error fetching chat data from Redis:', error);
      return {
        metadata: null,
        prompts: [],
        completions: []
      };
    }
  }

  const chatKey = `chat:${chatId}-user:${userId}`;
  const chatDataResult = await fetchChatData(chatKey);

  const chatData: MessageFromDB = chatDataResult
    ? {
        id: chatId,
        prompt: JSON.stringify(chatDataResult.prompts),
        completion: JSON.stringify(chatDataResult.completions),
        user_id: userId,
        created_at: chatDataResult.metadata?.created_at
          ? format(
              new Date(chatDataResult.metadata.created_at),
              'dd-MM-yyyy HH:mm'
            )
          : '',
        updated_at: chatDataResult.metadata?.updated_at
          ? format(
              new Date(chatDataResult.metadata.updated_at),
              'dd-MM-yyyy HH:mm'
            )
          : ''
      }
    : {
        id: '',
        prompt: '[]',
        completion: '[]',
        user_id: null,
        created_at: '',
        updated_at: ''
      };

  const userMessages = JSON.parse(chatData.prompt) as string[];
  const assistantMessages = JSON.parse(chatData.completion) as string[];
  const combinedMessages: Message[] = [];

  for (
    let i = 0;
    i < Math.max(userMessages.length, assistantMessages.length);
    i++
  ) {
    if (userMessages[i]) {
      combinedMessages.push({
        role: 'user',
        id: `user-${i}`,
        content: userMessages[i]
      });
    }
    if (assistantMessages[i]) {
      combinedMessages.push({
        role: 'assistant',
        id: `assistant-${i}`,
        content: assistantMessages[i]
      });
    }
  }

  const aiState = getMutableAIState<typeof AI>();
  const aiStateMessages = combinedMessages.map((message) => ({
    role:
      message.role === 'user' || message.role === 'assistant'
        ? message.role
        : ('system' as const),
    content: message.content,
    id: message.id
  }));
  aiState.done(aiStateMessages);
  const uiMessages = combinedMessages.map((message) => {
    if (message.role === 'user') {
      return {
        id: message.id,
        display: (
          <UserMessage full_name={full_name}>{message.content}</UserMessage>
        )
      };
    } else {
      return {
        id: message.id,
        display: <BotMessage>{message.content}</BotMessage>
      };
    }
  });

  return { uiMessages, chatId };
}

const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
  chatId?: string | null;
}[] = [];

const initialUIState: {
  id: number | string | null;
  display: React.ReactNode;
  chatId?: string | null;
}[] = [];

export const AI = createAI({
  actions: {
    submitMessage,
    ChatHistoryUpdate
  },
  initialUIState,
  initialAIState
});
