import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/blogs', '/onboarding'];
const SYSTEM_SUBDOMAINS = new Set(['app', 'www', 'api', 'admin', 'mail', 'cdn', 'static', 'assets']);
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'nexusblog.io';

function getBlogSlug(hostname: string): string | null {
  // Production: football.nexusblog.io
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, -(ROOT_DOMAIN.length + 1));
    if (!SYSTEM_SUBDOMAINS.has(sub) && !sub.includes('.')) return sub;
  }

  // Local dev: football.localhost:3000 or football.localhost
  if (hostname.includes('.localhost')) {
    const sub = hostname.split('.')[0];
    if (!SYSTEM_SUBDOMAINS.has(sub) && sub) return sub;
  }

  return null;
}

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';
  return PROTECTED_PATHS.some((p) => withoutLocale.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ── Public blog subdomain → rewrite to /blog/[slug] ────────────
  const blogSlug = getBlogSlug(hostname);
  if (blogSlug) {
    const url = request.nextUrl.clone();
    // /             → /blog/football
    // /some-article → /blog/football/some-article
    url.pathname = `/blog/${blogSlug}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Dashboard auth guard ────────────────────────────────────────
  if (isProtectedPath(pathname)) {
    const hasSession =
      request.cookies.has('nexusblog_refresh') ||
      request.cookies.has('nexusblog_session');
    if (!hasSession) {
      const locale = pathname.split('/')[1] || 'en';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude static assets, Next internals, API routes, and the blog/preview paths
  // (blog-preview is a dev-only preview page; blog/* is handled by subdomain rewrite)
  matcher: ['/((?!api|_next|_vercel|blog-preview|blog(?:/.*)?|.*\\..*).*)'],
};
