// Client-side derivation of workspace documents ("artifacts") and HTML
// visualizations from chat messages. There is no separate table for either:
// every tool-createArtifact / tool-updateArtifact / tool-createVisualization /
// tool-updateVisualization part IS a version (the full markdown/HTML travels
// in the tool input and is persisted with the message parts), so the version
// history falls out of a single ordered scan. Both kinds share the same
// group/version model — and therefore the same side panel and pin/dismiss
// state in Chat.tsx.

import type { UIMessage } from 'ai';

type ArtifactKind = 'document' | 'html';

export interface ArtifactVersionView {
  // Stable per-part key (messageId + part index) — used for React keys and
  // as the group's stable identity (its first version's key never changes,
  // unlike the group id which flips from pending to the real artifactId).
  key: string;
  // Global scan order across all messages — the highest seq is the newest
  // version in the conversation.
  seq: number;
  action: 'create' | 'update';
  title: string;
  // Markdown for documents, the complete HTML document for visualizations.
  content: string;
  // True while the model is still typing the content (input-streaming).
  streaming: boolean;
  // Whether producing this version should auto-open the side panel.
  // Documents and panel-visualizations do; inline visualizations render in
  // the message itself. False while a visualization's display arg hasn't
  // streamed in yet — it flips as soon as "panel" arrives.
  autoOpen: boolean;
}

export interface ArtifactGroup {
  id: string;
  kind: ArtifactKind;
  title: string;
  versions: ArtifactVersionView[];
}

interface ArtifactPartShape {
  type: string;
  state?: string;
  input?: {
    title?: string;
    content?: string;
    html?: string;
    display?: string;
    artifactId?: string;
    visualizationId?: string;
  };
  output?: {
    artifactId?: string;
    visualizationId?: string;
    version?: number;
    error?: string;
  };
}

// Scan all messages in order and group versions per artifact/visualization
// id. A part that is still streaming has no server-assigned id yet — it gets
// a pending group id derived from its position, and the group id flips to
// the real id once the tool result arrives. Group *identity* for UI state is
// therefore versions[0].key, which never changes.
//
// liveMessageId: the id of the message currently being generated (or null
// when the chat is idle). Persisted parts keep their tool state verbatim, so
// an aborted generation leaves parts frozen in input-streaming /
// input-available — a part in an input state OUTSIDE the live message is
// such a leftover: its content is truncated, so it is never a version.
export function deriveArtifacts(
  messages: UIMessage[],
  liveMessageId?: string | null
): ArtifactGroup[] {
  const groups = new Map<string, ArtifactGroup>();
  let seq = 0;

  messages.forEach((message) => {
    (message.parts ?? []).forEach((part, partIndex) => {
      const p = part as ArtifactPartShape;

      const isDocument =
        p.type === 'tool-createArtifact' || p.type === 'tool-updateArtifact';
      const isViz =
        p.type === 'tool-createVisualization' ||
        p.type === 'tool-updateVisualization';
      if (!isDocument && !isViz) return;

      const kind: ArtifactKind = isDocument ? 'document' : 'html';
      const action =
        p.type === 'tool-createArtifact' ||
        p.type === 'tool-createVisualization'
          ? 'create'
          : 'update';
      const finished =
        p.state === 'output-available' || p.state === 'output-error';
      const outputId = isDocument
        ? p.output?.artifactId
        : p.output?.visualizationId;
      const inputId = isDocument
        ? p.input?.artifactId
        : p.input?.visualizationId;

      // A finished update that failed (unknown id) is not a version.
      if (finished && action === 'update' && !outputId) return;
      if (p.state === 'output-error') return;

      const inputState =
        p.state === 'input-streaming' || p.state === 'input-available';
      // Aborted leftover (see liveMessageId above) — truncated, not a version.
      if (inputState && message.id !== liveMessageId) return;

      const content = (isDocument ? p.input?.content : p.input?.html) ?? '';
      if (!content && finished) return;

      const id =
        (action === 'create' ? outputId : inputId) ??
        `pending:${message.id}:${partIndex}`;

      const version: ArtifactVersionView = {
        key: `${message.id}:${partIndex}`,
        seq: seq++,
        action,
        title: p.input?.title ?? '',
        content,
        // input-available counts too: providers that don't stream tool args
        // jump straight there, and it's also what drives auto-open for them.
        streaming: inputState,
        // An update without a display arg keeps its group's mode; treat the
        // absence as inline here and let the group-level display (below)
        // decide — auto-open is re-derived per version, and only an explicit
        // or inherited "panel" should pop the panel.
        autoOpen: isDocument ? true : p.input?.display === 'panel'
      };

      const group = groups.get(id);
      if (group) {
        // Updates without an explicit display inherit the group's mode: if
        // any earlier version was panel-mode, a display-less update is too.
        if (
          kind === 'html' &&
          !p.input?.display &&
          group.versions.some((v) => v.autoOpen)
        ) {
          version.autoOpen = true;
        }
        group.versions.push(version);
        if (version.title) group.title = version.title;
      } else {
        groups.set(id, {
          id,
          kind,
          title: version.title || (isDocument ? 'Document' : 'Visualization'),
          versions: [version]
        });
      }
    });
  });

  return [...groups.values()];
}

// The newest version across the whole conversation (highest seq), with its
// group. This single value drives the panel's auto-open/auto-follow: a new
// version means a new key, whether it arrived streaming or fully formed.
// With autoOpenOnly, inline visualizations are skipped entirely — they render
// in the transcript and must never open, close or re-target the panel.
export function findLatestArtifactVersion(
  artifacts: ArtifactGroup[],
  autoOpenOnly = false
): { group: ArtifactGroup; version: ArtifactVersionView } | null {
  let latest: { group: ArtifactGroup; version: ArtifactVersionView } | null =
    null;
  for (const group of artifacts) {
    for (const version of group.versions) {
      if (autoOpenOnly && !version.autoOpen) continue;
      if (!latest || version.seq > latest.version.seq) {
        latest = { group, version };
      }
    }
  }
  return latest;
}

// Stable identity for a group across the pending→real id flip.
export function groupKey(group: ArtifactGroup): string {
  return group.versions[0]?.key ?? group.id;
}
