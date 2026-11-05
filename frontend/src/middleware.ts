import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SESSION_MARKER_COOKIE = 'ravinto_session';

/**
 * UX-level guard for protected pages.
 *
 * Real authorization is always enforced by the API. This middleware only
 * avoids flashing protected layouts for visitors without a session. It is
 * skipped when the frontend and the API do not share a hostname, because the
 * session cookie is host-scoped and would not be visible here.
 */
export function middleware(request: NextRequest) {
  // Compare the public Host header (what the browser used) instead of
  // nextUrl.hostname: in standalone deployments the latter may reflect the
  // bind address (HOSTNAME=0.0.0.0) rather than the requested host.
  const requestHost = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  let apiHost = '';
  try {
    apiHost = new URL(API_URL).hostname.toLowerCase();
  } catch {
    apiHost = '';
  }

  const sameHost = Boolean(requestHost && apiHost && requestHost === apiHost);
  if (!sameHost) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_MARKER_COOKIE)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/add-meal/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/workout/:path*',
    '/onboarding/:path*',
  ],
};
