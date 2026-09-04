import {
  Brain,
  Check,
  Link2,
  MessagesSquare,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2
} from 'lucide-react';

// The surfaces around the conversation itself: which model runs, what the
// assistant remembers, and what happens to a chat after it ends. Values here
// mirror the seeded `ai_models` catalog in database/setup.sql.

const models = [
  { name: 'Sonnet 5', note: '~$0.45/answer', active: true },
  { name: 'Opus 4.8', note: '~$1.25/answer', active: false },
  { name: 'Fable 5', note: '~$2.50/answer', active: false }
];

const memories = [
  'Prefers TypeScript with strict mode enabled',
  'Works in CET — schedule summaries for 08:00',
  'Company benchmark target: churn under 3%'
];

const conversations = [
  { title: 'Q3 report review', meta: 'Today · 14 messages', starred: true },
  { title: 'Onboarding email rewrite', meta: 'Yesterday', starred: false },
  { title: 'pgvector index tuning', meta: 'Mon', starred: false }
];

function WorkspaceCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  footer
}: {
  icon: typeof Brain;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <div className="mt-4 grow">{children}</div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {footer}
      </p>
    </div>
  );
}

export function Workspace() {
  return (
    <section className="border-b bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            And everything around the conversation
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            The parts a demo usually skips: picking a model with its price in
            view, memory you can audit, and chats you can find again.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <WorkspaceCard
            icon={Sparkles}
            eyebrow="Model control"
            title="Pick a model with the price in view"
            footer="The catalog lives in the database with real pricing, so the picker can show an estimated cost per answer. Your pick is stored on the conversation — each chat keeps its own."
          >
            <ul className="space-y-2">
              {models.map(({ name, note, active }) => (
                <li
                  key={name}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                    active
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                      : 'bg-background/60'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      active ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  >
                    {active && (
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    )}
                  </span>
                  <span className="grow text-sm font-medium">{name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {note}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Saved to this conversation — switch any time</span>
              </li>
            </ul>
          </WorkspaceCard>

          <WorkspaceCard
            icon={Brain}
            eyebrow="Memory"
            title="It remembers — and you can audit it"
            footer="The assistant saves memories through a tool call, and every one of them is listed in AI settings to edit or delete. They ride along in the system prompt of every new chat."
          >
            <ul className="space-y-2">
              {memories.map((memory) => (
                <li
                  key={memory}
                  className="flex items-start gap-2.5 rounded-lg border bg-background/60 px-3 py-2.5"
                >
                  <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="grow text-xs leading-relaxed">{memory}</span>
                  <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>Add a memory yourself</span>
              </li>
            </ul>
          </WorkspaceCard>

          <WorkspaceCard
            icon={MessagesSquare}
            eyebrow="Conversations"
            title="Search, favorite, rename, share"
            footer="Chats title themselves after the first exchange. Search runs across every past conversation — from the conversations screen, or as a tool the assistant can call mid-answer."
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                <Search className="h-3.5 w-3.5" />
                <span>churn</span>
                <span className="ml-auto text-[10px]">3 results</span>
              </div>
              {conversations.map(({ title, meta, starred }) => (
                <div
                  key={title}
                  className="flex items-center gap-2.5 rounded-lg border bg-background/60 px-3 py-2.5"
                >
                  <div className="grow">
                    <p className="truncate text-xs font-medium">{title}</p>
                    <p className="text-[10px] text-muted-foreground">{meta}</p>
                  </div>
                  {starred ? (
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  ) : (
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                <span className="truncate font-mono">/shared-chat/8f2a…</span>
                <span className="ml-auto shrink-0">public link</span>
              </div>
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </section>
  );
}
