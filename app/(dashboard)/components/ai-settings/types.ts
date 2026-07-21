// Shared types for the AI settings modal. Lives outside the 'use server'
// module — a "use server" file may only export async functions.
export interface SettingsActionState {
  success: boolean;
  message: string;
}

// Server-fetched props for the modal — produced by getAISettingsData() in
// app/(dashboard)/fetch.ts and passed down from the layout.
export interface AISettingsData {
  fullName: string;
  email: string;
  selectedModel: string;
  models: {
    model_id: string;
    display_name: string;
    description: string;
    cost_note: string;
  }[];
  memories: { id: string; content: string; created_at: string }[];
}
