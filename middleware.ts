import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Initialize Supabase client and handle session
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const {
    data: { user: session }
  } = await supabase.auth.getUser();

  // Handle route-specific redirects
  const currentRoute = request.nextUrl.pathname;
  if (currentRoute.startsWith('/protected') && !session) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = '/auth/signin';
    return NextResponse.redirect(redirectUrl);
  }

  if (currentRoute.startsWith('/aichat') && !session) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = '/auth/signin';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     * - fonts
     * - sitemap.xml
     * - robots.txt
     * - manifest.json
     * - .well-known (for SSL certificates and other well-known paths)
     * - .css, .js, .json (static assets)
     * - .md, .mdx (markdown files)
     * - .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx (document files)
     * - .zip, .tar, .gz, .rar (archive files)
     * - .mp3, .wav, .ogg, .flac (audio files)
     * - .mp4, .avi, .mov, .wmv, .flv (video files)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|md|mdx|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|tar|gz|rar|mp3|wav|ogg|flac|mp4|avi|mov|wmv|flv)$|api/.*|fonts/.*|sitemap.xml|robots.txt|manifest.json|\\.well-known/.*).*)'
  ]
};
