import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Initialize Supabase client and handle session
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Get user session
  const { data } = await supabase.auth.getClaims();
  const session = data?.claims || null;

  // Handle route-specific redirects
  const currentRoute = request.nextUrl.pathname;
  if (currentRoute.startsWith('/protected') && !session) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = '/signin';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
// Matcher to exclude certain paths from middleware
export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|favicons/.*\\.png|manifest.webmanifest|manifest.json|api/.*|fonts/.*|sitemap.xml|robots.txt|manifest.json|manifest.webmanifest|\\.well-known/.*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' }
      ]
    }
  ]
};
