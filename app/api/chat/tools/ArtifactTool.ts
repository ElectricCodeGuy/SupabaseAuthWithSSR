// app/api/chat/tools/ArtifactTool.ts
//
// Document workspace (artifacts) — canvas-style document drafting in chat.
//
// Design: the document content travels IN THE TOOL INPUT — the model writes
// the complete markdown as the `content` argument. That gives three things
// for free:
//  - live typewriter streaming in the panel via the SDK's input-streaming
//    tool-part states (no custom data-stream writer needed),
//  - persistence and versioning: tool parts (input + output) are already
//    saved to message_parts by the normal chat pipeline, so every
//    create/update IS a stored version — no new tables,
//  - the content tokens are ordinary output tokens of the main stream.
//
// pruneMessages strips older tool parts from model context, so the route
// injects the latest state of every document into the system prompt via
// buildArtifactPrompt — that is how the model sees the current document and
// its artifactId on later turns.

import { tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

interface ArtifactState {
  title: string;
  content: string;
  version: number;
}

// Mutable per-request store: seeded from history, updated by the tools as
// the turn progresses so create-then-update in one turn stays consistent.
export type ArtifactStore = Map<string, ArtifactState>;

interface ArtifactPartShape {
  type: string;
  input?: { title?: string; content?: string; artifactId?: string };
  output?: { artifactId?: string; version?: number };
}

// Rebuild the latest state of every artifact from the conversation history.
// Parts are scanned in message order, so the last create/update wins.
export function buildArtifactStore(messages: UIMessage[]): ArtifactStore {
  const store: ArtifactStore = new Map();
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      const p = part as ArtifactPartShape;
      if (
        p.type === 'tool-createArtifact' &&
        p.output?.artifactId &&
        p.input?.content
      ) {
        store.set(p.output.artifactId, {
          title: p.input.title || 'Document',
          content: p.input.content,
          version: p.output.version ?? 1
        });
      } else if (
        p.type === 'tool-updateArtifact' &&
        p.input?.artifactId &&
        p.input?.content &&
        p.output?.artifactId // only successful updates count as versions
      ) {
        const prev = store.get(p.input.artifactId);
        store.set(p.input.artifactId, {
          title: p.input.title || prev?.title || 'Document',
          content: p.input.content,
          version: p.output.version ?? (prev ? prev.version + 1 : 1)
        });
      }
    }
  }
  return store;
}

// System-prompt block appended to the dynamic instructions: tool guidance
// plus the current state of every document in the conversation.
export function buildArtifactPrompt(store: ArtifactStore): string {
  const guidance = `

<documentWorkspace>
You have a document workspace that opens side-by-side with the chat. Use it whenever the user wants to draft, write or iterate on a piece of writing — an essay, report, letter, blog post, README, contract draft or similar.

- createArtifact({ title, content }): start a NEW document. Write the COMPLETE document as Markdown in \`content\`, using headings (#, ##), lists and tables where they fit.
- updateArtifact({ artifactId, content }): revise an EXISTING document. Pass the artifactId listed in <currentDocuments> and the COMPLETE revised Markdown — every version shown to the user is a whole document, so include all unchanged sections verbatim.
- Keep your chat reply to one or two short sentences about what you wrote or changed. The document lives in the panel — never paste the document text into the chat reply.
- Use createPDF only when the user explicitly asks for a finished PDF FILE in one shot; for drafting and revision the document workspace is the right tool.
</documentWorkspace>`;

  if (store.size === 0) return guidance;

  const docs = [...store.entries()]
    .map(
      ([id, a]) =>
        `<document artifactId="${id}" title="${a.title.replace(/"/g, "'")}" version="${a.version}">\n${a.content}\n</document>`
    )
    .join('\n');

  return `${guidance}

<currentDocuments>
Documents already in this conversation (latest version each). Use updateArtifact with the matching artifactId to revise them:
${docs}
</currentDocuments>`;
}

interface ArtifactToolProps {
  store: ArtifactStore;
}

export const createArtifactTool = ({ store }: ArtifactToolProps) =>
  tool({
    description: `Create a new document in the document workspace panel next to the chat. Use this when the user wants to draft or write a document they will refine — essay, report, letter, blog post, README etc. Write the COMPLETE document as Markdown in "content". The document appears live in the panel while you write; keep your chat reply short and never repeat the document text in the chat.`,
    inputSchema: z.object({
      title: z
        .string()
        .min(1)
        .max(200)
        .describe(
          'Short document title shown in the panel header, e.g. "Q3 Marketing Plan"'
        ),
      content: z
        .string()
        .min(1)
        .describe(
          'The complete document as Markdown. Use # / ## headings, lists and tables. Always the full document — no placeholders.'
        )
    }),
    execute: async ({ title, content }) => {
      const artifactId = randomUUID();
      store.set(artifactId, { title, content, version: 1 });

      return {
        artifactId,
        title,
        version: 1,
        message:
          'Document created and shown in the workspace panel. Use updateArtifact with this artifactId for later changes.'
      };
    }
  });

export const updateArtifactTool = ({ store }: ArtifactToolProps) =>
  tool({
    description: `Revise an existing document in the document workspace. Pass the artifactId from <currentDocuments> (or from an earlier createArtifact result in this turn) and the COMPLETE revised Markdown in "content" — include every unchanged section verbatim, the panel always shows whole versions.`,
    inputSchema: z.object({
      artifactId: z
        .string()
        .min(1)
        .describe('The artifactId of the document to revise'),
      content: z
        .string()
        .min(1)
        .describe(
          'The complete revised document as Markdown — full text including unchanged sections'
        ),
      title: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe('New title, only when the user asked to rename the document')
    }),
    execute: async ({ artifactId, content, title }) => {
      const prev = store.get(artifactId);
      if (!prev) {
        return {
          error: `Unknown artifactId "${artifactId}". Use an artifactId from <currentDocuments>, or create a new document with createArtifact.`
        };
      }

      const version = prev.version + 1;
      store.set(artifactId, {
        title: title || prev.title,
        content,
        version
      });

      return {
        artifactId,
        title: title || prev.title,
        version,
        message: `Document updated to version ${version} in the workspace panel.`
      };
    }
  });
