import React from 'react';
import {
  getMutableAIState,
  createStreamableUI,
  createStreamableValue
} from 'ai/rsc';
import { streamText, generateId } from 'ai';
import { Loader2 } from 'lucide-react';

import { BotMessage } from '../component/ChatWrapper';
import { v4 as uuidv4 } from 'uuid';
import { getUserInfo } from '@/lib/server/supabase';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/server/server';
import type { AI } from './shared';

import {
  type SubmitMessageResult,
  getModel,
  saveChatToSupbabase
} from './shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const SYSTEM_TEMPLATE = `You are a helpful assistant. Answer all questions to the best of your ability. Provide helpful answers in markdown.`;

export async function submitMessage(
  currentUserMessage: string,
  model_select: 'claude3' | 'chatgpt4',
  chatId: string
): Promise<SubmitMessageResult> {
  'use server';

  const CurrentChatSessionId = chatId || uuidv4();

  const aiState = getMutableAIState<AI>();
  const status = createStreamableValue('searching');

  const userInfo = await getUserInfo();
  if (!userInfo) {
    status.done('done');
    return {
      success: false,
      message: 'User not found. Please try again later.',
      limit: 0,
      remaining: 0,
      reset: 0,
      status: status.value
    };
  }
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '24h') // 30 msg per 24 hours
  });
  const { success, limit, reset, remaining } = await ratelimit.limit(
    `ratelimit_${userInfo.id}`
  );
  if (!success) {
    status.done('done');
    console.log('Rate limit exceeded. Please try again later.');
    console.log('Limit:', limit);
    console.log('Remaining:', remaining);
    console.log('Reset:', reset);
    return {
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      limit,
      remaining,
      reset,
      status: status.value
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
  // We only check on the very first message if we have a cached result.
  // We don't want to check on every message since the user could ask questions like: "Tell me more"
  // and we don't want to check the cache on those.
  if (!chatId) {
    const cachedResult: string | null = await redis.get(
      `text_${currentUserMessage}`
    );
    if (cachedResult) {
      const uiStream = createStreamableUI(
        <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors duration-300 shadow-md">
          <CardContent className="p-4 flex justify-center items-center">
            <p className="text-gray-600 italic">
              Found relevant website. Scraping data...
            </p>
          </CardContent>
        </Card>
      );

      aiState.done([
        ...aiState.get(),
        { role: 'assistant', content: cachedResult }
      ]);

      const chunkSize = 10;
      const baseDelay = 100;
      const variation = 5;
      const textStream = createStreamableValue();

      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update UI to show BotMessage with streaming content
        uiStream.update(<BotMessage textStream={textStream.value} />);
        status.update('generating');
        for (let i = 0; i < cachedResult.length; i += chunkSize) {
          const chunk = cachedResult.slice(i, i + chunkSize);

          textStream.append(chunk);

          await new Promise((resolve) =>
            setTimeout(
              resolve,
              baseDelay + (Math.random() * (variation * 2) - variation)
            )
          );
        }
        uiStream.update(<BotMessage textStream={textStream.value} />);
        if (userInfo.id) {
          await saveChatToSupbabase(
            CurrentChatSessionId,
            userInfo.id,
            currentUserMessage,
            cachedResult
          );
        }
        textStream.done();
        status.done('done');
        uiStream.done();
      })().catch((e) => {
        console.error('Error in chat handler:', e);
        uiStream.error(
          <Alert
            variant="destructive"
            className="mb-4 bg-gradient-to-r from-red-50 to-red-100 shadow-md"
          >
            <AlertDescription>
              An error occurred while processing your request. Please try again
            </AlertDescription>
          </Alert>
        );
        status.done('done');
      });

      return {
        id: generateId(),
        display: uiStream.value,
        chatId: CurrentChatSessionId,
        status: status.value
      };
    }
  }
  const uiStream = createStreamableUI(
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors duration-300 shadow-md">
      <CardContent className="p-4 flex justify-center items-center">
        <p className="text-gray-600 italic">Searching...</p>
      </CardContent>
    </Card>
  );
  const dataStream = createStreamableValue();
  (async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors duration-300 shadow-md">
        <CardContent className="p-4 flex justify-center items-center">
          <p className="text-gray-600 italic">
            Found relevant website. Scraping data...
          </p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors duration-300 shadow-md">
        <CardContent className="p-4 flex justify-center items-center">
          <p className="text-gray-600 italic">Analyzing scraped data...</p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

    uiStream.update(
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-blue-100 transition-colors duration-300 shadow-md">
        <CardContent className="p-4 flex justify-center items-center">
          <p className="text-gray-600 italic">Generating response...</p>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    );

    const { textStream } = streamText({
      model: getModel(model_select),
      maxTokens: 4000,
      temperature: 0,
      frequencyPenalty: 0.5,
      system: SYSTEM_TEMPLATE,
      messages: [
        ...aiState
          .get()
          .slice(-7) // Limit to the last 7 messages to avoid overwhelming the model
          .map((info) => ({
            role: info.role,
            content: info.content,
            name: info.name
          }))
      ],
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'general_chat',
        metadata: {
          userId: userInfo.id,
          chatId: CurrentChatSessionId,
          isNewChat: !chatId
        },
        recordInputs: true,
        recordOutputs: true
      },
      onFinish: async (event) => {
        const { text, usage } = event;
        const { promptTokens, completionTokens, totalTokens } = usage;
        console.log('Prompt Tokens:', promptTokens);
        console.log('Completion Tokens:', completionTokens);
        console.log('Total Tokens:', totalTokens);
        aiState.done([...aiState.get(), { role: 'assistant', content: text }]);

        await saveChatToSupbabase(
          CurrentChatSessionId,
          userInfo.id,
          currentUserMessage,
          text
        );

        // Only cache the very first message
        if (!chatId) {
          await redis.set(`text_${currentUserMessage}`, text, {
            ex: 60 * 60 * 24 * 90 // 90 days in seconds (3 month)
          });
        }
      }
    });

    let isFirstChunk = true;

    for await (const textDelta of textStream) {
      if (isFirstChunk) {
        // Only create the UI stream when we receive the first chunk
        uiStream.update(<BotMessage textStream={dataStream.value} />);
        isFirstChunk = false;
      }
      dataStream.append(textDelta);
    }
    // We update here to prevent the UI from flickering
    uiStream.update(<BotMessage textStream={dataStream.value} />);

    dataStream.done();
    uiStream.done();
    status.done('done');
  })().catch((e) => {
    console.error('Error in chat handler:', e);
    uiStream.error(
      <Alert
        variant="destructive"
        className="mb-4 bg-gradient-to-r from-red-50 to-red-100 shadow-md"
      >
        <AlertDescription>
          An error occurred while processing your request. Please try again
          later.
        </AlertDescription>
      </Alert>
    );
    status.done('done');
  });
  return {
    id: generateId(),
    display: uiStream.value,
    chatId: CurrentChatSessionId,
    status: status.value
  };
}
