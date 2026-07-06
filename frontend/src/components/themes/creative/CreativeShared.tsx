'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

interface SharedProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
  primaryColor: string;
}

function rl(url: string, base: string): string {
  if (!url || url === '/') return base;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
}

export function CreativeHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hCfg = blog.template_config?.header;

  const showSubscribe = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

  const navLinks = hCfg?.nav?.links?.length
    ? hCfg.nav.links.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : categories.slice(0, 5).map(c => ({ label: c.name, href: `${basePath}/categories/${c.slug}` }));

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={basePath} className="flex items-center text-white font-black text-lg tracking-tight hover:opacity-80 transition-opacity">
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
          <button className="md:hidden text-zinc-400 hover:text-white transition-colors p-1" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-zinc-900 border-t border-zinc-800 px-4 py-4 flex flex-col gap-1">
          {navLinks.map(link => (
            <Link key={link.href + link.label} href={link.href}
              className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white py-2 transition-colors"
              onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link
            href={`${basePath}/advertise`}
            onClick={() => setMenuOpen(false)}
            className="mt-1 text-center text-xs font-black text-white rounded py-2.5 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Advertise
          </Link>
          {showSubscribe && (
            <Link href={`${basePath}#newsletter`} onClick={() => setMenuOpen(false)}
              className="mt-2 text-center text-xs font-black text-zinc-950 bg-white rounded py-2.5">
              {subscribeLabel}
            </Link>
          )}
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
        { label: 'Home',       href: basePath },
        { label: 'About',      href: `${basePath}/about` },
        { label: 'Contact',    href: `${basePath}/contact` },
        { label: 'Categories', href: `${basePath}/categories` },
        { label: 'Advertise',  href: `${basePath}/advertise` },
      ];

  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href={basePath} className="text-2xl font-black text-white mb-3 block hover:opacity-80 transition-opacity">
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

        <div className="border-t border-zinc-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between text-xs text-zinc-600 gap-2">
          <span>{copyright}</span>
          {showPoweredBy && <span>Powered by NexusBlog</span>}
        </div>
      </div>
    </footer>
  );
}
