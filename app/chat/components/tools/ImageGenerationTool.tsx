// Inline chat rendering for a tool-generateImage part.
//  - while the prompt streams / the server renders: a placeholder at the
//    requested aspect ratio, so the message doesn't jump when the image lands
//  - done: the stored WebP from /api/images/[id], with open + download
//  - failed / aborted: a compact red card
import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  ImageIcon,
  Loader2,
  XCircle
} from 'lucide-react';
import type { ToolUIPart } from 'ai';
import type { UITools } from '@/app/chat/types/tooltypes';
import { Button } from '@/components/ui/button';

type ImagePart = Extract<ToolUIPart<UITools>, { type: 'tool-generateImage' }>;

interface ImageGenerationToolProps {
  toolInvocation: ImagePart;
  /** Part is frozen in an input state from an aborted generation. */
  aborted?: boolean;
}

// "16:9" → [16, 9]; anything unparsable falls back to square.
function parseRatio(ratio: string | undefined): [number, number] {
  const [w, h] = (ratio ?? '1:1').split(':').map(Number);
  return w && h ? [w, h] : [1, 1];
}

// Portrait images get a narrower column so a 9:16 image doesn't grow taller
// than the viewport at full message width.
function widthClass(w: number, h: number): string {
  return h > w ? 'max-w-xs' : 'max-w-md';
}

// Checkerboard behind transparent images so the alpha channel is visible.
const CHECKERBOARD =
  'repeating-conic-gradient(rgba(128,128,128,0.18) 0% 25%, transparent 0% 50%) 50% / 20px 20px';

export const ImageGenerationTool: React.FC<ImageGenerationToolProps> = ({
  toolInvocation,
  aborted = false
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const input = toolInvocation.input;
  const output =
    toolInvocation.state === 'output-available'
      ? (toolInvocation.output as
          | {
              imageId?: string;
              url?: string;
              width?: number;
              height?: number;
              transparent?: boolean;
              error?: string;
            }
          | undefined)
      : undefined;

  const streaming =
    !aborted &&
    (toolInvocation.state === 'input-streaming' ||
      toolInvocation.state === 'input-available');
  const failed =
    aborted ||
    loadFailed ||
    toolInvocation.state === 'output-error' ||
    (toolInvocation.state === 'output-available' && !output?.url);

  const prompt = input?.prompt ?? '';
  const [ratioW, ratioH] = parseRatio(input?.aspectRatio);

  if (failed) {
    return (
      <div className="my-1 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 shadow-sm dark:border-red-800 dark:bg-red-900/20">
        <XCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {prompt || 'Image generation'}
          </p>
          <p className="text-xs text-muted-foreground">
            {aborted
              ? 'Stopped — the image was not generated'
              : loadFailed
                ? 'The image could not be loaded'
                : 'Could not generate the image'}
          </p>
        </div>
      </div>
    );
  }

  if (streaming || !output?.url) {
    return (
      <div
        className={`my-2 flex w-full ${widthClass(ratioW, ratioH)} flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 p-4 text-center`}
        style={{ aspectRatio: `${ratioW} / ${ratioH}` }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Generating image…
        </p>
        {prompt && (
          <p className="line-clamp-3 max-w-sm text-xs text-muted-foreground/80">
            {prompt}
          </p>
        )}
      </div>
    );
  }

  return (
    <figure
      className={`my-2 w-full ${widthClass(output.width ?? ratioW, output.height ?? ratioH)} overflow-hidden rounded-lg border border-border shadow-sm`}
    >
      <a
        href={output.url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open full size"
        className="block"
        style={output.transparent ? { background: CHECKERBOARD } : undefined}
      >
        {/* Plain <img>: the route is cookie-authenticated and already serves
            a size-capped WebP, so next/image optimisation adds nothing. */}
        <img
          src={output.url}
          alt={prompt}
          width={output.width}
          height={output.height}
          loading="lazy"
          className="h-auto w-full"
          onError={() => setLoadFailed(true)}
        />
      </a>
      <figcaption className="flex items-center gap-2 border-t border-border/60 bg-muted/40 px-3 py-1.5">
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p
          className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
          title={prompt}
        >
          {prompt}
        </p>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 rounded-md px-2 text-xs text-muted-foreground"
        >
          <a href={output.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="sr-only">Open full size</span>
          </a>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-6 shrink-0 rounded-md px-2 text-xs text-muted-foreground"
        >
          <a href={output.url} download={`image-${output.imageId}.webp`}>
            <Download className="h-3.5 w-3.5" />
            <span className="sr-only">Download</span>
          </a>
        </Button>
      </figcaption>
    </figure>
  );
};
