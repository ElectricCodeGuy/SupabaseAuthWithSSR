import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';
import type { LanguageModelV2Source } from '@ai-sdk/provider';
import type { ToolResult } from '@/app/chat/types/tooltypes';
import type { FileUIPart } from 'ai';

export interface OpenAiLog {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const saveChatToSupbabase = async (
  chatSessionId: string,
  userId: string,
  currentMessageContent: string,
  completion: string,
  attachments?: FileUIPart[],
  reasoning?: string,
  sources?: LanguageModelV2Source[],
  toolInvocations?: ToolResult[]
): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }

  const supabase = await createServerSupabaseClient();

  try {
    const now = new Date();
    const aiMessageTime = new Date(now.getTime() + 1000);

    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: aiMessageTime.toISOString()
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Generate message IDs
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    // Prepare message parts for user message
    const userParts = [];

    // Add text part for user message
    userParts.push({
      chat_session_id: chatSessionId,
      message_id: userMessageId,
      role: 'user',
      type: 'text',
      order: 0,
      text_text: currentMessageContent,
      created_at: now.toISOString()
    });

    // Add file parts if attachments exist
    if (attachments && attachments.length > 0) {
      attachments.forEach((attachment, index) => {
        userParts.push({
          chat_session_id: chatSessionId,
          message_id: userMessageId,
          role: 'user',
          type: 'file',
          order: index + 1,
          file_url: attachment.url,
          file_filename: attachment.filename,
          file_mediatype: attachment.mediaType || 'application/pdf',
          created_at: now.toISOString()
        });
      });
    }

    // Prepare message parts for assistant message
    const assistantParts = [];
    let orderIndex = 0;

    // Add text part for assistant message
    assistantParts.push({
      chat_session_id: chatSessionId,
      message_id: assistantMessageId,
      role: 'assistant',
      type: 'text',
      order: orderIndex++,
      text_text: completion,
      created_at: aiMessageTime.toISOString()
    });

    // Add reasoning part if exists
    if (reasoning) {
      assistantParts.push({
        chat_session_id: chatSessionId,
        message_id: assistantMessageId,
        role: 'assistant',
        type: 'reasoning',
        order: orderIndex++,
        reasoning_text: reasoning,
        created_at: aiMessageTime.toISOString()
      });
    }

    // Add source parts if exist
    if (sources && sources.length > 0) {
      sources.forEach((source) => {
        if ('url' in source) {
          assistantParts.push({
            chat_session_id: chatSessionId,
            message_id: assistantMessageId,
            role: 'assistant',
            type: 'source-url',
            order: orderIndex++,
            source_url_id: source.id,
            source_url_url: source.url,
            source_url_title: source.title,
            created_at: aiMessageTime.toISOString()
          });
        }
      });
    }

    // Add tool parts if exist
    if (toolInvocations && toolInvocations.length > 0) {
      toolInvocations.forEach((tool) => {
        if (tool.toolName === 'searchUserDocument') {
          assistantParts.push({
            chat_session_id: chatSessionId,
            message_id: assistantMessageId,
            role: 'assistant',
            type: 'tool-searchUserDocument',
            order: orderIndex++,
            tool_searchuserdocument_toolcallid: crypto.randomUUID(),
            tool_searchuserdocument_state: 'output-available',
            tool_searchuserdocument_input: tool.input,
            tool_searchuserdocument_output: tool.output,
            created_at: aiMessageTime.toISOString()
          });
        } else if (tool.toolName === 'websiteSearchTool') {
          assistantParts.push({
            chat_session_id: chatSessionId,
            message_id: assistantMessageId,
            role: 'assistant',
            type: 'tool-websiteSearchTool',
            order: orderIndex++,
            tool_websitesearchtool_toolcallid: crypto.randomUUID(),
            tool_websitesearchtool_state: 'output-available',
            tool_websitesearchtool_input: tool.input,
            tool_websitesearchtool_output: tool.output,
            created_at: aiMessageTime.toISOString()
          });
        }
      });
    }

    // Insert all parts in one query
    const { error: partsError } = await supabase
      .from('message_parts')
      .insert([...userParts, ...assistantParts]);

    if (partsError) throw partsError;
  } catch (error) {
    console.error('Error saving chat to Supabase:', error);
  }
};
