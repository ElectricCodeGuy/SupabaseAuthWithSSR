// Shared types for chat previews. The fetching/grouping logic lives in the
// GET /api/chat-previews route where it is used.

export interface ChatPreview {
  id: string;
  firstMessage: string;
  created_at: string;
  is_favorite: boolean;
  is_public: boolean;
}

export interface CategorizedChats {
  today: ChatPreview[];
  yesterday: ChatPreview[];
  last7Days: ChatPreview[];
  last30Days: ChatPreview[];
  last2Months: ChatPreview[];
  older: ChatPreview[];
}

export interface FetchChatPreviewsResponse {
  chatPreviews: ChatPreview[];
  favorites: ChatPreview[];
  categorizedChats: CategorizedChats;
}
