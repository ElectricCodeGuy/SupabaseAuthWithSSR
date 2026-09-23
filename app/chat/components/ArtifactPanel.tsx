'use client';

// The workspace surface ("artifact panel") for documents AND HTML
// visualizations, modeled on the artifact chrome in vercel/ai-chatbot (close
// on the left, title + status line, icon actions right, version bar at the
// bottom).
//
// Layout has two modes:
//  - lg and up: an IN-FLOW flex sibling of the conversation column that
//    animates its width (0 ↔ 45%), so the chat is pushed left rather than
//    covered.
//  - below lg: a fixed slide-over anchored below the global header
//    (top-12 = 48px) with a backdrop.
//
// The component stays mounted with `artifact === null` so the close
// animation can play; the last shown artifact is kept for that exit render.

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  Loader2,
  History,
  TriangleAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemoizedMarkdown from './tools/MemoizedMarkdown';
import { HtmlFrame } from './HtmlFrame';
import type { ArtifactGroup } from '@/app/chat/lib/artifacts';

interface ArtifactPanelProps {
  artifact: ArtifactGroup | null;
  // null = follow the latest version (live during streaming).
  versionIndex: number | null;
  onVersionChange: (index: number | null) => void;
  onClose: () => void;
  /**
   * Error bridge for HTML visualizations: called with the captured runtime
   * error and the visualization title when the user clicks "Fix it".
   */
  onFixVisualization?: (errorText: string, title: string) => void;
}

function slugifyFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'document'
  );
}

// Building animation shown while a visualization's HTML streams in — a
// pulsing mock chart with staggered bars plus a live size counter, so the
// user sees progress without ever seeing raw HTML source.
const BUILD_BARS = [45, 75, 55, 90, 40, 65, 80];

const VisualizationBuilding: React.FC<{ chars: number }> = ({ chars }) => (
  <div className="flex w-full max-w-sm flex-col items-center gap-6 px-6">
    <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-5">
      <div className="mb-1.5 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mb-5 h-2.5 w-1/3 animate-pulse rounded bg-muted/70" />
      <div className="flex h-28 items-end gap-2" aria-hidden>
        {BUILD_BARS.map((height, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t-sm bg-primary/25"
            style={{ height: `${height}%`, animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-2.5 w-14 animate-pulse rounded bg-muted/70" />
        <div className="h-2.5 w-10 animate-pulse rounded bg-muted/70" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-muted/70" />
      </div>
    </div>
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Building visualization…</span>
      {chars > 0 && (
        <span className="text-xs tabular-nums">
          {(chars / 1024).toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })}{' '}
          kB
        </span>
      )}
    </p>
  </div>
);

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  versionIndex,
  onVersionChange,
  onClose,
  onFixVisualization
}) => {
  const open = artifact !== null;

  // Keep the last artifact rendered while the panel slides shut.
  // "Adjust state during render" pattern — the set is guarded, so React
  // immediately re-renders with the stored value and never loops.
  const [lastArtifact, setLastArtifact] = useState<ArtifactGroup | null>(null);
  if (artifact && artifact !== lastArtifact) setLastArtifact(artifact);
  const shown = artifact ?? lastArtifact;

  const [copied, setCopied] = useState(false);
  // Runtime error from the sandboxed frame, keyed to the version that
  // produced it — a stale error never sticks to a newer/other version.
  const [frameError, setFrameError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // HTML visualizations share the panel with markdown documents: the body
  // renders a sandboxed iframe instead of markdown and downloads are .html.
  const isHtml = shown?.kind === 'html';

  const versions = shown?.versions ?? [];
  const latestIndex = versions.length - 1;
  const activeIndex =
    versionIndex === null
      ? latestIndex
      : Math.min(Math.max(versionIndex, 0), latestIndex);
  const active = versions[activeIndex];
  const isLatest = activeIndex === latestIndex;

  // Follow the text while it streams in (only when viewing the live version).
  useEffect(() => {
    if (active?.streaming && isLatest && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.content, active?.streaming, isLatest]);

  const handleCopy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Could not copy document:', error);
    }
  };

  const handleDownloadSource = () => {
    if (!shown || !active) return;
    const blob = new Blob([active.content], {
      type: isHtml ? 'text/html;charset=utf-8' : 'text/markdown;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugifyFilename(shown.title)}.${isHtml ? 'html' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusText = active?.streaming
    ? isHtml
      ? 'Building…'
      : 'Writing…'
    : versions.length > 0
      ? `Version ${activeIndex + 1} of ${versions.length}`
      : '';

  return (
    <>
      {/* Backdrop below the global header — mobile slide-over only */}
      <div
        className={`fixed inset-x-0 bottom-0 top-12 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/*
        Mobile: fixed slide-over below the header (translate animation).
        Desktop (lg+): in-flow sibling that pushes the chat (width animation).
      */}
      <aside
        className={`fixed bottom-0 right-0 top-12 z-50 w-full transform-gpu transition-transform duration-300 ease-in-out sm:w-[560px] ${
          open ? 'translate-x-0' : 'translate-x-full'
        } lg:static lg:z-auto lg:h-full lg:transform-none lg:overflow-hidden lg:transition-[width] ${
          open ? 'lg:w-[45%]' : 'lg:w-0'
        }`}
        aria-hidden={!open}
      >
        {shown && active && (
          <div className="flex h-full w-full flex-col border-l border-border bg-background">
            {/* Header — close left, title + status, actions right */}
            <div className="flex items-center gap-2 border-b border-border/60 px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onClose}
                title="Close the panel"
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold leading-tight">
                  {shown.title}
                </h2>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {active.streaming && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>{statusText}</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopy}
                  title={isHtml ? 'Copy HTML' : 'Copy markdown'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDownloadSource}
                  title={
                    isHtml
                      ? 'Download as HTML (.html)'
                      : 'Download as markdown (.md)'
                  }
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body — finished HTML renders the sandboxed frame full-height
                (the frame scrolls itself); a streaming visualization shows a
                building animation (never the raw HTML source — the iframe
                only mounts on the finished document, since re-setting srcDoc
                per token would reload it constantly); markdown documents use
                the scroll container. */}
            {isHtml ? (
              active.content && !active.streaming ? (
                <div className="flex flex-1 flex-col overflow-hidden">
                  {frameError?.key === active.key && (
                    <div className="flex items-center gap-2 border-b border-border/60 bg-amber-50 px-3 py-1.5 dark:bg-amber-950/30">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p
                        className="min-w-0 flex-1 truncate text-xs text-amber-800 dark:text-amber-200"
                        title={frameError.message}
                      >
                        The visualization reported an error
                      </p>
                      {onFixVisualization && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 shrink-0 rounded-md px-2 text-xs"
                          onClick={() =>
                            onFixVisualization(frameError.message, shown.title)
                          }
                        >
                          Fix it
                        </Button>
                      )}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <HtmlFrame
                      html={active.content}
                      title={shown.title}
                      className="h-full"
                      onRuntimeError={(message) =>
                        setFrameError((prev) =>
                          prev && prev.key === active.key
                            ? prev
                            : { key: active.key, message }
                        )
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center overflow-hidden">
                  <VisualizationBuilding chars={active.content.length} />
                </div>
              )
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[700px] px-5 py-6 lg:px-8">
                  {active.content ? (
                    <>
                      <MemoizedMarkdown
                        content={active.content}
                        id={`artifact-${shown.id}-v${activeIndex}`}
                      />
                      {active.streaming && (
                        <span className="mt-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-foreground/60" />
                      )}
                    </>
                  ) : (
                    // First tokens not in yet — skeleton lines
                    <div className="space-y-3 pt-2" aria-hidden>
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Version bar — ai-chatbot style footer, only with history */}
            {versions.length > 1 && (
              <div
                className={`flex items-center gap-1 border-t border-border/60 px-2 py-1.5 ${
                  isLatest ? '' : 'bg-muted/50'
                }`}
              >
                <History className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={activeIndex === 0}
                  onClick={() => onVersionChange(activeIndex - 1)}
                  title="Previous version"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {`${activeIndex + 1} / ${versions.length}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isLatest}
                  onClick={() => onVersionChange(activeIndex + 1)}
                  title="Next version"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {!isLatest && (
                  <>
                    <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                      Viewing an older version
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto h-7 rounded-md px-2.5 text-xs"
                      onClick={() => onVersionChange(null)}
                    >
                      Back to latest
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
