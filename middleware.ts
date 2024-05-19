import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  await supabase.auth.getUser();

  /* // If there's no session and the user is trying to access /protected, redirect them to /auth. Changed to be handle in the server component.
  if (!session && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }*/

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
