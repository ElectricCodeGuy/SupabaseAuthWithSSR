'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  type LucideIcon,
  Brain,
  ChartColumn,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Files,
  Globe,
  Loader2,
  PanelRight,
  Paperclip,
  Plus,
  Send,
  Sparkles
} from 'lucide-react';

// A scripted replay of one real turn in the chat: the question is typed into
// the input box and sent, the assistant reasons, calls searchUserDocument,
// websiteSearchTool, createVisualization and createArtifact, answers, then handles a
// follow-up with updateArtifact and saveMemory. The artifact panel slides
// open and "writes itself" as the tool calls land, the same way the live
// panel streams the tool input. Timings are in ms from the start of a run;
// the whole thing loops.

type DocBlock =
  | { t: 'h1' | 'h2' | 'p' | 'li'; text: string }
  | { t: 'bars'; rows: { label: string; width: number; color: string }[] };

type Step =
  | { kind: 'user'; at: number; text: string }
  // A message being typed into the input box, before it is "sent".
  | { kind: 'typing'; at: number; text: string }
  | { kind: 'reasoning'; at: number; text: string }
  | {
      kind: 'tool';
      at: number;
      icon: LucideIcon;
      label: string;
      summary: string;
      doc?: DocBlock[];
    }
  | { kind: 'chart'; at: number }
  | { kind: 'answer'; at: number; body: ReactNode; cite?: string; usage: string };

const STEPS: Step[] = [
  {
    kind: 'typing',
    at: 0,
    text: 'Compare the churn in my Q3 report against this year’s SaaS benchmarks, then write it up as a document I can share.'
  },
  {
    kind: 'user',
    at: 2400,
    text: 'Compare the churn in my Q3 report against this year’s SaaS benchmarks, then write it up as a document I can share.'
  },
  {
    kind: 'reasoning',
    at: 3300,
    text: 'The Q3 report is already in the user’s documents, so search there first for the churn figure, then pull public benchmarks for context — and only draft the document once both numbers are in hand.'
  },
  {
    kind: 'tool',
    at: 4500,
    icon: Files,
    label: 'Searched documents',
    summary: '2 matches'
  },
  {
    kind: 'tool',
    at: 5800,
    icon: Globe,
    label: 'Web search',
    summary: '5 sources'
  },
  {
    kind: 'tool',
    at: 7100,
    icon: ChartColumn,
    label: 'Created visualization',
    summary: '3 series'
  },
  { kind: 'chart', at: 7900 },
  {
    kind: 'tool',
    at: 9000,
    icon: PanelRight,
    label: 'Created artifact',
    summary: 'version 1',
    doc: [
      { t: 'h1', text: 'Q3 Churn Analysis' },
      {
        t: 'p',
        text: 'Quarterly customer churn came in at 3.1%, a 40 basis point improvement over Q2 and roughly a third below the SMB SaaS median of 4.6%.'
      },
      { t: 'h2', text: 'Benchmark comparison' },
      {
        t: 'bars',
        rows: [
          { label: 'Yours', width: 34, color: 'var(--chart-1)' },
          { label: 'Median', width: 72, color: 'var(--chart-2)' },
          { label: 'Top quartile', width: 24, color: 'var(--chart-3)' }
        ]
      }
    ]
  },
  {
    kind: 'answer',
    at: 11000,
    body: (
      <>
        Your Q3 churn of <strong>3.1%</strong> sits well under the ~4.6% SMB
        SaaS median. The full comparison is in the artifact panel.
      </>
    ),
    cite: 'q3-report.pdf · page 12',
    usage: '4 steps · 12,840 tokens · 91% served from cache'
  },
  {
    kind: 'typing',
    at: 12000,
    text: 'Add what drove it — and remember that our churn target is 3%.'
  },
  {
    kind: 'user',
    at: 13600,
    text: 'Add what drove it — and remember that our churn target is 3%.'
  },
  {
    kind: 'tool',
    at: 14800,
    icon: PanelRight,
    label: 'Updated artifact',
    summary: 'version 2',
    doc: [
      { t: 'h2', text: 'What moved the number' },
      {
        t: 'li',
        text: 'Annual plans absorbed 62% of at-risk renewals after the September pricing change.'
      },
      {
        t: 'li',
        text: 'Support response time fell to 4.2 hours — the strongest quarter on record.'
      }
    ]
  },
  {
    kind: 'tool',
    at: 16400,
    icon: Brain,
    label: 'Saved memory',
    summary: '1 memory'
  },
  {
    kind: 'answer',
    at: 17600,
    body: (
      <>
        Added a <em>What moved the number</em> section — that’s version 2 in
        the panel. I’ll keep the 3% target in mind in future chats.
      </>
    ),
    usage: '2 steps · 3,120 tokens · 96% served from cache'
  }
];

// Pause on the finished conversation before the replay starts over.
const LOOP_AT = 25500;

// The panel types the document out. A bars block has no text, so it counts as
// a fixed number of "characters" to give it a beat of its own.
const BARS_LEN = 30;
const CHARS_PER_TICK = 3;
const TICK_MS = 24;

const blockLength = (block: DocBlock) =>
  block.t === 'bars' ? BARS_LEN : block.text.length;

const TOTAL_VERSIONS = STEPS.filter(
  (step) => step.kind === 'tool' && step.doc
).length;

// Every document block that has been revealed so far, with its starting
// offset in the typed stream.
function docBlocks(visible: number) {
  const out: { block: DocBlock; start: number }[] = [];
  let offset = 0;
  for (const step of STEPS.slice(0, visible)) {
    if (step.kind !== 'tool' || !step.doc) continue;
    for (const block of step.doc) {
      out.push({ block, start: offset });
      offset += blockLength(block);
    }
  }
  return { blocks: out, length: offset };
}

const DOC_TOTAL = docBlocks(STEPS.length).length;

// ── Chat side ────────────────────────────────────────────────────────────────

const ENTER = 'animate-in fade-in slide-in-from-bottom-1 duration-300';

function ToolRow({
  step,
  done
}: {
  step: Extract<Step, { kind: 'tool' }>;
  done: boolean;
}) {
  const Icon = step.icon;
  return (
    <div
      className={`${ENTER} flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2`}
    >
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="grow truncate text-sm text-muted-foreground">
        {step.label}
      </span>
      {done ? (
        <>
          <span className="shrink-0 text-xs text-muted-foreground/70">
            {step.summary}
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500 dark:text-green-400" />
        </>
      ) : (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

function ChartCard() {
  return (
    <div
      className={`${ENTER} w-fit rounded-lg border bg-background px-3 py-2.5`}
    >
      <p className="text-[11px] font-medium text-muted-foreground">
        Churn vs. benchmark
      </p>
      <div
        className="mt-2 flex h-16 items-end gap-3"
        role="img"
        aria-label="Bar chart comparing churn: yours 3.1%, median 4.6%, top quartile 2.2%"
      >
        {[
          ['Yours', 45, 'var(--chart-1)'],
          ['Median', 68, 'var(--chart-2)'],
          ['Top 25%', 32, 'var(--chart-3)']
        ].map(([label, height, color]) => (
          <div
            key={label as string}
            className="flex h-full flex-col items-center justify-end gap-1"
          >
            <div
              className="w-10 rounded-t-[4px]"
              style={{
                height: `${height}%`,
                backgroundColor: color as string
              }}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepView({
  step,
  index,
  visible
}: {
  step: Step;
  index: number;
  visible: number;
}) {
  switch (step.kind) {
    case 'user':
      return (
        <div
          className={`${ENTER} ml-auto w-fit max-w-[88%] rounded-lg bg-primary/10 px-3 py-2 text-sm`}
        >
          {step.text}
        </div>
      );
    case 'typing':
      // Rendered by the input box, not in the message list.
      return null;
    case 'reasoning':
      return (
        <div className={`${ENTER} overflow-hidden rounded-lg border bg-background/40`}>
          <div className="flex items-center gap-2 px-3 py-2">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground/80">
              Reasoning
            </span>
          </div>
          <p className="border-t border-border/40 bg-muted/50 px-3 py-2.5 text-xs leading-relaxed text-foreground/80">
            {step.text}
          </p>
        </div>
      );
    case 'tool':
      return <ToolRow step={step} done={visible > index + 1} />;
    case 'chart':
      return <ChartCard />;
    case 'answer':
      return (
        <div className={`${ENTER} space-y-2`}>
          <div className="w-fit max-w-[92%] rounded-lg border bg-background px-3 py-2.5 text-sm leading-relaxed">
            <p>{step.body}</p>
            {step.cite && (
              <span className="mt-2 flex w-fit items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                <FileText className="h-3 w-3 text-primary" />
                <span>{step.cite}</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            <ChartColumn className="h-3 w-3" />
            <span>{step.usage}</span>
          </div>
        </div>
      );
  }
}

// The message box at the bottom of the chat — the same shape as the real
// ChatMessageInput (text area, attach/new buttons, send).
// `sending` is the beat between the draft finishing and the message
// appearing: the send button is shown pressed.
function ChatInput({ draft, sending }: { draft: string; sending: boolean }) {
  const iconBox =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-background';
  return (
    <div className="shrink-0 px-4 pb-4 sm:px-6">
      <div className="rounded-2xl border bg-background shadow-sm">
        <div className="min-h-11 px-4 pt-3 pb-1 text-sm">
          {draft ? (
            <span>
              <span>{draft}</span>
              <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-primary align-middle" />
            </span>
          ) : (
            <span className="text-muted-foreground">Type your message...</span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 pb-3">
          <span className={iconBox}>
            <Paperclip className="h-4 w-4 text-primary" />
          </span>
          <span className={iconBox}>
            <Plus className="h-4 w-4 text-primary" />
          </span>
          <span
            className={`${iconBox} ml-auto ${
              sending ? 'scale-90 border-primary bg-primary' : ''
            }`}
          >
            <Send
              className={`h-4 w-4 ${sending ? 'text-primary-foreground' : 'text-primary'}`}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Artifact side ────────────────────────────────────────────────────────────

function DocBlockView({
  block,
  shown,
  active
}: {
  block: DocBlock;
  shown: number;
  active: boolean;
}) {
  if (block.t === 'bars') {
    return (
      <div className={`${ENTER} space-y-1.5`}>
        {block.rows.map(({ label, width, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-[10px] text-muted-foreground">
              {label}
            </span>
            <span
              className="h-2 rounded-full"
              style={{ width: `${width}%`, backgroundColor: color }}
            />
          </div>
        ))}
      </div>
    );
  }

  const text = block.text.slice(0, shown);
  const caret = active && (
    <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-primary align-middle" />
  );

  switch (block.t) {
    case 'h1':
      return (
        <p className="text-base font-semibold">
          <span>{text}</span>
          {caret}
        </p>
      );
    case 'h2':
      return (
        <p className="pt-1 text-xs font-medium">
          <span>{text}</span>
          {caret}
        </p>
      );
    case 'li':
      return (
        <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
          <span className="text-primary">—</span>
          <span>
            <span>{text}</span>
            {caret}
          </span>
        </p>
      );
    default:
      return (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span>{text}</span>
          {caret}
        </p>
      );
  }
}

// ── Player ───────────────────────────────────────────────────────────────────

export default function ChatDemo() {
  // Step 0 (typing the opening question) is the resting state; everything
  // after it plays once the demo scrolls into view.
  const [visible, setVisible] = useState(1);
  const [typed, setTyped] = useState(0);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          // No replay — show the finished conversation.
          setVisible(STEPS.length);
          setTyped(DOC_TOTAL);
        } else {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // One run of the script, then a reset and the next run.
  useEffect(() => {
    if (!started) return;
    const timers = STEPS.slice(1).map((step, i) =>
      setTimeout(() => setVisible(i + 2), step.at)
    );
    const loop = setTimeout(() => {
      setVisible(1);
      setTyped(0);
      setRun((value) => value + 1);
    }, LOOP_AT);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loop);
    };
  }, [started, run]);

  // Typewriter for the artifact panel.
  const { blocks, length: target } = docBlocks(visible);
  useEffect(() => {
    if (typed >= target) return;
    const t = setTimeout(
      () => setTyped((value) => Math.min(value + CHARS_PER_TICK, target)),
      TICK_MS
    );
    return () => clearTimeout(t);
  }, [typed, target]);

  // Typewriter for the input box: only while the newest step is a 'typing'
  // step; it empties again the moment the message is "sent".
  const lastStep = STEPS[visible - 1];
  const draftTarget =
    started && lastStep?.kind === 'typing' ? lastStep.text : '';
  const [draftTyped, setDraftTyped] = useState(0);
  useEffect(() => {
    if (draftTyped === draftTarget.length) return;
    const reset = draftTyped > draftTarget.length;
    const t = setTimeout(
      () =>
        setDraftTyped((value) =>
          reset ? 0 : Math.min(value + 2, draftTarget.length)
        ),
      reset ? 0 : 35
    );
    return () => clearTimeout(t);
  }, [draftTyped, draftTarget]);

  // Follow the newest content in both panes.
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, [visible]);
  useEffect(() => {
    const doc = docRef.current;
    if (doc) doc.scrollTop = doc.scrollHeight;
  }, [typed]);

  const versions = STEPS.slice(0, visible).filter(
    (step) => step.kind === 'tool' && step.doc
  ).length;
  const streaming = typed < target;
  const panelOpen = versions > 0;

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-2xl border bg-card shadow-xl"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b bg-muted/30 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-3/50" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          Q3 report review
        </span>
        <span className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Live demo
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            Sonnet 5
          </span>
        </span>
      </div>

      {/* Desktop: the artifact panel is an in-flow sibling whose width animates
          0 ↔ 45% and pushes the chat aside — the same behaviour as the real
          ArtifactPanel. On mobile it expands below the chat instead. It opens
          the moment the createArtifact tool call lands. */}
      <div className="flex flex-col lg:flex-row">
        {/* Chat pane: scrolling message list + the input box */}
        <div className="flex h-[420px] min-w-0 flex-1 flex-col sm:h-[500px]">
          <div
            ref={chatRef}
            className="flex-1 space-y-3 overflow-y-auto scroll-smooth p-4 sm:p-6"
            style={{ scrollbarWidth: 'thin' }}
          >
            {STEPS.slice(0, visible).map((step, index) => (
              <StepView
                key={`${run}-${index}`}
                step={step}
                index={index}
                visible={visible}
              />
            ))}
          </div>
          <ChatInput
            draft={draftTarget.slice(0, draftTyped)}
            sending={draftTarget.length > 0 && draftTyped >= draftTarget.length}
          />
        </div>

        {/* Artifact pane — closed until the first artifact version exists */}
        <div
          className={`flex shrink-0 flex-col overflow-hidden bg-muted/20 transition-all duration-500 ease-out motion-reduce:transition-none ${
            panelOpen
              ? 'h-[320px] border-t lg:h-auto lg:w-[45%] lg:border-l lg:border-t-0'
              : 'h-0 lg:h-auto lg:w-0'
          }`}
          aria-hidden={!panelOpen}
        >
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="grow truncate text-sm font-medium">
              Q3 Churn Analysis
            </span>
            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>

          <div
            ref={docRef}
            className="grow space-y-3 overflow-y-auto px-4 py-4 text-sm"
            style={{ scrollbarWidth: 'thin' }}
          >
            {blocks
              .filter(({ start }) => typed > start)
              .map(({ block, start }, i, shownBlocks) => (
                <DocBlockView
                  key={`${run}-${start}`}
                  block={block}
                  shown={typed - start}
                  active={streaming && i === shownBlocks.length - 1}
                />
              ))}
          </div>

          {/* Version bar — the control the real panel puts at its bottom */}
          <div className="flex h-10 items-center gap-2 border-t px-4">
            {versions > 0 && (
              <>
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium tabular-nums">
                  {`${versions} / ${TOTAL_VERSIONS}`}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                {streaming ? (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Streaming live
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500 dark:text-green-400" />
                    <span>Saved</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
