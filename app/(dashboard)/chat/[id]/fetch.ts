import 'server-only';

import { createServerSupabaseClient } from '@/lib/server/server';
import type {
  UIMessage,
  UIMessagePart,
  TextUIPart,
  ReasoningUIPart,
  FileUIPart,
  SourceUrlUIPart,
  SourceDocumentUIPart,
  ToolUIPart
} from 'ai';
import type { Tables } from '@/types/database';
import type { UITools } from '@/app/(dashboard)/chat/types/tooltypes';
import { notFound } from 'next/navigation';

type MessagePart = Tables<'message_parts'>;

// Helper function to reconstruct parts from database rows
function reconstructPart(
  part: MessagePart
): UIMessagePart<any, UITools> | null {
  switch (part.type) {
    case 'text': {
      if (!part.text_text) return null;
      const textPart: TextUIPart = {
        type: 'text',
        text: part.text_text
      };
      return textPart;
    }

    case 'reasoning': {
      if (!part.reasoning_text) return null;
      const reasoningPart: ReasoningUIPart = {
        type: 'reasoning',
        text: part.reasoning_text
      };
      return reasoningPart;
    }

    case 'file': {
      if (!part.file_url) return null;
      const filePart: FileUIPart = {
        type: 'file',
        mediaType: part.file_mediatype || '',
        filename: part.file_filename || undefined,
        url: part.file_url
      };
      return filePart;
    }

    case 'source-url': {
      if (!part.source_url_url) return null;
      const sourceUrlPart: SourceUrlUIPart = {
        type: 'source-url',
        sourceId: part.source_url_id || '',
        url: part.source_url_url,
        title: part.source_url_title || undefined
      };
      return sourceUrlPart;
    }

    case 'source-document': {
      if (!part.source_document_title || !part.source_document_mediatype)
        return null;
      const sourceDocPart: SourceDocumentUIPart = {
        type: 'source-document',
        sourceId: part.source_document_id || '',
        mediaType: part.source_document_mediatype,
        title: part.source_document_title,
        filename: part.source_document_filename || undefined
      };
      return sourceDocPart;
    }

    // Tool parts - all tools share the generic tool_* columns; `type` tells us
    // which tool this row is.
    case 'tool-searchUserDocument':
    case 'tool-websiteSearchTool':
    case 'tool-saveMemory':
    case 'tool-conversationSearch':
    case 'tool-createChart':
    case 'tool-createPDF':
    case 'tool-createArtifact':
    case 'tool-updateArtifact': {
      const toolPart: ToolUIPart<UITools> = {
        type: part.type,
        approval: (part.tool_approval as any) || undefined,
        toolCallId: part.tool_toolcallid || '',
        state: (part.tool_state as any) || 'input-available',
        input: part.tool_input as any,
        output: part.tool_output as any,
        errorText: part.tool_errortext || undefined,
        providerExecuted: part.tool_providerexecuted || undefined
      };
      return toolPart;
    }

    default:
      return null;
  }
}

// Format messages from database parts - following the example structure
export function formatMessages(messageParts: MessagePart[]): UIMessage[] {
  const messages: UIMessage[] = [];
  let currentMessage: UIMessage | null = null;
  let currentMessageId: string | null = null;

  // Process parts in order (they're already sorted by created_at and order from SQL)
  for (const part of messageParts) {
    // If we encounter a new message_id, save the current message and start a new one
    if (part.message_id !== currentMessageId) {
      // Save the current message if it exists
      if (currentMessage) {
        messages.push(currentMessage);
      }

      // Start a new message
      currentMessageId = part.message_id;
      currentMessage = {
        id: part.message_id,
        role: part.role as 'user' | 'assistant' | 'system',
        parts: []
      };
    }

    // Reconstruct the part and add it to the current message
    const reconstructedPart = reconstructPart(part);
    if (reconstructedPart && currentMessage) {
      currentMessage.parts.push(reconstructedPart);
    }
  }

  // Don't forget to add the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}


export async function fetchChat(chatId: string) {
  const supabase = await createServerSupabaseClient();

  // ONE QUERY - ALREADY SORTED
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(
      `
      id,
      user_id,
      created_at,
      updated_at,
      chat_title,
      is_favorite,
      is_public,
      settings,
      users (
        selected_model
      ),
      message_parts!inner (
        id,
        chat_session_id,
        message_id,
        role,
        type,
        order,
        created_at,
        text_text,
        text_state,
        reasoning_text,
        reasoning_state,
        file_mediatype,
        file_filename,
        file_url,
        source_url_id,
        source_url_url,
        source_url_title,
        source_document_id,
        source_document_mediatype,
        source_document_title,
        source_document_filename,
        tool_toolcallid,
        tool_state,
        tool_input,
        tool_output,
        tool_errortext,
        tool_providerexecuted,
        tool_approval,
        providermetadata,
        usage
      )
    `
    )
    .eq('id', chatId)
    .order('created_at', { ascending: true, referencedTable: 'message_parts' })
    .order('order', { ascending: true, referencedTable: 'message_parts' })
    .single();

  if (error) {
    notFound();
  }
  if (!data) {
    notFound();
  }

  // Format the messages from parts
  const formattedMessages = formatMessages(data.message_parts);

  // Conversation-specific state stored on the session (JSON col): prefer the
  // model this chat last ran with, falling back to the user's default.
  const chatSettings = data.settings as { model?: string } | null;

  return {
    ...data,
    messages: formattedMessages,
    selectedModel: chatSettings?.model ?? data.users?.selected_model ?? null
  };
}
