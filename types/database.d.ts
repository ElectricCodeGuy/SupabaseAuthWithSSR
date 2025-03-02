export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          chat_session_id: string;
          content: string | null;
          created_at: string;
          id: string;
          is_user_message: boolean;
          reasoning: string | null;
          sources: Json | null;
        };
        Insert: {
          chat_session_id: string;
          content?: string | null;
          created_at?: string;
          id?: string;
          is_user_message: boolean;
          reasoning?: string | null;
          sources?: Json | null;
        };
        Update: {
          chat_session_id?: string;
          content?: string | null;
          created_at?: string;
          id?: string;
          is_user_message?: boolean;
          reasoning?: string | null;
          sources?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_chat_session_id_fkey';
            columns: ['chat_session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      chat_sessions: {
        Row: {
          chat_title: string | null;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          chat_title?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          chat_title?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      error_feedback: {
        Row: {
          category: string | null;
          created_at: string | null;
          errormessage: string | null;
          errorstack: string | null;
          feedback: string;
          id: number;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          errormessage?: string | null;
          errorstack?: string | null;
          feedback: string;
          id?: number;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          errormessage?: string | null;
          errorstack?: string | null;
          feedback?: string;
          id?: number;
        };
        Relationships: [];
      };
      users: {
        Row: {
          email: string;
          full_name: string;
          id: string;
        };
        Insert: {
          email: string;
          full_name?: string;
          id: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          id?: string;
        };
        Relationships: [];
      };
      vector_documents: {
        Row: {
          ai_description: string | null;
          ai_keyentities: string[] | null;
          ai_maintopics: string[] | null;
          ai_title: string | null;
          chunk_number: number;
          created_at: string | null;
          embedding: string | null;
          filter_tags: string | null;
          id: string;
          page_number: number;
          primary_language: string | null;
          text_content: string;
          timestamp: string;
          title: string;
          total_chunks: number;
          total_pages: number;
          user_id: string;
        };
        Insert: {
          ai_description?: string | null;
          ai_keyentities?: string[] | null;
          ai_maintopics?: string[] | null;
          ai_title?: string | null;
          chunk_number: number;
          created_at?: string | null;
          embedding?: string | null;
          filter_tags?: string | null;
          id?: string;
          page_number: number;
          primary_language?: string | null;
          text_content: string;
          timestamp: string;
          title: string;
          total_chunks: number;
          total_pages: number;
          user_id: string;
        };
        Update: {
          ai_description?: string | null;
          ai_keyentities?: string[] | null;
          ai_maintopics?: string[] | null;
          ai_title?: string | null;
          chunk_number?: number;
          created_at?: string | null;
          embedding?: string | null;
          filter_tags?: string | null;
          id?: string;
          page_number?: number;
          primary_language?: string | null;
          text_content?: string;
          timestamp?: string;
          title?: string;
          total_chunks?: number;
          total_pages?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_user';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      list_objects: {
        Args: {
          bucketid: string;
          prefix: string;
          limits?: number;
          offsets?: number;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
      match_documents: {
        Args: {
          query_embedding: string;
          match_count: number;
          filter_user_id: string;
          filter_files: string[];
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          text_content: string;
          title: string;
          doc_timestamp: string;
          ai_title: string;
          ai_description: string;
          ai_maintopics: string[];
          ai_keyentities: string[];
          filter_tags: string;
          page_number: number;
          total_pages: number;
          chunk_number: number;
          total_chunks: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;
