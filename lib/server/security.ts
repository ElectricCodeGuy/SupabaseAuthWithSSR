import 'server-only';
import { NextResponse } from 'next/server';

// Guards shared by the cookie-authenticated API routes.

// Cross-site request forgery check. Browsers attach an Origin header to every
// cross-origin request and to same-origin fetch() POSTs, so an Origin that
// does not match the host the request arrived on cannot have come from this
// app's own pages. Requests with no Origin at all (curl, server-to-server)
// pass through — nothing attaches the session cookie to those automatically.
export function rejectCrossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return forbidden();
  }

  const hosts = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host')
  ].filter((h): h is string => !!h);

  return hosts.includes(originHost) ? null : forbidden();
}

function forbidden() {
  return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
}

// True when `path` is an object key inside the given user's storage folder.
// Every per-user object lives under `<userId>/…`; anything else — another
// user's folder, an empty name, or a traversal attempt — is rejected.
export function isOwnStoragePath(path: string, userId: string): boolean {
  return (
    path.startsWith(`${userId}/`) &&
    path.length > userId.length + 1 &&
    !path.includes('..')
  );
}
