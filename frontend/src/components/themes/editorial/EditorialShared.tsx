'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, Twitter, Linkedin, Github, ExternalLink } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { ShareButtons } from '../shared/ShareButtons';
import { BlogLanguageSwitcher } from '../shared/BlogLanguageSwitcher';
import { MobileBottomNav } from '../shared/MobileBottomNav';

interface SharedProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
  primaryColor: string;
}

// Resolve blog-relative URLs (e.g. "/about" → "/en/myblog/about")
function rl(url: string, base: string): string {
  if (!url || url === '/') return base || '/';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

function iconForPlatform(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'twitter' || p === 'x') return <Twitter className="h-4 w-4" />;
  if (p === 'linkedin') return <Linkedin className="h-4 w-4" />;
  if (p === 'github') return <Github className="h-4 w-4" />;
  return <ExternalLink className="h-4 w-4" />;
}

export function EditorialHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hCfg = blog.template_config?.header;
  // Le footer desktop est masqué sur mobile (voir EditorialFooter) — son
  // contenu (réseaux, copyright, powered-by) est repris ici dans le tiroir.
  const fCfg = blog.template_config?.footer;
  const showSocial = fCfg?.showSocialLinks !== false;
  const showPoweredBy = fCfg?.showPoweredBy !== false;
  const copyright = fCfg?.copyrightText || `© ${new Date().getFullYear()} ${blog.name}. All rights reserved.`;
  const socialEntries = Object.entries(blog.social_links ?? {}).filter(([, u]) => !!u);

  const pageLinks = hCfg?.nav?.links?.length
    ? hCfg.nav.links.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [
        { label: 'Home',    href: basePath || '/' },
        { label: 'About',   href: `${basePath}/about` },
        { label: 'Contact', href: `${basePath}/contact` },
      ];
  const navLinks = [
    ...pageLinks,
    ...categories.slice(0, 4).map(c => ({ label: c.name, href: `${basePath}/categories/${c.slug}` })),
  ];
  // Le tiroir mobile n'a pas besoin de "Home" — déjà dans la bottom nav.
  const drawerLinks = navLinks.filter(l => l.href !== (basePath || '/'));

  const showSubscribe = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={basePath || "/"} className="shrink-0">
          {blog.logo_url ? (
            <Image src={blog.logo_url} alt={blog.name} width={120} height={32} className="h-8 w-auto object-contain" />
          ) : (
            <span className="font-bold italic text-lg text-zinc-900 tracking-tight">
              {blog.name}<span style={{ color: primaryColor }}>.</span>
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center">
          {navLinks.map(link => (
            <Link key={link.href + link.label} href={link.href} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} />
          <Link
            href={`${basePath}/advertise`}
            className="hidden md:inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Advertise
          </Link>
          {showSubscribe && (
            <Link
              href={`${basePath}#newsletter`}
              className="hidden sm:inline-flex items-center rounded-full px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              {subscribeLabel}
            </Link>
          )}
          <button className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Tiroir vertical mobile (menu complet) ───────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[82%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-zinc-100">
              <span className="font-bold italic text-lg text-zinc-900">{blog.name}<span style={{ color: primaryColor }}>.</span></span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
              {drawerLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} onClick={() => setDrawerOpen(false)}
                  className="text-[15px] font-semibold text-zinc-800 hover:text-zinc-950 transition-colors py-3 border-b border-zinc-50">
                  {l.label}
                </Link>
              ))}
              <Link href={`${basePath}/advertise`} onClick={() => setDrawerOpen(false)}
                className="text-[15px] font-semibold text-zinc-800 hover:text-zinc-950 transition-colors py-3 border-b border-zinc-50">
                Advertise
              </Link>

              <div className="mt-5">
                <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} />
              </div>

              {/* Contenu du footer, repris ici car le footer desktop est masqué sur mobile */}
              {showSocial && socialEntries.length > 0 && (
                <div className="flex gap-2 mt-6 flex-wrap">
                  {socialEntries.map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-all" title={platform}>
                      {iconForPlatform(platform)}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-6 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400 space-y-1">
                <p>{copyright}</p>
                {showPoweredBy && (
                  <p>
                    Powered by{' '}
                    <a href="https://smarterbloggers.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>
                      SmarterBloggers
                    </a>
                  </p>
                )}
              </div>
            </div>

            {showSubscribe && (
              <div className="shrink-0 p-5 border-t border-zinc-100">
                <Link href={`${basePath}#newsletter`} onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}>
                  {subscribeLabel}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function EditorialFooter({ blog, categories, basePath, primaryColor }: SharedProps) {
  const fCfg = blog.template_config?.footer;

  const description = fCfg?.description || blog.description || '';
  const showCategories = fCfg?.showCategories !== false;
  const showSocial = fCfg?.showSocialLinks !== false;
  const showPoweredBy = fCfg?.showPoweredBy !== false;
  const copyright = fCfg?.copyrightText || `© ${new Date().getFullYear()} ${blog.name}. All rights reserved.`;

  const navLinks = fCfg?.navLinks?.length
    ? fCfg.navLinks.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [
        { label: 'Home',       href: basePath || '/' },
        { label: 'About',      href: `${basePath}/about` },
        { label: 'Contact',    href: `${basePath}/contact` },
        { label: 'Categories', href: `${basePath}/categories` },
        { label: 'Advertise',  href: `${basePath}/advertise` },
      ];

  return (
    <>
    <footer className="hidden md:block bg-zinc-950 text-zinc-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-white font-bold text-xl">{blog.name}</p>
            {description && <p className="text-zinc-400 text-sm mt-2 leading-relaxed line-clamp-3">{description}</p>}
            {showSocial && Object.keys(blog.social_links ?? {}).length > 0 && (
              <div className="flex gap-3 mt-6 flex-wrap">
                {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center hover:text-white hover:bg-zinc-700 transition-all" title={platform}>
                    {iconForPlatform(platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {showCategories && categories.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-white mb-4">Topics</p>
              <ul className="space-y-1">
                {categories.slice(0, 6).map(c => (
                  <li key={c.id}>
                    <Link href={`${basePath}/categories/${c.slug}`} className="text-sm text-zinc-400 hover:text-white transition-colors py-1 inline-block">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white mb-4">Navigate</p>
            <ul className="space-y-1">
              {navLinks.map(link => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors py-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-600">
          <span>{copyright}</span>
          <div className="flex items-center gap-4 flex-wrap">
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.origin + basePath : basePath}
              title={blog.name}
              primaryColor={primaryColor}
              variant="blog"
            />
            {showPoweredBy && (
              <span className="flex items-center gap-1.5">
                Powered by{' '}
                <a href="https://smarterbloggers.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>
                  SmarterBloggers
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
    <MobileBottomNav basePath={basePath} primaryColor={primaryColor} />
    </>
  );
}
