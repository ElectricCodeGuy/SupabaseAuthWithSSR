-- =============================================================================
-- SUPABASE DATABASE SETUP - Version 3.0.0
-- =============================================================================
-- Run this SQL in the Supabase SQL Editor to set up all required tables,
-- functions, indexes, and RLS policies for the application.
-- =============================================================================

-- =============================================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Enable vector extension for document embeddings
-- Note: PostgreSQL does not support indexing vectors with more than 2,000 dimensions
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================================================
-- STEP 2: CREATE USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
TO public
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO public
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO public
USING (id = (SELECT auth.uid()));

-- =============================================================================
-- STEP 3: CREATE TRIGGER FOR NEW USER REGISTRATION
-- =============================================================================

-- Trigger function to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function on new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- STEP 4: CREATE CHAT SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  chat_title text NULL,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON public.chat_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx
  ON public.chat_sessions USING btree (created_at) TABLESPACE pg_default;

-- Enable RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for chat_sessions
CREATE POLICY "Users can view own chat sessions"
ON public.chat_sessions
AS PERMISSIVE
FOR ALL
TO public
USING (user_id = (SELECT auth.uid()));

-- =============================================================================
-- STEP 5: CREATE MESSAGE PARTS TABLE (Incremental Message Saving)
-- =============================================================================
-- This table stores individual message parts (text, tools, reasoning, etc.)
-- allowing for incremental saving and proper ordering of AI responses

CREATE TABLE IF NOT EXISTS public.message_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_session_id uuid NOT NULL,
  message_id uuid NOT NULL,
  role text NOT NULL,
  type text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Text part fields
  text_text text NULL,
  text_state text NULL DEFAULT 'done',

  -- Reasoning part fields
  reasoning_text text NULL,
  reasoning_state text NULL DEFAULT 'done',

  -- File part fields
  file_mediatype text NULL,
  file_filename text NULL,
  file_url text NULL,

  -- Source URL part fields
  source_url_id text NULL,
  source_url_url text NULL,
  source_url_title text NULL,

  -- Source Document part fields
  source_document_id text NULL,
  source_document_mediatype text NULL,
  source_document_title text NULL,
  source_document_filename text NULL,

  -- Tool: searchUserDocument fields
  tool_searchuserdocument_toolcallid uuid NULL,
  tool_searchuserdocument_state text NULL,
  tool_searchuserdocument_input jsonb NULL,
  tool_searchuserdocument_output jsonb NULL,
  tool_searchuserdocument_errortext text NULL,
  tool_searchuserdocument_providerexecuted boolean NULL,
  tool_searchuserdocument_approval jsonb NULL,

  -- Tool: websiteSearchTool fields
  tool_websitesearchtool_toolcallid uuid NULL,
  tool_websitesearchtool_state text NULL,
  tool_websitesearchtool_input jsonb NULL,
  tool_websitesearchtool_output jsonb NULL,
  tool_websitesearchtool_errortext text NULL,
  tool_websitesearchtool_providerexecuted boolean NULL,
  tool_websitesearchtool_approval jsonb NULL,

  -- Provider metadata
  providermetadata jsonb NULL,

  -- Constraints
  CONSTRAINT message_parts_pkey PRIMARY KEY (id),
  CONSTRAINT message_parts_chat_session_id_fkey FOREIGN KEY (chat_session_id)
    REFERENCES chat_sessions (id) ON DELETE CASCADE,
  CONSTRAINT message_parts_role_check CHECK (
    role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])
  )
) TABLESPACE pg_default;

-- Indexes for message_parts
CREATE INDEX IF NOT EXISTS idx_message_parts_chat_session_id
  ON public.message_parts USING btree (chat_session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_message_parts_message_id
  ON public.message_parts USING btree (message_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_message_parts_chat_session_message_order
  ON public.message_parts USING btree (chat_session_id, message_id, "order") TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_message_parts_created_at
  ON public.message_parts USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_message_parts_type
  ON public.message_parts USING btree (type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_message_parts_message_order
  ON public.message_parts USING btree (message_id, "order") TABLESPACE pg_default;

-- Enable RLS for message_parts
ALTER TABLE public.message_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for message_parts
CREATE POLICY "Users can view messages from their sessions"
ON public.message_parts
AS PERMISSIVE
FOR ALL
TO public
USING (
  chat_session_id IN (
    SELECT chat_sessions.id
    FROM chat_sessions
    WHERE chat_sessions.user_id = (SELECT auth.uid())
  )
);

-- =============================================================================
-- STEP 6: CREATE USER DOCUMENTS TABLE (Document Metadata)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  total_pages integer NOT NULL,
  ai_description text NULL,
  ai_keyentities text[] NULL,
  ai_maintopics text[] NULL,
  ai_title text NULL,
  file_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_documents_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_user_title_unique UNIQUE (user_id, title),
  CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for user_documents
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id
  ON public.user_documents USING btree (user_id) TABLESPACE pg_default;

-- Enable RLS for user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_documents
CREATE POLICY "Users can only access their own documents"
ON public.user_documents
FOR ALL
TO public
USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- STEP 7: CREATE USER DOCUMENTS VECTORS TABLE (Document Embeddings)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_documents_vec (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  text_content text NOT NULL,
  page_number integer NOT NULL,
  embedding extensions.vector(1024) NULL,
  CONSTRAINT user_documents_vec_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_vec_document_page_unique UNIQUE (document_id, page_number),
  CONSTRAINT user_documents_vec_document_id_fkey FOREIGN KEY (document_id) REFERENCES user_documents (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for user_documents_vec
CREATE INDEX IF NOT EXISTS idx_user_documents_vec_document_id
  ON public.user_documents_vec USING btree (document_id) TABLESPACE pg_default;

-- HNSW index for vector similarity search
-- Parameters: m=16 (connections per layer), ef_construction=64 (candidate list size)
-- For >500k rows, consider m=32 and ef_construction=128
CREATE INDEX IF NOT EXISTS user_documents_vec_embedding_idx
  ON public.user_documents_vec
  USING hnsw (embedding extensions.vector_l2_ops)
  WITH (m = '16', ef_construction = '64')
  TABLESPACE pg_default;

-- Enable RLS for user_documents_vec
ALTER TABLE public.user_documents_vec ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_documents_vec
CREATE POLICY "Users can only access their own document vectors"
ON public.user_documents_vec
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_documents
    WHERE user_documents.id = user_documents_vec.document_id
    AND user_documents.user_id = (SELECT auth.uid())
  )
);

-- =============================================================================
-- STEP 8: CREATE SIMILARITY SEARCH FUNCTION
-- =============================================================================
-- This function performs vector similarity search across user documents
-- Used by the autonomous document search tool

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1024),
  match_count int,
  filter_user_id uuid,
  file_ids uuid[],
  similarity_threshold float DEFAULT 0.30
)
RETURNS TABLE (
  id uuid,
  text_content text,
  title text,
  doc_timestamp timestamp with time zone,
  ai_title text,
  ai_description text,
  ai_maintopics text[],
  ai_keyentities text[],
  page_number integer,
  total_pages integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vec.id,
    vec.text_content,
    doc.title,
    doc.created_at as doc_timestamp,
    doc.ai_title,
    doc.ai_description,
    doc.ai_maintopics,
    doc.ai_keyentities,
    vec.page_number,
    doc.total_pages,
    1 - (vec.embedding <=> query_embedding) as similarity
  FROM
    user_documents_vec vec
  INNER JOIN
    user_documents doc ON vec.document_id = doc.id
  WHERE
    doc.user_id = filter_user_id
    AND doc.id = ANY(file_ids)
    AND 1 - (vec.embedding <=> query_embedding) > similarity_threshold
  ORDER BY
    vec.embedding <=> query_embedding ASC
  LIMIT LEAST(match_count, 200);
END;
$$;

-- =============================================================================
-- STEP 9: STORAGE BUCKET SETUP
-- =============================================================================
-- Note: Create a storage bucket named 'userfiles' in the Supabase dashboard first
-- Then run these policies:

-- Policy 1: Allow users to select their own files
CREATE POLICY "User can select own files"
ON storage.objects FOR SELECT
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 2: Allow users to insert their own files
CREATE POLICY "User can insert own files"
ON storage.objects FOR INSERT
WITH CHECK (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 3: Allow users to update their own files
CREATE POLICY "User can update own files"
ON storage.objects FOR UPDATE
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "User can delete own files"
ON storage.objects FOR DELETE
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
--
-- After running this SQL:
-- 1. Create a storage bucket named 'userfiles' (set to private)
-- 2. Configure your environment variables in .env.local
-- 3. Set up email templates in Supabase Auth settings
--
-- For more information, see the README.md file.
-- =============================================================================
