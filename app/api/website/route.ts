// app/api/website/route.ts
//
// ⚠️ SECURITY WARNING — this route is GENERALLY UNSAFE and is NOT recommended.
//
// It fetches an ARBITRARY, caller-supplied URL on the server and returns that
// page's HTML to be rendered in an iframe under OUR domain. If this endpoint is
// discovered/abused, someone can point it at any URL — including a malware/
// phishing page — and that "random" content then gets fetched and served from
// our own server domain/origin (a server-side request forgery / open-proxy
// abuse vector). Treat everything fetched here as untrusted, and be aware that
// running this in production is generally a bad idea.
//
// It is also TECHNICALLY SPOOFING: below we set the Referer and Origin headers
// to the target website's own host, which is not actually true — the request
// originates from our server, not from that site. We're effectively lying about
// where the request comes from to get past sites that gate content on those
// headers.
//
// Requiring an authenticated session below only limits WHO can trigger this; it
// does NOT make fetching arbitrary URLs safe.

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/server/supabase';

export async function GET(request: NextRequest) {
  try {
    // Only allow logged-in users. Without a session this is disallowed.
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'An account is required for this action' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Extract base URL
    const baseUrl = new URL(url).origin;

    const response = await fetch(url, {
      headers: {
        // NOTE: spoofed — see the warning at the top of this file.
        Referer: baseUrl,
        Origin: baseUrl,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const content = await response.text();

    // Inject base tag to handle relative URLs
    const modifiedContent = content.replace(
      '<head>',
      `<head><base href="${baseUrl}/">`
    );

    return new NextResponse(modifiedContent, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Preview proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    );
  }
}
