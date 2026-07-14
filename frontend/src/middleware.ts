import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/blogs', '/superadmin'];
const SYSTEM_SUBDOMAINS = new Set(['app', 'www', 'api', 'admin', 'mail', 'cdn', 'static', 'assets']);
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'smarterbloggers.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getBlogSlug(hostname: string): string | null {
  // Production: football.smarterbloggers.com
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

function isCustomDomain(host: string): boolean {
  if (!host.includes('.')) return false;
  if (host === 'localhost' || host.endsWith('.localhost')) return false;
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return false;
  return true;
}

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `${API_URL}/api/v1/public/resolve-domain?hostname=${encodeURIComponent(hostname)}`,
      { signal: controller.signal },
    );
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json() as { slug: string };
    return data.slug ?? null;
  } catch {
    return null;
  }
}

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';
  return PROTECTED_PATHS.some((p) => withoutLocale.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0]; // strip port

  // ── Platform subdomain → rewrite to /blog/[slug] ────────────────
  const blogSlug = getBlogSlug(hostname);
  if (blogSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/blog/${blogSlug}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Custom domain → resolve slug from DB and rewrite ────────────
  if (isCustomDomain(host)) {
    const slug = await resolveCustomDomain(host);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/blog/${slug}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
    // Unknown custom domain — fall through (Next.js handles 404)
  }

  // ── Dashboard auth guard ─────────────────────────────────────────
  if (isProtectedPath(pathname)) {
    const hasSession =
      request.cookies.has('smarterbloggers_refresh') ||
      request.cookies.has('smarterbloggers_session');
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
  matcher: ['/((?!api|_next|_vercel|blog-preview|blog(?:/.*)?|.*\\..*).*)'],
};
