import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const config = {
  matcher: ['/:path*', '/api/:path*']
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
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
          // Setting the cookie to HTTP only.
          const httpOnlyOptions = { ...options, httpOnly: true };
          request.cookies.set({ name, value, ...httpOnlyOptions });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value, ...httpOnlyOptions });
        },
        remove(name: string, options: CookieOptions) {
          const httpOnlyOptions = { ...options, httpOnly: true };
          request.cookies.set({ name, value: '', ...httpOnlyOptions });
          response = NextResponse.next({
            request: { headers: request.headers }
          });
          response.cookies.set({ name, value: '', ...httpOnlyOptions });
        }
      }
    }
  );

  await supabase.auth.getSession();

  return response;
}
