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
  const isProtectedRoute = !pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.startsWith('/favicon.ico');

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }

  return res;
}

// Only run middleware for these routes:
export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
