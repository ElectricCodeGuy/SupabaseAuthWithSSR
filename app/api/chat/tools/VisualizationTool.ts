// app/api/chat/tools/VisualizationTool.ts
//
// Interactive HTML visualizations in chat — sandboxed-iframe "mini apps"
// (charts, dashboards, diagrams, flows, steppers, timelines, calculators)
// the model builds as a complete self-contained HTML document. Replaces the
// old fixed-shape createChart tool: instead of a four-type recharts spec the
// model writes real HTML/JS and may pull chart/diagram libraries from a CDN
// whitelist (mirrored by the CSP in app/chat/components/HtmlFrame.tsx).
//
// Same design as the document workspace (ArtifactTool.ts): the full HTML
// travels IN THE TOOL INPUT, so streaming, persistence/versioning (tool
// parts in message_parts) and billing all come for free. pruneMessages
// strips tool parts from model context, so the route injects the latest
// state of every visualization into the system prompt via
// buildVisualizationPrompt — that is how the model can update one later.
//
// The client renders the HTML in an <iframe sandbox="allow-scripts"> —
// never allow-same-origin (srcDoc inherits the app origin) — either inline
// in the message or in the side panel, per the model's `display` choice.

import { tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

type VisualizationDisplay = 'inline' | 'panel';

interface VisualizationState {
  title: string;
  html: string;
  display: VisualizationDisplay;
  height: number | null;
  version: number;
  // Scan order of the last create/update — buildVisualizationPrompt injects
  // full HTML only for the most recently touched visualization.
  touch?: number;
}

// The prompt describes 300–900 px; out-of-range values are clamped instead
// of failing the whole tool call (a hard zod bound would burn a retry).
function clampHeight(height: number | null | undefined): number | null {
  if (height == null || Number.isNaN(height)) return null;
  return Math.min(900, Math.max(300, Math.round(height)));
}

// Mutable per-request store: seeded from history, updated by the tools as
// the turn progresses so create-then-update in one turn stays consistent.
export type VisualizationStore = Map<string, VisualizationState>;

interface VisualizationPartShape {
  type: string;
  input?: {
    title?: string;
    html?: string;
    display?: string;
    height?: number;
    visualizationId?: string;
  };
  output?: { visualizationId?: string; version?: number };
}

// Rebuild the latest state of every visualization from the conversation
// history. Parts are scanned in message order, so the last create/update wins.
export function buildVisualizationStore(
  messages: UIMessage[]
): VisualizationStore {
  const store: VisualizationStore = new Map();
  let touch = 0;
  for (const message of messages) {
    for (const part of message.parts ?? []) {
      const p = part as VisualizationPartShape;
      if (
        p.type === 'tool-createVisualization' &&
        p.output?.visualizationId &&
        p.input?.html
      ) {
        store.set(p.output.visualizationId, {
          title: p.input.title || 'Visualization',
          html: p.input.html,
          display: p.input.display === 'panel' ? 'panel' : 'inline',
          height: clampHeight(p.input.height),
          version: p.output.version ?? 1,
          touch: touch++
        });
      } else if (
        p.type === 'tool-updateVisualization' &&
        p.input?.visualizationId &&
        p.input?.html &&
        p.output?.visualizationId // only successful updates count as versions
      ) {
        const prev = store.get(p.input.visualizationId);
        store.set(p.input.visualizationId, {
          title: p.input.title || prev?.title || 'Visualization',
          html: p.input.html,
          display:
            p.input.display === 'panel' || p.input.display === 'inline'
              ? p.input.display
              : (prev?.display ?? 'inline'),
          height: clampHeight(p.input.height) ?? prev?.height ?? null,
          version: p.output.version ?? (prev ? prev.version + 1 : 1),
          touch: touch++
        });
      }
    }
  }
  return store;
}

// System-prompt block appended to the dynamic instructions: tool guidance
// plus the current state of every visualization in the conversation.
export function buildVisualizationPrompt(store: VisualizationStore): string {
  const guidance = `

<visualizations>
You can build interactive HTML visualizations rendered in a sandboxed iframe — use them when a visual answer beats prose: charts and small dashboards from real data, comparison diagrams, process flows, timelines, steppers, org charts, small interactive calculators or explorers.

- createVisualization({ title, display, height?, html }): build a NEW visualization. Write a COMPLETE self-contained HTML document in \`html\` (<!DOCTYPE html> through </html>) with all CSS and JavaScript inline. External libraries are allowed ONLY from these CDNs: esm.sh, cdn.jsdelivr.net, unpkg.com, cdnjs.cloudflare.com (e.g. <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>); Google Fonts is also allowed. Well-supported choices when a library earns its weight — copy these exact URLs: standard charts <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>; rich interactive charts <script src="https://cdn.jsdelivr.net/npm/echarts@6"></script>; custom data graphics <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>; flow/sequence diagrams <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script> (the bare mermaid@11 URL does NOT resolve — keep the /dist path); 3D scenes via ES module: import * as THREE from "https://esm.sh/three" inside <script type="module">. Always pin the major version in the CDN URL as shown, so the document keeps working when the CDN's "latest" moves. No other network access works inside the sandbox — never fetch() your own data, embed it directly in the document. Images must be inline (a data: URI, an inline <svg>, or CSS-drawn) — remote image URLs from other hosts are blocked and will not load, so do not hotlink images.
- updateVisualization({ visualizationId, html }): revise an EXISTING visualization. Pass the visualizationId listed in <currentVisualizations> and the COMPLETE revised HTML document — every version is whole, include all unchanged parts verbatim.
- display: "inline" renders the visualization directly inside your chat answer — right for compact visuals that support the answer (a single chart, a small diagram, a stepper). "panel" opens it in the side panel next to the chat — right for larger interactive pieces the user will explore or iterate on. Pick based on the question; when the user asks to build/design something iteratively, prefer "panel".
- height: iframe height in pixels for inline display (300–900, default 420). Size it to the content so nothing is cut off.
- ONLY visualize real data — numbers from the conversation, the user's documents, or other tool results. NEVER invent data points.
- Design: clean and modern, system font stack (or a Google Font), generous spacing, rounded corners, a readable colour palette. Give the document its own background colour that works standalone (a light neutral like #ffffff or #fafafa). Make it responsive to the iframe width (use relative units / flex / grid; no fixed page widths).
- Keep your chat reply to one or two short sentences about what the visualization shows — never paste HTML or code into the chat reply, and do not repeat the underlying numbers as a list.
- The sandbox reports no errors back to you automatically, so prefer simple, defensive vanilla JavaScript and skip libraries unless they clearly earn their weight. If the user reports a browser error from a visualization (a message quoting a script error), fix the ROOT CAUSE and ship the corrected COMPLETE document via updateVisualization.
</visualizations>`;

  if (store.size === 0) return guidance;

  // HTML documents are large and this block is re-sent uncached on every
  // step of every turn — only the most recently touched visualization gets
  // its full HTML; the rest are listed by id/title so the model can still
  // target them with updateVisualization (rebuilding the document whole).
  const entries = [...store.entries()].sort(
    (a, b) => (b[1].touch ?? 0) - (a[1].touch ?? 0)
  );
  const vizzes = entries
    .map(([id, v], i) => {
      const attrs = `visualizationId="${id}" title="${v.title.replace(/"/g, "'")}" display="${v.display}"${v.height ? ` height="${v.height}"` : ''} version="${v.version}"`;
      if (i === 0) {
        return `<visualization ${attrs}>\n${v.html}\n</visualization>`;
      }
      return `<visualization ${attrs}>(full HTML omitted to save context — to revise this visualization, call updateVisualization with this visualizationId and a COMPLETE freshly written HTML document)</visualization>`;
    })
    .join('\n');

  return `${guidance}

<currentVisualizations>
Visualizations already in this conversation (latest version each, most recently changed first). Use updateVisualization with the matching visualizationId to revise them:
${vizzes}
</currentVisualizations>`;
}

interface VisualizationToolProps {
  store: VisualizationStore;
}

export const createVisualizationTool = ({ store }: VisualizationToolProps) =>
  tool({
    description: `Build an interactive HTML visualization rendered in a sandboxed iframe — charts, dashboards, diagrams, process flows, timelines, steppers, calculators. Write a COMPLETE self-contained HTML document in "html" (inline CSS/JS; libraries only from esm.sh / cdn.jsdelivr.net / unpkg.com / cdnjs.cloudflare.com). Choose "inline" to show it inside the chat answer, "panel" to open it in the side panel. Only visualize real data from the conversation. Keep the chat reply short and never repeat the HTML in the chat.`,
    // Property order matters: display/height stream before the (large) html
    // argument, so the client knows inline-vs-panel while the HTML is still
    // being written and can open the panel / show the right placeholder.
    inputSchema: z.object({
      title: z
        .string()
        .min(1)
        .max(200)
        .describe('Short title, e.g. "Revenue by quarter 2025"'),
      display: z
        .enum(['inline', 'panel'])
        .describe(
          '"inline" renders inside the chat message (compact visuals); "panel" opens the side panel (larger interactive pieces)'
        ),
      height: z
        .number()
        .optional()
        .describe(
          'Iframe height in pixels for inline display, 300-900 (default 420). Size to the content.'
        ),
      html: z
        .string()
        .min(1)
        .describe(
          'The complete self-contained HTML document (<!DOCTYPE html> … </html>) with all CSS and JavaScript inline. Embed all data directly — fetch() does not work in the sandbox.'
        )
    }),
    execute: async ({ title, html, display, height }) => {
      const visualizationId = randomUUID();
      const clampedHeight = clampHeight(height);
      store.set(visualizationId, {
        title,
        html,
        display,
        height: clampedHeight,
        version: 1,
        touch: Number.MAX_SAFE_INTEGER
      });

      return {
        visualizationId,
        title,
        display,
        height: clampedHeight,
        version: 1,
        message:
          display === 'panel'
            ? 'Visualization created and shown in the side panel. Use updateVisualization with this visualizationId for later changes.'
            : 'Visualization created and shown inline in the answer. Use updateVisualization with this visualizationId for later changes.'
      };
    }
  });

export const updateVisualizationTool = ({ store }: VisualizationToolProps) =>
  tool({
    description: `Revise an existing HTML visualization. Pass the visualizationId from <currentVisualizations> (or from an earlier createVisualization result in this turn) and the COMPLETE revised HTML document in "html" — include every unchanged part verbatim, versions are always whole documents.`,
    // display/height before html for the same streaming reason as create.
    inputSchema: z.object({
      visualizationId: z
        .string()
        .min(1)
        .describe('The visualizationId of the visualization to revise'),
      title: z
        .string()
        .min(1)
        .max(200)
        .optional()
        .describe('New title, only when the user asked to rename it'),
      display: z
        .enum(['inline', 'panel'])
        .optional()
        .describe('Only pass to move the visualization between inline and panel'),
      height: z
        .number()
        .optional()
        .describe('New iframe height in pixels for inline display (300-900)'),
      html: z
        .string()
        .min(1)
        .describe(
          'The complete revised HTML document — full markup including unchanged parts'
        )
    }),
    execute: async ({ visualizationId, html, title, display, height }) => {
      const prev = store.get(visualizationId);
      if (!prev) {
        return {
          error: `Unknown visualizationId "${visualizationId}". Use a visualizationId from <currentVisualizations>, or create a new visualization with createVisualization.`
        };
      }

      const version = prev.version + 1;
      const nextDisplay = display ?? prev.display;
      // Height persists across updates — an update that omits it must not
      // reset an inline visualization back to the default height.
      const nextHeight = clampHeight(height) ?? prev.height ?? null;
      store.set(visualizationId, {
        title: title || prev.title,
        html,
        display: nextDisplay,
        height: nextHeight,
        version,
        touch: Number.MAX_SAFE_INTEGER
      });

      return {
        visualizationId,
        title: title || prev.title,
        display: nextDisplay,
        height: nextHeight,
        version,
        message: `Visualization updated to version ${version}.`
      };
    }
  });
