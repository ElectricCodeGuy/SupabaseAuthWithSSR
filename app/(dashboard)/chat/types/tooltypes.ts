// app/chat/types/tooltypes.ts
import type { InferUITools } from 'ai';
import { searchUserDocument } from '@/app/api/chat/tools/documentChat';
import { websiteSearchTool } from '@/app/api/chat/tools/WebsiteSearchTool';
import { saveMemory } from '@/app/api/chat/tools/MemoryTool';
import { conversationSearch } from '@/app/api/chat/tools/ConversationSearchTool';
import { createChart } from '@/app/api/chat/tools/ChartTool';
import { createPDF } from '@/app/api/chat/tools/CreatePDFTool';
import {
  createArtifactTool,
  updateArtifactTool
} from '@/app/api/chat/tools/ArtifactTool';

// Toolset mirror of what the chat route registers — only used to infer the
// UI part types via typeof, never executed (hence the dummy ids and the
// underscore: the value itself is intentionally unused at runtime).
const _toolSet = {
  searchUserDocument: searchUserDocument({
    userId: '123'
  }),
  websiteSearchTool: websiteSearchTool,
  saveMemory: saveMemory({ userId: '123' }),
  conversationSearch: conversationSearch({
    userId: '123',
    currentChatId: '123'
  }),
  createChart: createChart,
  createPDF: createPDF({ userId: '123' }),
  createArtifact: createArtifactTool({ store: new Map() }),
  updateArtifact: updateArtifactTool({ store: new Map() })
};

export type UITools = InferUITools<typeof _toolSet>;
