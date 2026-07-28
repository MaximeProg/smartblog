'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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

function rl(url: string, base: string): string {
  if (!url || url === '/') return base || '/';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

export function CreativeHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hCfg = blog.template_config?.header;

  const showSubscribe = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

  const pageLinks = hCfg?.nav?.links?.length
    ? hCfg.nav.links.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [];
  const navLinks = [
    ...pageLinks,
    ...categories.slice(0, 5).map(c => ({ label: c.name, href: `${basePath}/categories/${c.slug}` })),
  ];
  // Le tiroir mobile n'a pas besoin de "Home" — déjà dans la bottom nav.
  const drawerLinks = navLinks.filter(l => l.href !== (basePath || '/'));

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={basePath || "/"} className="flex items-center text-white font-black text-lg tracking-tight hover:opacity-80 transition-opacity">
          {blog.logo_url ? (
            <Image src={blog.logo_url} alt={blog.name} width={100} height={28} className="h-7 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          ) : (
            <>
              <span className="w-2 h-2 rounded-sm inline-block mr-2 shrink-0" style={{ backgroundColor: primaryColor }} />
              {blog.name}
            </>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.href + link.label} href={link.href}
              className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white px-3 py-1 rounded transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} className="text-zinc-500 hover:text-white hover:bg-white/10" />
          <Link href={`${basePath}?search=`} className="text-zinc-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
          <Link
            href={`${basePath}/advertise`}
            className="hidden md:inline-flex items-center rounded px-4 py-1.5 text-xs font-bold text-white hover:opacity-80 transition-opacity border border-white/20 hover:border-white/40"
            style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
          >
            Advertise
          </Link>
          {showSubscribe && (
            <Link href={`${basePath}#newsletter`} className="rounded px-4 py-2 text-xs font-black text-zinc-950 bg-white hover:opacity-90 transition-opacity">
              {subscribeLabel}
            </Link>
          )}
          <button className="md:hidden text-zinc-400 hover:text-white transition-colors p-1" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tiroir vertical mobile (menu complet) ───────────────────── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[82%] max-w-sm bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-zinc-800">
              <span className="text-white font-black text-lg tracking-tight">{blog.name}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
              {drawerLinks.map(link => (
                <Link key={link.href + link.label} href={link.href}
                  className="text-[15px] font-bold text-zinc-200 hover:text-white py-3 border-b border-zinc-800 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link
                href={`${basePath}/advertise`}
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-bold text-zinc-200 hover:text-white py-3 border-b border-zinc-800 transition-colors"
              >
                Advertise
              </Link>

              <div className="mt-5">
                <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} className="text-zinc-500 hover:text-white hover:bg-white/10" />
              </div>
            </div>

            {showSubscribe && (
              <div className="shrink-0 p-5 border-t border-zinc-800">
                <Link href={`${basePath}#newsletter`} onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center text-sm font-black text-zinc-950 bg-white rounded py-3">
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

export function CreativeFooter({ blog, categories, basePath, primaryColor }: SharedProps) {
  const fCfg = blog.template_config?.footer;
  const socialEntries = Object.entries(blog.social_links || {});

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
    <footer className="bg-zinc-950 text-zinc-400 pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href={basePath || "/"} className="text-2xl font-black text-white mb-3 block hover:opacity-80 transition-opacity">
              {blog.name}
            </Link>
            {description && <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">{description}</p>}
            {showSocial && socialEntries.length > 0 && (
              <div className="flex flex-wrap gap-5 mt-6">
                {socialEntries.map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-white transition-colors text-sm font-bold capitalize">
                    {platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {showCategories && categories.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Topics</h3>
              <ul className="space-y-2.5">
                {categories.slice(0, 6).map(cat => (
                  <li key={cat.id}>
                    <Link href={`${basePath}/categories/${cat.slug}`} className="text-sm text-zinc-500 hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Links</h3>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-600 gap-3">
          <span>{copyright}</span>
          <div className="flex items-center gap-4 flex-wrap">
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.origin + basePath : basePath}
              title={blog.name}
              primaryColor={primaryColor}
              variant="blog"
            />
            {showPoweredBy && <span>Powered by SmarterBloggers</span>}
          </div>
        </div>
      </div>
      <MobileBottomNav basePath={basePath} primaryColor={primaryColor} dark />
    </footer>
  );
}
