// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/auth');
  const isRoot = pathname === '/';

  if (!session && !isAuthRoute) {
    // Not logged in → redirect to login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (session && (isAuthRoute || isRoot)) {
    // Already logged in → redirect to app
    return NextResponse.redirect(new URL('/check-in', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)'],
};
