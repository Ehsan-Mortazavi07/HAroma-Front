import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hatefaroma_token')?.value;
  const { pathname } = request.nextUrl;

  // If user is already logged in and navigates to sign-in or sign-up, redirect to profile
  if (
    token &&
    (pathname === '/auth/sign-in' ||
      pathname === '/auth/sign-up' ||
      pathname.startsWith('/auth/sign-in/') ||
      pathname.startsWith('/auth/sign-up/'))
  ) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    if (redirectParam && !redirectParam.startsWith('/auth')) {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // If user is NOT logged in and tries to access profile, redirect to sign-in with return url
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
