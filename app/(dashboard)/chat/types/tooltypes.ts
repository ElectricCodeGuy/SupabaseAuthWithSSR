// app/chat/types/tooltypes.ts
import type { InferUITools } from 'ai';
import { searchUserDocument } from '@/app/api/chat/tools/documentChat';
import { websiteSearchTool } from '@/app/api/chat/tools/WebsiteSearchTool';

// Define the toolset with just the document search tool
export const toolSet = {
  searchUserDocument: searchUserDocument({
    userId: '123'
  }),
  websiteSearchTool: websiteSearchTool
};

export type UITools = InferUITools<typeof toolSet>;
