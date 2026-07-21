'use client';

// Centered AI settings modal with a mini sidebar (General / Memories).
//
// Data flows in as PROPS (fetched server-side in the dashboard layout) and
// every mutation is a plain <form action={serverAction}> with nested
// useFormStatus pending buttons. The actions call refresh(), so the props
// re-render with fresh data — no client fetching, no loading state.
//
// Open state lives in the URL HASH: `#ai-settings` (general) or
// `#ai-settings/memories`. Triggers call openAISettings(), which writes the
// hash with window.history.replaceState — NOT a Next.js navigation — and
// fires a hashchange event so the mounted modal syncs. Closing strips the
// hash the same way. The single useEffect here is the hashchange
// subscription (external system → state), which is what effects are for.
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Bot,
  Brain,
  Check,
  Loader2,
  Pencil,
  Plus,
  Settings2,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { AISettingsData } from './types';
import {
  setDefaultModelAction,
  updateDisplayNameAction,
  addMemoryAction,
  updateMemoryAction,
  deleteMemoryAction
} from './actions';
const HASH_PREFIX = '#ai-settings';
type SettingsTab = 'general' | 'memories';

// Open the modal from anywhere (sidebar item, menus, …). replaceState does
// not fire hashchange on its own, so we dispatch it manually.
export function openAISettings(tab: SettingsTab = 'general') {
  const hash = tab === 'memories' ? `${HASH_PREFIX}/memories` : HASH_PREFIX;
  window.history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function closeAISettings() {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  );
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ── General tab ──────────────────────────────────────────────────────────────
function SaveNameButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="h-9" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
    </Button>
  );
}

function ModelOption({
  model,
  active
}: {
  model: AISettingsData['models'][number];
  active: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="modelId"
      value={model.model_id}
      role="radio"
      aria-checked={active}
      disabled={pending}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60 ${
        active ? 'border-primary bg-primary/5' : 'hover:bg-accent/40'
      }`}
    >
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          active ? 'border-primary bg-primary' : 'border-border'
        }`}
        aria-hidden
      >
        {active && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span>{model.display_name}</span>
          {model.cost_note && (
            <span className="text-xs font-normal text-muted-foreground">
              {model.cost_note}
            </span>
          )}
        </span>
        {model.description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {model.description}
          </span>
        )}
      </span>
    </button>
  );
}

function GeneralTab({ data }: { data: AISettingsData }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold">Profile</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          How the assistant refers to you. Signed in as {data.email}.
        </p>
        <form
          action={async (formData) => {
            await updateDisplayNameAction(formData);
          }}
          className="flex items-center gap-2"
        >
          <input
            name="fullName"
            defaultValue={data.fullName}
            placeholder="Your name"
            required
            maxLength={200}
            className="h-9 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
          />
          <SaveNameButton />
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Default AI model</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Used for every new message. Clicking a model saves it immediately.
        </p>
        {/* One form; each model row is a submit button carrying its id. */}
        <form
          action={async (formData) => {
            await setDefaultModelAction(formData);
          }}
          className="space-y-2"
          role="radiogroup"
          aria-label="Default AI model"
        >
          {data.models.map((model) => (
            <ModelOption
              key={model.model_id}
              model={model}
              active={model.model_id === data.selectedModel}
            />
          ))}
        </form>
      </section>
    </div>
  );
}

// ── Memories tab ─────────────────────────────────────────────────────────────
function AddMemoryButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="icon"
      className="h-9 w-9 shrink-0"
      disabled={pending}
      title="Add memory"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
}

function SaveMemoryButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="h-7 text-xs" disabled={pending}>
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
    </Button>
  );
}

function DeleteMemoryButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={pending}
      title="Delete memory"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function MemoryRow({
  memory
}: {
  memory: { id: string; content: string; created_at: string };
}) {
  const [editing, setEditing] = useState(false);

  const saveMemory = async (formData: FormData) => {
    const result = await updateMemoryAction(formData);
    if (result.success) setEditing(false);
  };

  return (
    <li className="rounded-lg border bg-card p-3">
      {editing ? (
        <form action={saveMemory}>
          <input type="hidden" name="memoryId" value={memory.id} />
          <textarea
            name="content"
            defaultValue={memory.content}
            rows={3}
            required
            maxLength={500}
            className="w-full resize-none rounded-md border bg-background p-2 text-sm"
          />
          <div className="mt-2 flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <SaveMemoryButton />
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-sm leading-snug">
            {memory.content}
          </p>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setEditing(true)}
              title="Edit memory"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <form
              action={async (formData) => {
                await deleteMemoryAction(formData);
              }}
            >
              <input type="hidden" name="memoryId" value={memory.id} />
              <DeleteMemoryButton />
            </form>
          </div>
        </div>
      )}
    </li>
  );
}

function MemoriesTab({ memories }: { memories: AISettingsData['memories'] }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">What the AI knows about you</h3>
        <p className="text-xs text-muted-foreground">
          These memories are injected into every conversation. The assistant
          adds them when you ask it to remember something — you can also add,
          edit or delete them here.
        </p>
      </div>

      {/* Uncontrolled form — React resets it automatically after the action */}
      <form
        action={async (formData) => {
          await addMemoryAction(formData);
        }}
        className="flex items-start gap-2"
      >
        <textarea
          name="content"
          rows={2}
          required
          maxLength={500}
          placeholder='Add a memory, e.g. "I prefer short, code-first answers."'
          className="w-full resize-none rounded-md border bg-background p-2 text-sm"
        />
        <AddMemoryButton />
      </form>

      {memories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Brain className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No memories yet. Try telling the assistant
            <span className="italic"> &quot;remember that …&quot;</span> in a
            chat, or add one above.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {memories.map((memory) => (
            <MemoryRow key={memory.id} memory={memory} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────────────
const NAV_ITEMS: { tab: SettingsTab; label: string; icon: typeof Bot }[] = [
  { tab: 'general', label: 'General', icon: Settings2 },
  { tab: 'memories', label: 'Memories', icon: Brain }
];

export function AISettingsModal({ data }: { data: AISettingsData }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('general');

  // Hash ↔ state subscription: covers openAISettings(), manual hash edits,
  // and the browser restoring a hash on load / navigation.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash;
      const isOpen = hash.startsWith(HASH_PREFIX);
      setOpen(isOpen);
      if (isOpen) {
        setTab(hash.includes('/memories') ? 'memories' : 'general');
      }
    };
    window.addEventListener('hashchange', sync);
    // Initial hash (deep link) — queued so it isn't a sync set in the effect.
    const frame = requestAnimationFrame(sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      cancelAnimationFrame(frame);
    };
  }, []);

  const switchTab = (next: SettingsTab) => {
    setTab(next);
    window.history.replaceState(
      null,
      '',
      next === 'memories' ? `${HASH_PREFIX}/memories` : HASH_PREFIX
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeAISettings();
      }}
    >
      {/* The shadcn DialogContent bakes in `sm:max-w-lg`; an unprefixed
          max-w-* can't beat it at the sm breakpoint, so the override must
          use the same `sm:` prefix. */}
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            AI settings
          </DialogTitle>
          <DialogDescription className="text-xs">
            Control the default model and what the assistant remembers about
            you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[85vh] min-h-140">
          {/* Mini sidebar */}
          <nav
            className="w-36 shrink-0 space-y-1 border-r bg-muted/30 p-2 sm:w-44"
            aria-label="Settings sections"
          >
            {NAV_ITEMS.map(({ tab: itemTab, label, icon: Icon }) => (
              <button
                key={itemTab}
                type="button"
                onClick={() => switchTab(itemTab)}
                aria-current={tab === itemTab ? 'page' : undefined}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  tab === itemTab
                    ? 'bg-background font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            {tab === 'general' ? (
              <GeneralTab data={data} />
            ) : (
              <MemoriesTab memories={data.memories} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
