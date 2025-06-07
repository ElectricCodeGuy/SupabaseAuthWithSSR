// lib/types/toolTypes.ts
import type { ToolCallUnion, ToolResultUnion } from 'ai';
import { searchUserDocument } from '@/app/api/chat/tools/documentChat';
import { websiteSearchTool } from '@/app/api/chat/tools/WebsiteSearchTool';

// Define the toolset with just the document search tool
export const toolSet = {
  searchUserDocument: searchUserDocument({
    userId: '123',
    selectedBlobs: []
  }),
  websiteSearchTool: websiteSearchTool
};

// Generate tool call and result types
export type ToolCall = ToolCallUnion<typeof toolSet>;
export type ToolResult = ToolResultUnion<typeof toolSet>;

// Helper types for document search tool
export type SearchDocumentsCall = Extract<
  ToolCall,
  { toolName: 'searchUserDocument' }
>;
export type SearchDocumentsArgs = SearchDocumentsCall['args'];
export type SearchDocumentsResult = Extract<
  ToolResult,
  { toolName: 'searchUserDocument' }
>['result'];

// Helper types for website search tool
export type WebsiteSearchCall = Extract<
  ToolCall,
  { toolName: 'websiteSearchTool' }
>;
export type WebsiteSearchArgs = WebsiteSearchCall['args'];
export type WebsiteSearchResult = Extract<
  ToolResult,
  { toolName: 'websiteSearchTool' }
>['result'];
