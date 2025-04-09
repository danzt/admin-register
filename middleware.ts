import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('session_id');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  if (!sessionId && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
};