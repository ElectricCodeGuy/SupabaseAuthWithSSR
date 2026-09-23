// app/chat/types/tooltypes.ts
import type { InferUITools } from 'ai';
import { searchUserDocument } from '@/app/api/chat/tools/documentChat';
import { websiteSearchTool } from '@/app/api/chat/tools/WebsiteSearchTool';
import { saveMemory } from '@/app/api/chat/tools/MemoryTool';
import { conversationSearch } from '@/app/api/chat/tools/ConversationSearchTool';
import { createPDF } from '@/app/api/chat/tools/CreatePDFTool';
import {
  createArtifactTool,
  updateArtifactTool
} from '@/app/api/chat/tools/ArtifactTool';
import {
  createVisualizationTool,
  updateVisualizationTool
} from '@/app/api/chat/tools/VisualizationTool';
import { generateImageTool } from '@/app/api/chat/tools/ImageGenerationTool';

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
  createPDF: createPDF({ userId: '123' }),
  createArtifact: createArtifactTool({ store: new Map() }),
  updateArtifact: updateArtifactTool({ store: new Map() }),
  createVisualization: createVisualizationTool({ store: new Map() }),
  updateVisualization: updateVisualizationTool({ store: new Map() }),
  generateImage: generateImageTool({ userId: '123', chatSessionId: '123' })
};

export type UITools = InferUITools<typeof _toolSet>;
