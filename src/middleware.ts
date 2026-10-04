import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hatefaroma_token')?.value;
  const { pathname } = request.nextUrl;

  // A cookie can outlive its user (for example, after an account is deleted),
  // so only the client-side profile check may decide whether it is valid.
  // Protect direct profile visits when no session cookie exists.
  if (!token && pathname.startsWith('/profile')) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/sign-in', '/auth/sign-up', '/profile/:path*'],
};
