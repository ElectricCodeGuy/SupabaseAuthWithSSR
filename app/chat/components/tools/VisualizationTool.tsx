// Inline chat rendering for an HTML-visualization version
// (tool-createVisualization / tool-updateVisualization part).
//  - display "inline": the sandboxed iframe renders directly in the message,
//    with a small header row and an "Open in panel" affordance.
//  - display "panel": a compact status card like the document workspace —
//    the visualization itself lives in the side panel.
// While the HTML is still streaming, both modes show a progress card; the
// iframe only mounts on the finished document (re-setting srcDoc per token
// would reload the frame constantly).
import React, { useState } from 'react';
import {
  ChartNoAxesGantt,
  Loader2,
  CheckCircle,
  XCircle,
  PanelRight,
  TriangleAlert
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/chat/types/tooltypes';
import { Button } from '@/components/ui/button';
import { HtmlFrame } from '../HtmlFrame';

type VisualizationPart = Extract<
  ToolUIPart<UITools>,
  { type: 'tool-createVisualization' } | { type: 'tool-updateVisualization' }
>;

interface VisualizationToolProps {
  toolInvocation: VisualizationPart;
  /** Toggler: the parent opens the panel — or closes it when isOpen. */
  onOpen: () => void;
  /** Part is frozen in an input state from an aborted generation. */
  aborted?: boolean;
  /** This visualization is the one currently shown in the side panel. */
  isOpen?: boolean;
  /**
   * False when a newer version of this visualization exists further down
   * the transcript — superseded inline versions collapse to a compact card
   * instead of keeping a live iframe (and its running JS) alive forever.
   */
  isLatestVersion?: boolean;
  /**
   * Error bridge: called with the captured runtime error and the
   * visualization title when the user clicks "Fix it".
   */
  onFixError?: (errorText: string, title: string) => void;
}

const DEFAULT_INLINE_HEIGHT = 420;

export const VisualizationTool: React.FC<VisualizationToolProps> = ({
  toolInvocation,
  onOpen,
  aborted = false,
  isOpen = false,
  isLatestVersion = true,
  onFixError
}) => {
  // First runtime error reported by the sandboxed frame — kept, not
  // replaced, so the banner shows the ORIGINAL failure, not follow-ups.
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const isCreate = toolInvocation.type === 'tool-createVisualization';
  const input = toolInvocation.input;
  const output = toolInvocation.output as
    | {
        visualizationId?: string;
        version?: number;
        title?: string;
        display?: string;
        height?: number | null;
        error?: string;
      }
    | undefined;

  const failed =
    aborted ||
    toolInvocation.state === 'output-error' ||
    (toolInvocation.state === 'output-available' && !output?.visualizationId);
  const streaming =
    !aborted &&
    (toolInvocation.state === 'input-streaming' ||
      toolInvocation.state === 'input-available');

  const title = output?.title || input?.title || 'Visualization';
  const display = output?.display || input?.display;
  const html = input?.html ?? '';

  if (failed) {
    return (
      <div className="my-1 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 shadow-sm dark:border-red-800 dark:bg-red-900/20">
        <XCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {aborted
              ? 'Stopped — the visualization was not finished'
              : isCreate
                ? 'Could not create the visualization'
                : 'Could not update the visualization'}
          </p>
        </div>
      </div>
    );
  }

  // Finished inline visualization — render the sandboxed frame in the chat.
  // Only the group's LATEST version gets a live iframe; superseded versions
  // fall through to the compact card below.
  if (!streaming && display === 'inline' && html && isLatestVersion) {
    const height = output?.height ?? input?.height ?? DEFAULT_INLINE_HEIGHT;
    return (
      <div className="my-2 overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-1.5">
          <ChartNoAxesGantt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium">{title}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-6 gap-1 rounded-md px-2 text-xs ${
              isOpen ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={onOpen}
            title={isOpen ? 'Close the side panel' : 'Open in the side panel'}
          >
            <PanelRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isOpen ? 'Close panel' : 'Open in panel'}
            </span>
          </Button>
        </div>
        <HtmlFrame
          html={html}
          title={title}
          height={height}
          onRuntimeError={(message) =>
            setRuntimeError((prev) => prev ?? message)
          }
        />
        {runtimeError && (
          <div className="flex items-center gap-2 border-t border-border/60 bg-amber-50 px-3 py-1.5 dark:bg-amber-950/30">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p
              className="min-w-0 flex-1 truncate text-xs text-amber-800 dark:text-amber-200"
              title={runtimeError}
            >
              The visualization reported an error
            </p>
            {onFixError && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 shrink-0 rounded-md px-2 text-xs"
                onClick={() => onFixError(runtimeError, title)}
              >
                Fix it
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Streaming (both modes), finished panel visualization, or a superseded
  // inline version — status card.
  const superseded = !streaming && display === 'inline' && !isLatestVersion;
  const statusText = streaming
    ? isCreate
      ? 'Building visualization…'
      : 'Updating visualization…'
    : superseded
      ? 'Older version — replaced by a newer one below'
      : isCreate
        ? 'Visualization created'
        : `Updated to version ${output?.version ?? ''}`.trimEnd();

  return (
    <div
      className={`my-1 flex items-center gap-3 rounded-lg border px-3 py-2 shadow-sm ${
        isOpen
          ? 'border-primary/50 bg-[rgba(240,249,255,0.7)] ring-1 ring-primary/30 dark:border-blue-500/50 dark:bg-blue-950/40 dark:ring-blue-500/30'
          : 'border-[rgba(0,127,255,0.1)] bg-[rgba(240,249,255,0.7)] dark:border-blue-800/30 dark:bg-blue-950/40'
      }`}
    >
      {streaming ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
      ) : isOpen ? (
        <PanelRight className="h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
      ) : (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500 dark:text-green-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <ChartNoAxesGantt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {isOpen && !streaming ? `${statusText} · open in the panel` : statusText}
        </p>
      </div>
      {/* The button renders in ALL status-card states — also while the HTML
          streams: closing the panel mid-generation leaves this as the only
          way to open it again before completion. */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 rounded-md"
        onClick={onOpen}
      >
        {isOpen ? 'Close' : 'Open'}
      </Button>
    </div>
  );
};
