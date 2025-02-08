import React from 'react';
import { createAI, getMutableAIState, getAIState } from 'ai/rsc';
import { generateId } from 'ai';
import {
  BotMessage,
  UserMessage,
  InternetSearchToolResults
} from '../component/ChatWrapper';
import { getSession } from '@/lib/server/supabase';
import { submitMessage } from './GeneralAction';
import { uploadFilesAndQuery } from './UploadAction';
import { SearchTool } from './SearchAction';
import type {
  ServerMessage,
  ClientMessage,
  ResetResult,
  SubmitMessageResult
} from './shared';
import { redirect } from 'next/navigation';

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

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

interface Actions {
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
  SearchTool: (
    currentUserMessage: string,
    model_select: 'claude3' | 'chatgpt4',
    chatId: string
  ) => Promise<SubmitMessageResult>;
  resetMessages: () => Promise<ResetResult>;
  [key: string]: (...args: any[]) => Promise<any>;
}

export const AI = createAI<ServerMessage[], ClientMessage[], Actions>({
  actions: {
    submitMessage,
    uploadFilesAndQuery,
    SearchTool,
    resetMessages
  },
  onGetUIState: async () => {
    'use server';

    const historyFromApp = getAIState();

    if (historyFromApp) {
      const session = await getSession();
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
            <>
              <BotMessage>{message.content}</BotMessage>
              {message.sources && message.sources.length > 0 && (
                <InternetSearchToolResults searchResults={message.sources} />
              )}
            </>
          )
      }));
    } else {
      return;
    }
  },
  initialUIState,
  initialAIState
});
