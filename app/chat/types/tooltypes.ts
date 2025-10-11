// app/chat/types/tooltypes.ts
import type {
  TypedToolCall,
  TypedToolResult,
  InferUITools,
  UIMessage
} from 'ai';
import { searchUserDocument } from '@/app/api/chat/tools/documentChat';

// Define the toolset with just the document search tool
export const toolSet = {
  searchUserDocument: searchUserDocument({
    userId: '123', // This will be replaced with actual userId
    selectedBlobs: []
  })
};

// Generate tool call and result types using v5 helpers
export type ToolCall = TypedToolCall<typeof toolSet>;
export type ToolResult = TypedToolResult<typeof toolSet>;

// Helper types for document search tool
export type SearchDocumentsCall = Extract<
  ToolCall,
  { toolName: 'searchUserDocument' }
>;
export type SearchDocumentsArgs = SearchDocumentsCall['input']; // Changed from 'args' to 'input'
export type SearchDocumentsResult = Extract<
  ToolResult,
  { toolName: 'searchUserDocument' }
>['output']; // Changed from 'result' to 'output'



// Define UI tools type for client-side type safety
export type UITools = InferUITools<typeof toolSet>;

// Custom UIMessage type with tool support
export type CustomUIMessage = UIMessage<unknown, any, UITools>;
