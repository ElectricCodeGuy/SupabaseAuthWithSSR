import React from 'react';
import { createAI, getAIState } from 'ai/rsc';
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
import { resetMessages } from './ResetMessageAction';
import type { ServerMessage, ClientMessage, AIActions } from './shared';

const initialAIState: ServerMessage[] = [];
const initialUIState: ClientMessage[] = [];

export const AI = createAI<ServerMessage[], ClientMessage[], AIActions>({
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
