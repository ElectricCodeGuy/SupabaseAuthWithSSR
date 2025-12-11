import 'server-only';

import { createServerSupabaseClient } from '@/lib/server/server';
import { unstable_noStore as noStore } from 'next/cache';
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

    // Tool parts - handle our specific tools
    case 'tool-searchUserDocument': {
      const toolPart: ToolUIPart<UITools> = {
        type: 'tool-searchUserDocument',
        toolCallId: part.tool_searchuserdocument_toolcallid || '',
        state: (part.tool_searchuserdocument_state as any) || 'input-available',
        input: part.tool_searchuserdocument_input as any,
        output: part.tool_searchuserdocument_output as any,
        errorText: part.tool_searchuserdocument_errortext || undefined,
        providerExecuted:
          part.tool_searchuserdocument_providerexecuted || undefined
      };
      return toolPart;
    }
    case 'tool-websiteSearchTool': {
      const toolPart: ToolUIPart<UITools> = {
        type: 'tool-websiteSearchTool',
        toolCallId: part.tool_websitesearchtool_toolcallid || '',
        state: (part.tool_websitesearchtool_state as any) || 'input-available',
        input: part.tool_websitesearchtool_input as any,
        output: part.tool_websitesearchtool_output as any,
        errorText: part.tool_websitesearchtool_errortext || undefined,
        providerExecuted:
          part.tool_websitesearchtool_providerexecuted || undefined
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
  noStore();
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
        tool_searchuserdocument_toolcallid,
        tool_searchuserdocument_state,
        tool_searchuserdocument_input,
        tool_searchuserdocument_output,
        tool_searchuserdocument_errortext,
        tool_searchuserdocument_providerexecuted,
        tool_websitesearchtool_toolcallid,
        tool_websitesearchtool_state,
        tool_websitesearchtool_input,
        tool_websitesearchtool_output,
        tool_websitesearchtool_errortext,
        tool_websitesearchtool_providerexecuted,
        providermetadata
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

  return {
    ...data,
    messages: formattedMessages
  };
}
