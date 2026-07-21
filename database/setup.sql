-- =============================================================================
-- SUPABASE DATABASE SETUP - Version 5.0.0
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
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
TO public
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO public
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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
  -- Settings the conversation ran with, e.g. { "model": "claude-sonnet-5" }.
  -- Written by the chat route on every generation (last-used model wins) and
  -- used to restore the model picker when reopening the conversation.
  settings jsonb NULL,
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
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
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

  -- Per-step token usage, attached to the first part row saved for each
  -- generation step: { model_id, input_tokens, cache_read_tokens,
  -- cache_write_tokens, output_tokens }. Aggregated by the /usage and /admin
  -- dashboards (WHERE usage IS NOT NULL).
  usage jsonb NULL,

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
-- Partial index: the usage dashboards only scan rows that carry usage data
CREATE INDEX IF NOT EXISTS idx_message_parts_usage
  ON public.message_parts USING btree (created_at)
  WHERE usage IS NOT NULL;

-- Enable RLS for message_parts
ALTER TABLE public.message_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for message_parts
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON public.message_parts;
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
DROP POLICY IF EXISTS "Users can only access their own documents" ON public.user_documents;
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
DROP POLICY IF EXISTS "Users can only access their own document vectors" ON public.user_documents_vec;
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
-- STEP 8: CREATE HYBRID SEARCH FUNCTION (vector + keyword, RRF-fused)
-- =============================================================================
-- Used by the autonomous document search tool (searchUserDocument). The
-- vector arm catches meaning ("payment terms" matches synonymous phrasing);
-- the keyword arm catches exact tokens (invoice numbers, names, codes) that
-- embeddings blur. Reciprocal Rank Fusion merges the two rankings without
-- score normalization: each result contributes weight / (k + rank) from
-- every list it appears in.

-- Drop the legacy vector-only signature if it exists — leaving it in place
-- creates an overload PostgREST cannot resolve (PGRST202).
DROP FUNCTION IF EXISTS public.match_documents(
  vector(1024), int, uuid, uuid[], float
);

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding vector(1024),
  query_text text,
  match_count int,
  filter_user_id uuid,
  file_ids uuid[],
  vector_weight float DEFAULT 0.6,
  k_rrf int DEFAULT 60
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  text_content text,
  title text,
  ai_title text,
  ai_description text,
  page_number integer,
  total_pages integer,
  similarity float
)
LANGUAGE sql
AS $$
WITH scoped AS (
  -- Filtered candidate set: this user's documents, optionally restricted to
  -- specific files. Filtered vector queries can't use the global HNSW index
  -- anyway (see the index notes above), so both arms scan this set.
  SELECT vec.id, vec.document_id, vec.text_content, vec.page_number,
         vec.embedding, doc.title, doc.ai_title, doc.ai_description,
         doc.total_pages
  FROM user_documents_vec vec
  JOIN user_documents doc ON doc.id = vec.document_id
  WHERE doc.user_id = filter_user_id
    AND doc.id = ANY(file_ids)
),
vector_hits AS (
  SELECT s.id,
         ROW_NUMBER() OVER (ORDER BY s.embedding <=> query_embedding) AS rank
  FROM scoped s
  WHERE s.embedding IS NOT NULL
  ORDER BY s.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1) * 4, 200)
),
keyword_hits AS (
  SELECT s.id,
         ROW_NUMBER() OVER (
           ORDER BY ts_rank_cd(
             to_tsvector('simple', s.text_content),
             websearch_to_tsquery('simple', query_text)
           ) DESC
         ) AS rank
  FROM scoped s
  WHERE to_tsvector('simple', s.text_content)
        @@ websearch_to_tsquery('simple', query_text)
  LIMIT LEAST(GREATEST(match_count, 1) * 4, 200)
),
fused AS (
  SELECT COALESCE(v.id, k.id) AS id,
         COALESCE(vector_weight / (k_rrf + v.rank), 0)
           + COALESCE((1 - vector_weight) / (k_rrf + k.rank), 0) AS score
  FROM vector_hits v
  FULL OUTER JOIN keyword_hits k ON v.id = k.id
)
SELECT s.id, s.document_id, s.text_content, s.title, s.ai_title,
       s.ai_description, s.page_number, s.total_pages, f.score AS similarity
FROM fused f
JOIN scoped s ON s.id = f.id
ORDER BY f.score DESC
LIMIT LEAST(GREATEST(match_count, 1), 50);
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

DROP POLICY IF EXISTS "Authenticated users can read ai models" ON public.ai_models;
CREATE POLICY "Authenticated users can read ai models"
ON public.ai_models
FOR SELECT
TO authenticated
USING (true);

-- Seed models. logo_url is intentionally omitted: the UI maps `provider` to a
-- local image in public/images/ai-providers/.
-- The chat API route is Anthropic-only (for prompt caching), so only
-- anthropic-provider models are seeded. All seeded models support adaptive
-- thinking, which the route enables unconditionally. Costs are the official
-- API sticker prices per 1M tokens (they feed the /usage and /admin cost
-- estimates). Note: Sonnet 5 has introductory pricing of $2/$10 per MTok
-- through 2026-08-31 — the sticker price is stored so estimates stay valid
-- after the intro period.
INSERT INTO public.ai_models
  (model_id, display_name, provider, input_cost_per_million_usd, output_cost_per_million_usd, active, description, source_url, cost_tier, cost_note, display_order, selectable)
VALUES
  ('claude-sonnet-5', 'Sonnet 5', 'anthropic',  3.0000, 15.0000, true, 'The best combination of speed and intelligence — near-Opus quality on coding and agentic work. Intro pricing ($2/$10 per MTok) until Aug 31, 2026.', 'https://www.anthropic.com/claude', 'medium', '~$0.45/answer', 1, true),
  ('claude-opus-4-8', 'Opus 4.8', 'anthropic',  5.0000, 25.0000, true, 'Anthropic''s most capable Opus-tier model — complex agentic coding and enterprise work.',                                                              'https://www.anthropic.com/claude', 'high',   '~$1.25/answer', 2, true),
  ('claude-fable-5',  'Fable 5',  'anthropic', 10.0000, 50.0000, true, 'Anthropic''s most capable widely released model — next-generation intelligence for the most demanding reasoning and long-running agents. Requires 30-day data retention on your Anthropic org.', 'https://www.anthropic.com/claude', 'high', '~$2.50/answer', 3, true)
ON CONFLICT (model_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  input_cost_per_million_usd = EXCLUDED.input_cost_per_million_usd,
  output_cost_per_million_usd = EXCLUDED.output_cost_per_million_usd,
  description = EXCLUDED.description,
  cost_tier = EXCLUDED.cost_tier,
  cost_note = EXCLUDED.cost_note,
  display_order = EXCLUDED.display_order,
  active = true,
  selectable = true;

-- Per-user selected model. Nullable + ON DELETE SET NULL so removing a model
-- doesn't break users; the app falls back to the default when null.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS selected_model text DEFAULT 'claude-sonnet-5'
    REFERENCES public.ai_models (model_id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 10: STORAGE BUCKET SETUP
-- =============================================================================
-- Note: Create a storage bucket named 'userfiles' in the Supabase dashboard first
-- Then run these policies:

-- Policy 1: Allow users to select their own files
DROP POLICY IF EXISTS "User can select own files" ON storage.objects;
CREATE POLICY "User can select own files"
ON storage.objects FOR SELECT
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 2: Allow users to insert their own files
DROP POLICY IF EXISTS "User can insert own files" ON storage.objects;
CREATE POLICY "User can insert own files"
ON storage.objects FOR INSERT
WITH CHECK (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 3: Allow users to update their own files
DROP POLICY IF EXISTS "User can update own files" ON storage.objects;
CREATE POLICY "User can update own files"
ON storage.objects FOR UPDATE
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- Policy 4: Allow users to delete their own files
DROP POLICY IF EXISTS "User can delete own files" ON storage.objects;
CREATE POLICY "User can delete own files"
ON storage.objects FOR DELETE
USING (
  (bucket_id = 'userfiles'::text) AND
  ((auth.uid())::text = (storage.foldername(name))[1])
);

-- =============================================================================
-- STEP 11: CREATE USER MEMORIES TABLE (saveMemory chat tool)
-- =============================================================================
-- Discrete long-term memories the assistant stores when the user explicitly
-- asks it to remember something ("remember that I prefer short answers").
-- Each memory is one row; the chat API injects all of a user's memories into
-- the system prompt on every request, and the saveMemory tool can list and
-- delete them again ("forget that ...").

CREATE TABLE IF NOT EXISTS public.user_memories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_memories_pkey PRIMARY KEY (id),
  CONSTRAINT user_memories_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE,
  -- Keep single memories small; the whole set is injected into every prompt
  CONSTRAINT user_memories_content_length CHECK (char_length(content) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_id
  ON public.user_memories USING btree (user_id);

-- Enable RLS for user_memories
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for user_memories
DROP POLICY IF EXISTS "Users can manage own memories" ON public.user_memories;
CREATE POLICY "Users can manage own memories"
ON public.user_memories
FOR ALL
TO public
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- =============================================================================
-- STEP 12: ADMIN FLAG ON USERS
-- =============================================================================
-- Gates the /admin dashboard (user management + org-wide usage overview).
-- Grant yourself access after signing up:
--   UPDATE public.users SET is_admin = true WHERE email = 'you@example.com';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
--
-- After running this SQL:
-- 1. Create a storage bucket named 'userfiles' (set to private)
-- 2. Configure your environment variables in .env.local
-- 3. Set up email templates in Supabase Auth settings
-- 4. (Optional) Grant yourself admin access to the /admin dashboard:
--      UPDATE public.users SET is_admin = true WHERE email = 'you@example.com';
--
-- NOTE: this file is the complete, current schema — and it is idempotent
-- (IF NOT EXISTS / CREATE OR REPLACE throughout), so it is safe to re-run on
-- an existing install to pick up new columns, tables and functions.
--
-- For more information, see the README.md file.
-- =============================================================================
