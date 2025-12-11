# Reddit Post for r/nextjs

## Title

Following up on "Next.js + Supabase + Nothing Else" - Open source RAG chat app (v3.0.0)

---

## Body

Hey everyone!

Yesterday I posted about running a legal research platform with 2000+ daily users on just Next.js and Supabase. That post got way more attention than I expected, and a lot of you DM'd me asking for a template or starter.

I've just updated my open-source project to v3.0.0. It's a document chat application - upload your PDFs, chat with them using AI, and search the web. Built with the same stack I talked about: Next.js, Supabase, Postgres. Nothing else.

**GitHub:** https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR

## What it does

**Upload documents** - Drop your PDFs in the file manager. They get parsed with LlamaIndex Cloud and stored in Supabase Storage.

**Chat with your documents** - Ask questions and the AI searches through your uploaded files using semantic search. It finds relevant pages, shows you where the information came from, and you can click to view the actual document page.

**Web search** - The AI can also search the web using Exa AI when it needs current information. Useful for finding up-to-date stuff that isn't in your documents.

**Multiple AI models** - Switch between GPT-4, Claude, Gemini, etc. mid-conversation.

## How the RAG works

When you upload a PDF:
1. LlamaIndex Cloud parses it to markdown (page by page)
2. Each page gets embedded using Voyage AI (1024 dimensions)
3. Vectors stored in Postgres with pgvector and HNSW indexing

When you ask a question:
1. AI decides if it needs to search your documents
2. Your question gets embedded and matched against document vectors
3. Relevant pages come back with similarity scores
4. AI uses that context to answer, citing specific pages

No Pinecone. No separate vector database. Just Postgres.

## Tech stack

- **Next.js 15** - App Router
- **Supabase** - Auth, Postgres, Storage, pgvector
- **Vercel AI SDK v5** - Streaming chat with tools
- **Voyage AI** - Embeddings
- **Exa AI** - Web search
- **LlamaIndex Cloud** - PDF parsing
- **shadcn/ui** - Components

## What's new in v3

- AI autonomously decides when to search documents (no manual file selection)
- Incremental message saving - messages save to DB as the AI streams, not after
- Tool results displayed in collapsible accordions
- Route groups for cleaner code structure
- Complete SQL setup file included

## Project structure

Follows the Bulletproof React pattern - code stays close to where it's used. Each feature has its own folder with components, hooks, and types. No jumping between 10 different folders to understand one feature. The chat stuff lives in `/app/(dashboard)/chat`, file management in `/app/(dashboard)/filer`. API routes sit next to what they serve. No spaghetti.

## Getting started

There's a `database/setup.sql` file with all the tables, indexes, RLS policies, and functions. Just paste it in the Supabase SQL Editor and you're set.

## Coming next

- Stripe integration for subscriptions
- Admin panel

It's not a production-ready SaaS template - it's a working example of how to build a RAG chat app with a simple stack. Take what's useful, ignore what isn't.

---

**Links:**
- GitHub: https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR
- Yesterday's post: https://www.reddit.com/r/nextjs/comments/1pj166c/nextjs_supabase_nothing_else/
