-- =============================================================================
-- SUPABASE DATABASE SETUP - Version 4.0.0
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
  -- Per-chat flags used by the chat sidebar menu. A chat can be opened publicly
  -- (via /shared-chat/[id]) only while is_public = true.
  is_favorite boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON public.chat_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx
  ON public.chat_sessions USING btree (created_at) TABLESPACE pg_default;
-- Partial indexes keep the "favorites" sidebar group and public lookups cheap
CREATE INDEX IF NOT EXISTS chat_sessions_user_favorite_idx
  ON public.chat_sessions (user_id, is_favorite)
  WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS chat_sessions_public_idx
  ON public.chat_sessions (id)
  WHERE is_public = true;

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
  message_id text NOT NULL,
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

  -- Tool fields (generic — shared by ALL tools). The `type` column identifies
  -- which tool a row belongs to (e.g. 'tool-searchUserDocument')
  tool_toolcallid text NULL,
  tool_state text NULL,
  tool_input jsonb NULL,
  tool_output jsonb NULL,
  tool_errortext text NULL,
  tool_providerexecuted boolean NULL,
  tool_approval jsonb NULL,

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
  -- Timestamp set automatically when the row is inserted
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_documents_vec_pkey PRIMARY KEY (id),
  CONSTRAINT user_documents_vec_document_page_unique UNIQUE (document_id, page_number),
  CONSTRAINT user_documents_vec_document_id_fkey FOREIGN KEY (document_id) REFERENCES user_documents (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for user_documents_vec
CREATE INDEX IF NOT EXISTS idx_user_documents_vec_document_id
  ON public.user_documents_vec USING btree (document_id) TABLESPACE pg_default;

-- HNSW index for vector similarity search
-- Parameters: m=16 (connections per layer), ef_construction=200 (build candidate list size)
--   - m=16 is the pgvector default and is fine in almost all cases. Raising it to
--     m=32 roughly DOUBLES the index size for little recall gain on most datasets.
--   - The whole index should fit in Postgres' buffer cache (~25% of the instance RAM)
--     to stay fast. If the index grows larger than that, query latency can degrade.
--
-- NOTE: This index is ONLY used by unfiltered queries (vector ORDER BY + LIMIT,
-- like match_documents below). Adding a WHERE filter on another column disables
-- it -- for that you need a separate partial HNSW index per filter value.
--
-- TODO (only when you grow past ~100k rows of dense text): switch this index to
-- halfvec to roughly halve its size at ~1% recall loss, e.g.
--   USING hnsw ((embedding::halfvec(1024)) halfvec_l2_ops)
-- If you do, also cast to halfvec inside match_documents() so the planner uses it.
-- See the "Tuning the HNSW vector index" section in README.md for details.
CREATE INDEX IF NOT EXISTS user_documents_vec_embedding_idx
  ON public.user_documents_vec
  USING hnsw (embedding extensions.vector_l2_ops)
  WITH (m = '16', ef_construction = '200')
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
-- STEP 9: AI MODELS CATALOG + PER-USER SELECTION
-- =============================================================================
-- Reference table of the models the app can use. The primary key is an
-- auto-incrementing id; `model_id` is the slug the chat API route switches on
-- and is what users.selected_model points at, so each user's chosen model is
-- visible directly on the users table. Costs are per 1M tokens in USD.

CREATE TABLE IF NOT EXISTS public.ai_models (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  model_id text NOT NULL UNIQUE,
  display_name text NOT NULL,
  provider text NOT NULL,
  input_cost_per_million_usd numeric(10, 4) NOT NULL,
  output_cost_per_million_usd numeric(10, 4) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  cost_tier text NOT NULL DEFAULT 'medium',
  cost_note text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  selectable boolean NOT NULL DEFAULT true,
  CONSTRAINT ai_models_cost_tier_check CHECK (
    cost_tier = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])
  )
);

CREATE INDEX IF NOT EXISTS ai_models_display_order_idx
  ON public.ai_models USING btree (display_order);

-- Reference data: readable by any authenticated user, not writable from the app
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ai models"
ON public.ai_models
FOR SELECT
TO authenticated
USING (true);

-- Seed models. logo_url is intentionally omitted: the UI maps `provider` to a
-- local image in public/images/ai-providers/.
INSERT INTO public.ai_models
  (model_id, display_name, provider, input_cost_per_million_usd, output_cost_per_million_usd, active, description, source_url, cost_tier, cost_note, display_order, selectable)
VALUES
  ('gpt-5.5',                'GPT-5.5',         'openai',    4.2857, 27.1429, true, 'OpenAI''s latest language model with strong general knowledge.',                'https://openai.com/index/introducing-gpt-5-5/',    'high',   '~$1.40/answer', 1, true),
  ('gemini-3.5-flash',       'Gemini 3.5 Flash','google',    1.4286,  8.5714, true, 'Google''s fast model with frontier intelligence and strong search/grounding.',  'https://ai.google.dev/gemini-api/docs/pricing',    'medium', '~$0.30/answer', 1, true),
  ('gemini-3.1-pro-preview', 'Gemini 3.1 Pro',  'google',    2.7143, 14.2857, true, 'Google''s most advanced model for complex problem-solving and deep reasoning.', 'https://deepmind.google/models/gemini/pro/',       'medium', '~$0.45/answer', 2, true),
  ('claude-sonnet-4-6',      'Sonnet 4.6',      'anthropic', 2.8571, 13.7143, true, 'Anthropic''s fast and balanced model.',                                        'https://www.anthropic.com/news/claude-sonnet-4-6', 'medium', '~$0.45/answer', 3, true),
  ('claude-opus-4-8',        'Opus 4.8',        'anthropic', 4.2857, 22.8571, true, 'Anthropic''s most advanced model with strong analysis.',                       'https://www.anthropic.com/claude',                 'high',   '~$1.15/answer', 5, true)
ON CONFLICT (model_id) DO NOTHING;

-- Per-user selected model. Nullable + ON DELETE SET NULL so removing a model
-- doesn't break users; the app falls back to the default when null.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS selected_model text DEFAULT 'gemini-3.1-pro-preview'
    REFERENCES public.ai_models (model_id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 10: STORAGE BUCKET SETUP
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
