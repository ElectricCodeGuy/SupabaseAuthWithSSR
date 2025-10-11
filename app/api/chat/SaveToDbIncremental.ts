import 'server-only';
import { createServerSupabaseClient } from '@/lib/server/server';
import type { UIMessage } from 'ai';
import type { TablesInsert } from '@/types/database';

type PartsInsert = TablesInsert<'message_parts'>;

// Helper function to sanitize data for Postgres
const sanitizeForPostgres = (value: any): any => {
  if (typeof value === 'string') {
    // Remove null characters and other problematic Unicode sequences
    return (
      value
        // eslint-disable-next-line no-control-regex
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/\\u0000/g, '') // Remove escaped null characters
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    ); // Remove other control characters except \t, \n, \r
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    // Recursively sanitize object properties
    const sanitized: any = {};
    for (const key in value) {
      sanitized[key] = sanitizeForPostgres(value[key]);
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    // Recursively sanitize array elements
    return value.map((item) => sanitizeForPostgres(item));
  }

  return value;
};

export const saveMessagesToDB = async ({
  chatSessionId,
  userId,
  messages,
  isFirstStep = false,
  assistantMessageId
}: {
  chatSessionId: string;
  userId: string;
  messages: UIMessage[];
  isFirstStep?: boolean;
  assistantMessageId?: string;
}): Promise<void> => {
  if (!chatSessionId) {
    console.warn('Chat session ID is empty. Skipping saving chat to Supabase.');
    return;
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date();

  try {
    // Upsert the chat session
    const { error: sessionError } = await supabase.from('chat_sessions').upsert(
      {
        id: chatSessionId,
        user_id: userId,
        updated_at: now.toISOString()
      },
      { onConflict: 'id' }
    );

    if (sessionError) throw sessionError;

    // Convert UIMessages to message parts - EVERYTHING is in parts now!
    const allParts: PartsInsert[] = [];

    messages.forEach((message) => {
      // For assistant messages in incremental saves, use the provided assistantMessageId
      const messageId =
        message.role === 'assistant' && assistantMessageId
          ? assistantMessageId
          : message.id;
      const role = message.role;

      // Skip user messages if not first step (they're already saved)
      if (!isFirstStep && role === 'user') {
        return;
      }

      // Add delay for assistant messages
      const messageTime =
        role === 'assistant'
          ? new Date(now.getTime() + 5000)
          : new Date(now.getTime());

      // Process ALL parts from the message
      message.parts.forEach((part, partIndex) => {
        const basePart = {
          id: crypto.randomUUID(), // Generate a new ID for the part
          chat_session_id: chatSessionId,
          message_id: messageId,
          role: role,
          order: partIndex,
          created_at: messageTime.toISOString()
        };

        // Handle different part types
        switch (part.type) {
          case 'text': {
            const textPart = part;
            allParts.push({
              ...basePart,
              type: 'text',
              text_text: sanitizeForPostgres(textPart.text),
              text_state: textPart.state || 'done',
              providermetadata:
                sanitizeForPostgres(textPart.providerMetadata) || null
            });
            break;
          }

          case 'reasoning': {
            const reasoningPart = part;
            allParts.push({
              ...basePart,
              type: 'reasoning',
              reasoning_text: sanitizeForPostgres(reasoningPart.text),
              reasoning_state: reasoningPart.state || 'done',
              providermetadata:
                sanitizeForPostgres(reasoningPart.providerMetadata) || null
            });
            break;
          }

          case 'file': {
            const filePart = part;
            allParts.push({
              ...basePart,
              type: 'file',
              file_url: sanitizeForPostgres(filePart.url),
              file_filename: sanitizeForPostgres(filePart.filename) || null,
              file_mediatype: sanitizeForPostgres(filePart.mediaType) || null,
              providermetadata:
                sanitizeForPostgres(filePart.providerMetadata) || null
            });
            break;
          }

          case 'source-url': {
            const sourcePart = part;
            allParts.push({
              ...basePart,
              type: 'source-url',
              source_url_id: sourcePart.sourceId || crypto.randomUUID(),
              source_url_url: sanitizeForPostgres(sourcePart.url),
              source_url_title: sanitizeForPostgres(sourcePart.title) || null,
              providermetadata:
                sanitizeForPostgres(sourcePart.providerMetadata) || null
            });
            break;
          }

          case 'source-document': {
            const sourceDocPart = part;
            allParts.push({
              ...basePart,
              type: 'source-document',
              source_document_id: sourceDocPart.sourceId || crypto.randomUUID(),
              source_document_mediatype: sanitizeForPostgres(
                sourceDocPart.mediaType
              ),
              source_document_title: sanitizeForPostgres(sourceDocPart.title),
              source_document_filename:
                sanitizeForPostgres(sourceDocPart.filename) || null,
              providermetadata:
                sanitizeForPostgres(sourceDocPart.providerMetadata) || null
            });
            break;
          }

          // TOOL PARTS
          case 'tool-searchUserDocument': {
            const toolPart = part;
            // Generate a deterministic UUID from the toolCallId string
            const toolCallUuid =
              toolPart.toolCallId?.includes('-') &&
              toolPart.toolCallId.length === 36
                ? toolPart.toolCallId
                : crypto.randomUUID();

            allParts.push({
              ...basePart,
              type: 'tool-searchUserDocument',
              tool_searchuserdocument_toolcallid: toolCallUuid,
              tool_searchuserdocument_state: toolPart.state,
              tool_searchuserdocument_input: sanitizeForPostgres(
                toolPart.input
              ),
              tool_searchuserdocument_output: sanitizeForPostgres(
                toolPart.output
              ),
              tool_searchuserdocument_errortext:
                sanitizeForPostgres(toolPart.errorText) || null,
              tool_searchuserdocument_providerexecuted:
                toolPart.providerExecuted || null
            });
            break;
          }


          case 'step-start': {
            // Skip step-start parts - these are UI-only
            break;
          }

          default: {
            console.warn(`Unknown part type: ${part.type} - skipping`);
            break;
          }
        }
      });
    });

    // UPSERT all parts in one query - this will update existing parts or insert new ones
    if (allParts.length > 0) {
      const { error: partsError } = await supabase
        .from('message_parts')
        .upsert(allParts, {
          onConflict: 'id',
          ignoreDuplicates: false // Make sure we update existing records
        });

      if (partsError) {
        console.error('Error upserting message parts:', partsError);
        throw partsError;
      }
    }
  } catch (error) {
    console.error('Error saving messages to Supabase:', error);
    throw error;
  }
};
