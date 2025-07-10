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
  const isPublicRoute = isAuthRoute || pathname === '/';
  const isProtectedRoute = !isPublicRoute;

  if (!session && isProtectedRoute) {
    // User not logged in and trying to access protected route
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (session && (isAuthRoute || pathname === '/')) {
    // User logged in and trying to access login or root
    return NextResponse.redirect(new URL('/check-in', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|static|images).*)'], // Exclude static files & API
};
