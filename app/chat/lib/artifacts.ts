// Client-side derivation of workspace documents ("artifacts") from chat
// messages. There is no separate documents table: every
// tool-createArtifact / tool-updateArtifact part IS a version (the full
// markdown travels in the tool input and is persisted with the message
// parts), so the version history falls out of a single ordered scan.

import type { UIMessage } from 'ai';

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
  content: string;
  // True while the model is still typing the content (input-streaming).
  streaming: boolean;
}

export interface ArtifactGroup {
  id: string;
  title: string;
  versions: ArtifactVersionView[];
}

interface ArtifactPartShape {
  type: string;
  state?: string;
  input?: { title?: string; content?: string; artifactId?: string };
  output?: { artifactId?: string; version?: number; error?: string };
}

// Scan all messages in order and group versions per artifact id. A part that
// is still streaming has no server-assigned id yet — it gets a pending group
// id derived from its position, and the group id flips to the real
// artifactId once the tool result arrives. Group *identity* for UI state is
// therefore versions[0].key, which never changes.
export function deriveArtifacts(messages: UIMessage[]): ArtifactGroup[] {
  const groups = new Map<string, ArtifactGroup>();
  let seq = 0;

  messages.forEach((message) => {
    (message.parts ?? []).forEach((part, partIndex) => {
      const p = part as ArtifactPartShape;
      if (p.type !== 'tool-createArtifact' && p.type !== 'tool-updateArtifact')
        return;

      const action = p.type === 'tool-createArtifact' ? 'create' : 'update';
      const finished =
        p.state === 'output-available' || p.state === 'output-error';

      // A finished update that failed (unknown artifactId) is not a version.
      if (finished && action === 'update' && !p.output?.artifactId) return;
      if (p.state === 'output-error') return;

      const content = p.input?.content ?? '';
      if (!content && finished) return;

      const id =
        (action === 'create' ? p.output?.artifactId : p.input?.artifactId) ??
        `pending:${message.id}:${partIndex}`;

      const version: ArtifactVersionView = {
        key: `${message.id}:${partIndex}`,
        seq: seq++,
        action,
        title: p.input?.title ?? '',
        content,
        // input-available counts too: providers that don't stream tool args
        // jump straight there, and it's also what drives auto-open for them.
        streaming:
          p.state === 'input-streaming' || p.state === 'input-available'
      };

      const group = groups.get(id);
      if (group) {
        group.versions.push(version);
        if (version.title) group.title = version.title;
      } else {
        groups.set(id, {
          id,
          title: version.title || 'Document',
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
export function findLatestArtifactVersion(
  artifacts: ArtifactGroup[]
): { group: ArtifactGroup; version: ArtifactVersionView } | null {
  let latest: { group: ArtifactGroup; version: ArtifactVersionView } | null =
    null;
  for (const group of artifacts) {
    for (const version of group.versions) {
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
