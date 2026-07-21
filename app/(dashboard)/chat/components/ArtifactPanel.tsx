'use client';

// The document workspace surface ("artifact panel"), modeled on the artifact
// chrome in vercel/ai-chatbot (close on the left, title + status line, icon
// actions right, version bar at the bottom).
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
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MemoizedMarkdown from './tools/MemoizedMarkdown';
import type { ArtifactGroup } from '@/app/(dashboard)/chat/lib/artifacts';

interface ArtifactPanelProps {
  artifact: ArtifactGroup | null;
  // null = follow the latest version (live during streaming).
  versionIndex: number | null;
  onVersionChange: (index: number | null) => void;
  onClose: () => void;
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

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({
  artifact,
  versionIndex,
  onVersionChange,
  onClose
}) => {
  const open = artifact !== null;

  // Keep the last artifact rendered while the panel slides shut.
  // "Adjust state during render" pattern — the set is guarded, so React
  // immediately re-renders with the stored value and never loops.
  const [lastArtifact, setLastArtifact] = useState<ArtifactGroup | null>(null);
  if (artifact && artifact !== lastArtifact) setLastArtifact(artifact);
  const shown = artifact ?? lastArtifact;

  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadMarkdown = () => {
    if (!shown || !active) return;
    const blob = new Blob([active.content], {
      type: 'text/markdown;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugifyFilename(shown.title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusText = active?.streaming
    ? 'Writing…'
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
                title="Close the document panel"
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
                  title="Copy markdown"
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
                  onClick={handleDownloadMarkdown}
                  title="Download as markdown (.md)"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document body */}
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
