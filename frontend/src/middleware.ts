import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { CMS_SUPPORTED_LANGS } from './config/cms';

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ['/dashboard', '/blogs', '/superadmin'];
const SYSTEM_SUBDOMAINS = new Set(['app', 'www', 'api', 'admin', 'mail', 'cdn', 'static', 'assets']);
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'smarterbloggers.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const LANG_CODES: Set<string> = new Set(CMS_SUPPORTED_LANGS.map((l) => l.code));
const CONTENT_LANG_COOKIE = 'sb_content_lang';

// Préfixe de locale applicatif (dashboard/Studio/marketing) — toutes les
// locales next-intl (routing.locales), pas seulement en/fr.
const APP_LOCALE_PATTERN = routing.locales.join('|');
const APP_LOCALE_PREFIX_RE = new RegExp(`^/(${APP_LOCALE_PATTERN})`);

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

// Cache court en mémoire process — évite d'interroger le backend à chaque
// requête de visiteur pour un état qui ne change que rarement (bascule
// manuelle par un super admin).
let _maintenanceCache: { value: boolean; checkedAt: number } | null = null;
const MAINTENANCE_CACHE_MS = 10_000;

async function isPlatformInMaintenance(): Promise<boolean> {
  if (_maintenanceCache && Date.now() - _maintenanceCache.checkedAt < MAINTENANCE_CACHE_MS) {
    return _maintenanceCache.value;
  }
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_URL}/api/v1/platform/maintenance-status`, { signal: controller.signal });
    clearTimeout(tid);
    const data = await res.json() as { maintenance?: boolean };
    const value = !!data.maintenance;
    _maintenanceCache = { value, checkedAt: Date.now() };
    return value;
  } catch {
    return _maintenanceCache?.value ?? false;
  }
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

async function getTenantLanguage(slug: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/api/v1/public/${slug}`, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) return 'en';
    const data = await res.json() as { language?: string };
    return (data.language || 'en').toLowerCase();
  } catch {
    return 'en';
  }
}

/** Retire un préfixe /{lang}/ connu en tête du pathname, s'il y en a un. */
function stripLangPrefix(pathname: string): { lang: string | null; rest: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match && LANG_CODES.has(match[1])) {
    return { lang: match[1], rest: match[2] || '/' };
  }
  return { lang: null, rest: pathname };
}

function isProtectedPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(APP_LOCALE_PREFIX_RE, '') || '/';
  return PROTECTED_PATHS.some((p) => withoutLocale.startsWith(p));
}

/** Gère le préfixe de langue + cookie persistant pour une requête déjà
 * résolue vers un tenant (sous-domaine ou domaine personnalisé). */
function rewriteWithLangHeader(request: NextRequest, url: URL, lang: string | null): NextResponse {
  const headers = new Headers(request.headers);
  if (lang) headers.set('x-blog-lang', lang);
  return NextResponse.rewrite(url, { request: { headers } });
}

async function handleBlogRewrite(request: NextRequest, slug: string, pathname: string): Promise<NextResponse> {
  const { lang, rest } = stripLangPrefix(pathname);

  if (lang) {
    // Préfixe explicite dans l'URL → sert cette langue, rafraîchit le cookie.
    const url = request.nextUrl.clone();
    url.pathname = `/blog/${slug}${rest === '/' ? '' : rest}`;
    url.searchParams.set('lang', lang);
    const res = rewriteWithLangHeader(request, url, lang);
    res.cookies.set(CONTENT_LANG_COOKIE, lang, { maxAge: 60 * 60 * 24 * 365, path: '/' });
    return res;
  }

  // Pas de préfixe — si un cookie de langue existe et diffère de la langue
  // source du tenant, redirige vers l'URL préfixée (vraie redirection,
  // pas un simple rewrite, pour que la barre d'adresse reflète la langue).
  const cookieLang = request.cookies.get(CONTENT_LANG_COOKIE)?.value;
  if (cookieLang && LANG_CODES.has(cookieLang)) {
    const tenantLang = await getTenantLanguage(slug);
    if (cookieLang !== tenantLang) {
      const url = request.nextUrl.clone();
      url.pathname = `/${cookieLang}${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/blog/${slug}${pathname === '/' ? '' : pathname}`;
  return rewriteWithLangHeader(request, url, null);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const host = hostname.split(':')[0]; // strip port

  // ── Maintenance page itself — never redirected/rewritten/locale-prefixed,
  // no dependency on any backend call, must always render regardless of host.
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // ── Platform subdomain → rewrite to /blog/[slug] ────────────────
  const blogSlug = getBlogSlug(hostname);
  if (blogSlug) {
    if (await isPlatformInMaintenance()) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
    }
    return handleBlogRewrite(request, blogSlug, pathname);
  }

  // ── Custom domain → resolve slug from DB and rewrite ────────────
  if (isCustomDomain(host)) {
    const slug = await resolveCustomDomain(host);
    // On ne vérifie la maintenance qu'une fois confirmé que ce host correspond
    // réellement à un blog tenant — sinon un domaine par défaut (Vercel, etc.)
    // qui ne resolve à aucun tenant serait pris à tort pour un blog et
    // bloquerait TOUT (y compris /login) pendant la maintenance.
    if (slug && await isPlatformInMaintenance()) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
    }
    if (slug) {
      return handleBlogRewrite(request, slug, pathname);
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

  // La langue de l'UI/du contenu marketing est désormais pilotée uniquement
  // par le préfixe de locale next-intl (/{locale}/...) — plus de mécanisme
  // ?cmsLang= séparé (voir CmsLanguageSwitcher, supprimé) : un seul choix de
  // langue s'applique partout (site public, connexion/inscription, dashboard).
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|blog-preview|blog(?:/.*)?|.*\\..*).*)'],
};
