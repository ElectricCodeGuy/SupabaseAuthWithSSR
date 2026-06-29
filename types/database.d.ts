export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_models: {
        Row: {
          active: boolean
          cost_note: string
          cost_tier: string
          description: string
          display_name: string
          display_order: number
          id: number
          input_cost_per_million_usd: number
          model_id: string
          output_cost_per_million_usd: number
          provider: string
          selectable: boolean
          source_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_note?: string
          cost_tier?: string
          description?: string
          display_name: string
          display_order?: number
          id?: never
          input_cost_per_million_usd: number
          model_id: string
          output_cost_per_million_usd: number
          provider: string
          selectable?: boolean
          source_url?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_note?: string
          cost_tier?: string
          description?: string
          display_name?: string
          display_order?: number
          id?: never
          input_cost_per_million_usd?: number
          model_id?: string
          output_cost_per_million_usd?: number
          provider?: string
          selectable?: boolean
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          chat_title: string | null
          created_at: string
          id: string
          is_favorite: boolean
          is_public: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_title?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_title?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          is_public?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      error_feedback: {
        Row: {
          category: string | null
          created_at: string | null
          errormessage: string | null
          errorstack: string | null
          feedback: string
          id: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          errormessage?: string | null
          errorstack?: string | null
          feedback: string
          id?: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          errormessage?: string | null
          errorstack?: string | null
          feedback?: string
          id?: number
        }
        Relationships: []
      }
      message_parts: {
        Row: {
          chat_session_id: string
          created_at: string
          file_filename: string | null
          file_mediatype: string | null
          file_url: string | null
          id: string
          message_id: string
          order: number
          providermetadata: Json | null
          reasoning_state: string | null
          reasoning_text: string | null
          role: string
          source_document_filename: string | null
          source_document_id: string | null
          source_document_mediatype: string | null
          source_document_title: string | null
          source_url_id: string | null
          source_url_title: string | null
          source_url_url: string | null
          text_state: string | null
          text_text: string | null
          tool_approval: Json | null
          tool_errortext: string | null
          tool_input: Json | null
          tool_output: Json | null
          tool_providerexecuted: boolean | null
          tool_state: string | null
          tool_toolcallid: string | null
          type: string
        }
        Insert: {
          chat_session_id: string
          created_at?: string
          file_filename?: string | null
          file_mediatype?: string | null
          file_url?: string | null
          id?: string
          message_id: string
          order?: number
          providermetadata?: Json | null
          reasoning_state?: string | null
          reasoning_text?: string | null
          role: string
          source_document_filename?: string | null
          source_document_id?: string | null
          source_document_mediatype?: string | null
          source_document_title?: string | null
          source_url_id?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_state?: string | null
          text_text?: string | null
          tool_approval?: Json | null
          tool_errortext?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
          tool_providerexecuted?: boolean | null
          tool_state?: string | null
          tool_toolcallid?: string | null
          type: string
        }
        Update: {
          chat_session_id?: string
          created_at?: string
          file_filename?: string | null
          file_mediatype?: string | null
          file_url?: string | null
          id?: string
          message_id?: string
          order?: number
          providermetadata?: Json | null
          reasoning_state?: string | null
          reasoning_text?: string | null
          role?: string
          source_document_filename?: string | null
          source_document_id?: string | null
          source_document_mediatype?: string | null
          source_document_title?: string | null
          source_url_id?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_state?: string | null
          text_text?: string | null
          tool_approval?: Json | null
          tool_errortext?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
          tool_providerexecuted?: boolean | null
          tool_state?: string | null
          tool_toolcallid?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_parts_chat_session_id_fkey"
            columns: ["chat_session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          ai_description: string | null
          ai_keyentities: string[] | null
          ai_maintopics: string[] | null
          ai_title: string | null
          created_at: string
          file_path: string
          id: string
          title: string
          total_pages: number
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          ai_keyentities?: string[] | null
          ai_maintopics?: string[] | null
          ai_title?: string | null
          created_at?: string
          file_path: string
          id?: string
          title: string
          total_pages: number
          user_id: string
        }
        Update: {
          ai_description?: string | null
          ai_keyentities?: string[] | null
          ai_maintopics?: string[] | null
          ai_title?: string | null
          created_at?: string
          file_path?: string
          id?: string
          title?: string
          total_pages?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents_vec: {
        Row: {
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          page_number: number
          text_content: string
        }
        Insert: {
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          page_number: number
          text_content: string
        }
        Update: {
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          page_number?: number
          text_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_vec_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          full_name: string
          id: string
          selected_model: string | null
        }
        Insert: {
          email: string
          full_name?: string
          id: string
          selected_model?: string | null
        }
        Update: {
          email?: string
          full_name?: string
          id?: string
          selected_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_selected_model_fkey"
            columns: ["selected_model"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["model_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_documents: {
        Args: {
          file_ids: string[]
          filter_user_id: string
          match_count: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          ai_description: string
          ai_keyentities: string[]
          ai_maintopics: string[]
          ai_title: string
          doc_timestamp: string
          id: string
          page_number: number
          similarity: number
          text_content: string
          title: string
          total_pages: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
