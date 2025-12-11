## CHANGELOG

## [v3.0.0] - 2025-12-11

### Major Changes

- **Dashboard Route Group Architecture**: Reorganized application structure with route groups
  - Migrated chat functionality from `/app/chat` to `/app/(dashboard)/chat`
  - Migrated file management from `/app/protected` to `/app/(dashboard)/filer`
  - Cleaner separation between public frontpage and authenticated dashboard areas

- **Autonomous Document Search Tool**: Completely redesigned how document search works
  - AI now autonomously decides when to search user documents based on the question
  - Removed client-side file selection - the tool fetches user's documents directly from the database
  - More intelligent context gathering with dual-query approach (tool query + user message)

- **Navigation Overhaul**: Implemented new header navigation using shadcn NavigationMenu
  - Added dropdown menus for documentation and profile sections
  - Consistent styling across all navigation items
  - Improved mobile responsiveness

### Added

- **Enhanced Document Search Tool UI**: New accordion-based display for document search results
  - Shows grouped documents with page links
  - Displays search query used
  - Status indicators for loading, success, and error states
  - Base64 encoded URLs for proper handling of special characters in document names

- **Website Search Tool**: New tool for searching web sources using Exa AI
  - Returns structured context with source URLs and titles
  - Collapsible UI with source attribution
  - Published date display for search results

### Changed

- **Chat API Route**:
  - Removed `selectedFiles` from request body
  - Document search is now a tool the AI decides to use, not a client-controlled feature
  - Updated system prompt to guide AI on tool usage

- **Tool Output Structure**: Standardized output format across tools
  - Both document and website search tools now return `{ instructions, context }` format
  - Context arrays contain structured metadata for client-side display
  - Instructions guide the AI on how to use and cite the search results

- **Token Estimation**: Removed tiktoken dependency from WebsiteSearchTool
  - Now uses character-based estimation (~4 chars per token)
  - Simplified dependency tree and reduced bundle size

- **Upload Context**: Removed upload context entirely
  - File selection state no longer needed as AI autonomously searches documents

### Fixed

- **Type Safety in fetch.ts**: Fixed type casting for tool parts reconstructed from database
  - Proper handling of `Json` database types with `as unknown as Type` pattern
  - Correct column name mapping for tool fields

- **URL Encoding**: Document links now use base64 encoding for document titles
  - Fixes issues with special characters and unicode in filenames
  - Consistent with PDF viewer URL parsing

### Database

- Tool columns in `message_parts` table now properly support the new output format
- Document search tool uses `getUserDocumentIds()` to fetch user's document IDs directly

## [v2.3.0] - 2025-08-24

### Major Changes

- **Incremental Message Saving System**: Completely redesigned how chat messages are saved to the database

  - Messages are now saved incrementally as each AI step completes using `onStepFinish`
  - Preserves exact order of tools, reasoning, and text as they are generated
  - Uses a single assistant message ID across all steps for proper grouping
  - Enables real-time persistence without waiting for full response completion

- **New Message Parts Database Architecture**: Migrated from monolithic message storage to granular parts system
  - New `message_parts` table replaces `chat_messages` for better data organization
  - Each part (text, reasoning, tool, file, source) is stored as a separate row
  - Maintains proper ordering with `order` field for accurate reconstruction
  - Supports all part types: text, reasoning, files, sources, and tool invocations

### Added

- **SaveToDbIncremental.ts**: New incremental saving function with proper sanitization and type safety
- **Tool Output Display**: Enhanced UI components for displaying tool results

  - Collapsible sections using shadcn/ui components
  - Shows sources with clickable links and titles
  - Displays search queries used by tools
  - Accordion-style interface for better information hierarchy

- **File Upload API**: New `/api/upload` endpoint for secure file uploads with presigned URLs
- **Migration Script**: Comprehensive SQL migration file for database schema updates

### Changed

- **Chat Route Architecture**:

  - Removed `onFinish` database operations in favor of `onStepFinish`
  - Added step counter and message tracking for incremental saves
  - Improved error handling with detailed logging

- **Frontend Components**:

  - Chat component now renders all parts in chronological order
  - Removed separate grouping of text, reasoning, and tools
  - WebsiteChatTool and DocumentChatTool updated with collapsible UI
  - Uses shadcn Collapsible component instead of custom implementations

- **Tool Integration**:
  - WebsiteSearchTool returns structured `toolOutput` with sources and queries
  - Document search tool maintains output structure consistency
  - Tool call IDs now properly generated as UUIDs

### Fixed

- **UUID Generation**: Tool call IDs are now properly converted to UUIDs for database storage
- **Message Ordering**: Parts within messages are correctly sorted by `order` field
- **Tool Output Preservation**: Full tool outputs including sources are now properly saved and retrieved
- **TypeScript Types**: Fixed type mismatches between tool states and output fields

### Database Schema Updates

```sql
-- New message_parts table structure
CREATE TABLE public.message_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_session_id uuid NOT NULL,
  message_id uuid NOT NULL,
  role text NOT NULL,
  type text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Part-specific fields for each type
  -- Includes text, reasoning, file, source, and tool fields
  -- See migration_message_parts.sql for complete schema
);
```

### Technical Improvements

- **Performance**: Messages load faster with optimized indexing on message_parts table
- **Data Integrity**: Proper foreign key constraints and type checking
- **Maintainability**: Cleaner separation of concerns with modular part handling
- **User Experience**: Real-time saving provides better feedback during long AI responses

## [v2.2.0] - 2025-08-09

### Changed

- **Upgraded to Vercel AI SDK v5**: Migrated the core AI functionality to the latest major version of the Vercel AI SDK, leveraging its new features and performance enhancements.
- **Reworked Document Handling Flow**: Overhauled the document upload and viewing process. The system no longer exposes the Supabase `anon` key on the client-side, improving security.

### Added

- **Server-Sent Events (SSE) for Real-Time Updates**: Implemented Server-Sent Events for handling real-time data streaming, providing a more robust and efficient communication channel between the server and client.

### Improved

- **Enhanced Security with Presigned URLs**: The document interaction flow now uses presigned URLs for both uploads and viewing. This ensures access is secure, authenticated, and time-limited.
- **General Stability**: Addressed various minor bugs and made small improvements across the application to enhance overall performance and user experience.

## [v2.1.0] - 2025-06-07

### Added

- **Normalized Document Database Schema**: Redesigned document storage architecture with separated concerns for better performance and maintainability
- **Enhanced Document Retrieval Tool**: Completely optimized the document retrieval system for more accurate and relevant chunk matching
- **Modular Chat History Components**: Split chat history management into separate, reusable components for improved code organization

### Changed

- **Document Schema Restructure**: Migrated from single `vector_documents` table to a normalized two-table structure:

  ```sql
  -- Main document metadata table
  CREATE TABLE public.user_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    total_pages integer NOT NULL,
    ai_description text NULL,
    ai_keyentities text[] NULL,
    ai_maintopics text[] NULL,
    ai_title text NULL,
    filter_tags text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_documents_pkey PRIMARY KEY (id),
    CONSTRAINT user_documents_user_title_unique UNIQUE (user_id, title),
    CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  -- Separate vector embeddings table
  CREATE TABLE public.user_documents_vec (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    text_content text NOT NULL,
    page_number integer NOT NULL,
    embedding extensions.vector(1024) NULL,
    CONSTRAINT user_documents_vec_pkey PRIMARY KEY (id),
    CONSTRAINT user_documents_vec_document_page_unique UNIQUE (document_id, page_number),
    CONSTRAINT user_documents_vec_document_id_fkey FOREIGN KEY (document_id) REFERENCES user_documents (id) ON DELETE CASCADE
  );
  ```

## [v2.0.0] - 2025-05-04

### Added

- **Redesigned Chat Interface**: Complete visual overhaul with modern UI design and improved layout
- **Direct File Upload to AI**: Added ability to upload files directly to the AI model instead of going through the vector database
- **Google Model Integration**: Added Google as an additional AI model option alongside existing GPT and Claude models
- **Persistent Tool Results**: Tool results now stored in database for conversation history
- **Enhanced Reasoning Display**: AI reasoning steps now properly displayed and stored
- **File Attachment Persistence**: Uploaded files are correctly parsed and stored in the database for future access

### Changed

- **Improved Model Switching**: Seamless model switching within the same chat session
- **Better File Handling**: More intuitive file upload and attachment system with improved persistence
- **Enhanced Tool Integration**: Tools results and reasoning are now properly integrated into chat flow

### Improved

- **User Experience**: More intuitive interface for file uploads and model selection
- **Data Persistence**: All chat elements including tools, files, and reasoning are now stored
- **Model Flexibility**: Better handling of switching between different AI providers mid-conversation

## [v1.9.0] - 2025-01-15

### Added

- **UI Framework Upgrade**:

  - Replaced Material-UI (MUI) with ShadCN UI
  - Improved component consistency and design system
  - Better developer experience with more customizable components

- **Embedding Model Improvement**:
  - Migrated from OpenAI embeddings to Voyage's voyage-3-large model
  - Enhanced semantic search capabilities with state-of-the-art embeddings

### Why Switch to ShadCN?

The transition from MUI to ShadCN provides:

- **Better Developer Experience**:

  - More consistent styling API
  - Headless components with full styling control
  - Simpler theming and customization

- **Performance Improvements**:
  - Reduced bundle size
  - Faster component rendering
  - Better code splitting options

### Voyage AI Integration Benefits

Replacing OpenAI's embedding model with voyage-3-large offers:

- **Technical Advantages**:

  - Support for 1024 dimensions with int8 quantization
  - Perfect compatibility with pgvector in Supabase (under 2000 dimension limit)
  - Optimized storage efficiency without compromising accuracy

- **Superior Embeddings**:

  - Better semantic understanding of legal documents
  - Improved multilingual support for Nordic languages
  - More accurate similarity matching for case law comparisons

- **Cost Efficiency**:
  - More predictable pricing structure
  - Lower per-token costs
  - Reduced API latency

Learn more about the new embedding model at:
https://blog.voyageai.com/2025/01/07/voyage-3-large/

## [v1.8.1] - 2024-12-30

### Added

- **PG Vector Integration**:
- Replaced Pinecone with Supabase's pgvector for document embeddings storage and similarity search.

### Why Replace Pinecone?

While Pinecone is popular, it presented significant challenges in production:

- **Lack of Type Safety**:

  - No proper TypeScript support
  - Difficult to maintain type consistency
  - Error-prone metadata management

- **Data Management Nightmare**:

  - No SQL support for updating metadata
  - Having to maintain data in two separate systems
  - Complex and limited update operations

- **Support and Cost Issues**:
  - Unresponsive support team
  - Limited help with technical issues
  - Expensive serverless pricing model

### Benefits of Supabase pgvector

The migration to pgvector provides:

- **Unified Data Layer**:

  - Single database for all application data
  - Native PostgreSQL features
  - Built-in Row Level Security (RLS)

- **Better Development**:

  - Familiar SQL interface
  - Strong type checking
  - Improved debugging tools

- **Enhanced Query Optimization**:
  - Implemented an intelligent query preprocessing step for document similarity search.
  - Query variation generation for improved semantic matching
  - Context-aware query reformulation based on document metadata
  - Automatic deduplication of search results
  - Improved relevance through multi-query aggregation

### Technical Implementation

#### Vector Document Storage

```sql
-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create the vector_documents table
CREATE TABLE IF NOT EXISTS public.vector_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  embedding extensions.vector(1024),
  text_content text NOT NULL,
  title text NOT NULL,
  timestamp date NOT NULL,
  ai_title text,
  ai_description text,
  ai_maintopics text[],
  ai_keyentities text[],
  filter_tags text,
  page_number integer NOT NULL,
  total_pages integer NOT NULL,
  chunk_number integer NOT NULL,
  total_chunks integer NOT NULL,
  primary_language text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vector_documents_pkey PRIMARY KEY (id),
  CONSTRAINT vector_documents_unique_chunk UNIQUE (user_id, title, "timestamp", page_number, chunk_number),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Note: PostgreSQL currently does not support indexing vectors with more than 2,000 dimensions. If you have hundreds of thousands of documents resulting in hundreds of thousands of vectors, you need to use an embedding model that produces 2,000 dimensions or fewer.

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vector_documents_user_id ON public.vector_documents USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_vector_documents_lookup ON public.vector_documents USING btree (
  user_id,
  title,
  "timestamp",
  page_number,
  chunk_number
);

-- Enable RLS
ALTER TABLE public.vector_documents ENABLE ROW LEVEL SECURITY;

-- Optimized RLS Policies for vector_documents
CREATE POLICY "Users can only read their own documents"
ON public.vector_documents
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
```

#### Similarity Search Function

Implemented an efficient similarity search stored procedure:

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1024),
  match_count int,
  filter_user_id uuid,
  filter_files text[],
  similarity_threshold float
)
RETURNS TABLE (
  id uuid,
  text_content text,
  title text,
  doc_timestamp date,
  ai_title text,
  ai_description text,
  ai_maintopics text[],
  ai_keyentities text[],
  filter_tags text,
  page_number int,
  total_pages int,
  chunk_number int,
  total_chunks int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vd.id,
    vd.text_content,
    vd.title,
    vd."timestamp" as doc_timestamp,
    vd.ai_title,
    vd.ai_description,
    vd.ai_maintopics,
    vd.ai_keyentities,
    vd.filter_tags,
    vd.page_number,
    vd.total_pages,
    vd.chunk_number,
    vd.total_chunks,
    1 - (vd.embedding <=> query_embedding) as similarity
  FROM
    vector_documents vd
  WHERE
    vd.user_id = filter_user_id
    AND vd.filter_tags = ANY(filter_files)
    AND 1 - (vd.embedding <=> query_embedding) > similarity_threshold
  ORDER BY
    vd.embedding <=> query_embedding ASC
  LIMIT LEAST(match_count, 200);
END;
$$;
```

For more information about implementing vector similarity search with pgvector, check out [Supabase's Vector Columns and Embeddings Guide](https://supabase.com/docs/guides/ai/vector-columns?queryGroups=database-method&database-method=dashboard).

### Improved

- **Performance**: Significant reduction in query latency by eliminating external API calls
- **Cost Efficiency**: Reduced operational costs by using native PostgreSQL capabilities
- **Reliability**: Improved system stability with fewer external dependencies
- **Search Quality**: Enhanced search results through intelligent query optimization

### Technical Benefits

- **Co-located Storage**: Vector embeddings stored alongside other application data
- **Simplified Architecture**: Reduced system complexity by eliminating external vector store

## [v1.8.0] - 2024-12-30

### Added

- **Tavily AI Web Search Integration**: Implemented real-time internet search capabilities using Tavily AI's search API.
  - Live web search during chat conversations
  - Source attribution for search results
  - Seamless integration with existing chat interface

<img src="public/images/TavilySeach.png" alt="Tavily Search Integration" style="width: 60%; margin: 10px;">

### New Features Include:

- **Web Search Capabilities**:

  - Real-time internet searches during conversations
  - Accurate and up-to-date information from reliable sources
  - Source links provided with responses
  - Context-aware search results integrated into chat flow

- **Enhanced Chat Interface**:
  - New search mode toggle in chat interface
  - Visual indicators for active search operations
  - Improved loading states and feedback
  - Seamless switching between chat modes (Regular, PDF, Web Search)

### Improved

- **Loading States**:
  - Implemented robust loading state management
  - Clear visual feedback during operations
  - Smooth transitions between states

### Fixed

- Various UI/UX bugs and improvements
- Enhanced error handling for search operations
- Improved response formatting and display
- Better handling of concurrent operations

## [v1.7.0] - 2024-12-26

### Added

- **Document Chat Feature (RAG)**: Implemented a Retrieval-Augmented Generation system allowing users to chat with their uploaded documents.
  - Document upload and processing capabilities
  - Automatic text extraction and chunking
  - Vector embedding generation using LlamaIndex
  - Storage in Pinecone vector database
  - Context-aware document querying
  - Semantic search across uploaded documents

### New Features Include:

- **Document Processing Pipeline**:

  - Support for multiple document formats (PDF, DOCX)
  - Automatic text extraction and preprocessing
  - Smart document chunking for optimal context retrieval

- **Enhanced Chat Interface**:

  - Document-aware chat responses
  - Source attribution for answers
  - Context highlighting in responses
  - Document management interface
  - Upload progress tracking
  - Document processing status indicators

- **Interactive Document Navigation**:
  - **Split-Screen Interface**: Documents display on the right while chatting on the left
  - **Click-to-Navigate**: Every AI response includes clickable links that automatically navigate to the relevant page in the document
  - **Smart Context**: AI responses include page numbers and brief quotes with clickable navigation

## [v1.6.0] - 2024-06-10

### Added

- **Supabase Integration for Chat Storage**: Replaced Upstash/redis storage of chat messages with Supabase. The AI/RSC part of the application now stores data directly in Supabase tables. This was done to keep everything in one place.

### Changed

- **Database Schema**: Implemented new schemas in Supabase for chat storage. The new schemas are as follows:

  ```sql
  -- Chat Sessions Table
  create table
    public.chat_sessions (
      id uuid not null default extensions.uuid_generate_v4 (),
      user_id uuid not null,
      created_at timestamp with time zone not null default current_timestamp,
      updated_at timestamp with time zone not null default current_timestamp,
      chat_title null,
      constraint chat_sessions_pkey primary key (id),
      constraint chat_sessions_user_id_fkey foreign key (user_id) references users (id)
    ) tablespace pg_default;

  create index if not exists idx_chat_sessions_user_id on public.chat_sessions using btree (user_id) tablespace pg_default;

  create index if not exists chat_sessions_created_at_idx on public.chat_sessions using btree (created_at) tablespace pg_default;

  -- Enable RLS for chat_sessions
  alter table public.chat_sessions enable row level security;

  -- Chat sessions RLS policy
  create policy "Users can view own chat sessions"
  on public.chat_sessions
  as permissive
  for all
  to public
  using (auth.uid() = user_id);

    -- Chat Messages Table
  create table
    public.chat_messages (
      id uuid not null default extensions.uuid_generate_v4 (),
      chat_session_id uuid not null,
      content text null,
      is_user_message boolean not null,
      sources jsonb null,
      created_at timestamp with time zone not null default current_timestamp,
      constraint chat_messages_pkey primary key (id),
      constraint chat_messages_chat_session_id_fkey foreign key (chat_session_id) references chat_sessions (id) on delete cascade
    ) tablespace pg_default;

  create index if not exists idx_chat_messages_chat_session_id on public.chat_messages using btree (chat_session_id) tablespace pg_default;

  -- Enable RLS for chat_messages
  alter table public.chat_messages enable row level security;

  -- Chat messages RLS policy
  create policy "Users can view messages from their sessions"
  on public.chat_messages
  as permissive
  for all
  to public
  using (
    chat_session_id IN (
      SELECT chat_sessions.id
      FROM chat_sessions
      WHERE chat_sessions.user_id = auth.uid()
    )
  );
  ```

## [v1.5.0] - 2024-06-02

### Added

- **End-to-End Types**: Implemented types for `ServerMessage`, `ClientMessage`, `SubmitMessageResult`, and `ChatHistoryUpdateResult` to ensure type safety from client to server actions.
- **Bug Fixes**: Fixed various bugs throughout the application.
- **Chat History Improvement**: Enhanced the chat history feature in the server action chatbot to load the 30 newest messages initially, with a "load more" button to retrieve the next 30 messages.

## [v1.4.0] - 2024-05-25

### Added

- **Vercel AI SDK Example**: Added an example demonstrating the usage of the new Vercel AI SDK with the `use server` directive. This example showcases how to create a Server Action to query a language model and update the frontend UI accordingly.
- **Chat History**: Implemented a chat history feature that allows users to view and interact with their previous conversations. The chat history is seamlessly integrated into the user interface, enhancing the overall user experience.
- **Streaming UI Feature**: Introduced a real-time streaming UI feature that enables users to see the AI-generated responses as they are being generated. This feature provides a more engaging and interactive experience, mimicking a natural conversation flow.
- **useSWR Package Integration**: Implemented the useSWR package to demonstrate how to efficiently handle server actions and data fetching. The useSWR package provides a simple and powerful way to manage server state, ensuring optimal performance and user experience.

## [v1.3.0] - 2024-05-25

### Added

- **Vercel AI SDK Integration**: Migrated from Langchain to the Vercel AI SDK for a more streamlined and efficient integration with AI models. The Vercel AI SDK provides a simpler and more straightforward approach to interacting with AI models, reducing unnecessary complexity in the codebase.

### Removed

- **Langchain Dependency**: Uninstalled Langchain to simplify the codebase and reduce unnecessary complexity. While Langchain provided useful functionality, it was deemed redundant given the capabilities of the Vercel AI SDK. An example of the previous Langchain integration can still be found in the `exampleWithLangchain.md` file in the package folder for reference.

### Updated

- **Memoized Message Component**: Implemented memoization for the `Message` component using `React.memo`. This optimization helps prevent unnecessary re-renders of the `Message` component by only re-rendering when its props change. Memoization improves performance by reducing the number of re-renders, especially in scenarios with large amounts of messages and frequent updates, such as streaming.

### [v1.2.0] - 2024-05-24

#### Added

- **Enhanced Chat List Deletion**: Improved the chat list deletion process with robust checking and validation using Zod. When a chat is deleted, only the associated tag is revalidated, optimizing cache management and avoiding unnecessary clearing of the entire cache for the `aichat` component.

- **Upgraded Chat Component**: Enriched the chat component with a range of new features and enhancements:
  - Expanded support for multiple AI models, including GPT-3.5, GPT-4, and Claude AI Opus, catering to diverse user preferences.
  - Implemented a responsive design that dynamically adjusts the chat width and size based on screen size, responsize screensize across devices.
  - Added a convenient "scroll to top" button for effortless navigation within lengthy chat conversations.
  - Improved error handling and introduced user-friendly error messages to guide users and maintain a smooth interaction flow.
  - Enabled copy-to-clipboard functionality for assistant messages, allowing users to easily capture and share AI-generated responses.
  - Enhanced code block rendering with syntax highlighting and language detection, providing a visually appealing and readable format for shared code snippets.
  - Upgraded the chat input area with multiline support, retry and stop buttons, and optimized integration with the selected AI model, enhancing the overall user input experience.

### [v1.1.0] - 2024-05-23

#### Added

- **Swipeable Chat List Drawers**: Introduced swipeable chat list drawers, enhancing the mobile user experience by providing intuitive navigation and management of chats.
- **Claude AI Opus Integration**: Expanded the available AI models by integrating Claude AI Opus, offering users an additional option for their chat interactions.
- **Abort Signal Handling**: Implemented abort signal functionality, allowing users to gracefully cancel ongoing chat requests, improving overall application responsiveness.
- **Partial Chat Save**: Developed a robust partial chat save mechanism. In the event of a user aborting the chat mid-stream or a stream failure, the application now stores the generated content up to that point, minimizing data loss and ensuring a more reliable user experience.

#### Updated

- **Optimized Drawer Rendering**: Enhanced drawer rendering performance for users with numerous chats by leveraging `useMemo` to minimize unnecessary re-renders, resulting in a smoother and more efficient user interface.
- **Optimized UseChat Component**: Improved the `UseChat` component's responsiveness and performance across various screen sizes, providing a consistent and optimized user experience.

### [v1.0.0] - 2024-05-22

#### Added

- **Latest AI Package**: Upgraded to the most recent AI package from Vercel, leveraging the latest advancements in artificial intelligence technology.
- **Langchain Upgrade**: Updated to the newest version of Langchain, enhancing the integration and communication between the application and AI models.
- **Chat History Feature**: Introduced chat history feature, enabling users to easily access and reference their previous conversations.
- **Mobile-Friendly Chat**: Implemented a responsive chat interface that dynamically adapts its width and size based on the user's screen size, ensuring optimal usability across various devices.
- **Modern Authentication Pages**: Revamped the `/signup` page with a sleek and professional design for sign-in, sign-up, and password reset flows, elevating the overall user experience and visual appeal.
