'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { ShareButtons } from '../shared/ShareButtons';

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

export function MinimalHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hCfg = blog.template_config?.header;

  const showSubscribe = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

  const navLinks = hCfg?.nav?.links?.length
    ? hCfg.nav.links.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [
        { label: 'About',   href: `${basePath}/about` },
        { label: 'Contact', href: `${basePath}/contact` },
      ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={basePath} className="shrink-0">
          {blog.logo_url ? (
            <Image src={blog.logo_url} alt={blog.name} width={120} height={28} className="h-7 w-auto object-contain" />
          ) : (
            <span className="font-bold text-zinc-950 text-base tracking-tight">{blog.name}</span>
          )}
        </Link>

        <div className="flex items-center gap-5">
          <nav className="hidden sm:flex items-center gap-5">
            {navLinks.map(link => (
              <Link key={link.href + link.label} href={link.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link
              href={`${basePath}/advertise`}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Advertise
            </Link>
            {showSubscribe && (
              <Link href={`${basePath}#newsletter`} className="text-sm font-medium underline hover:text-zinc-900 transition-colors" style={{ color: primaryColor }}>
                {subscribeLabel}
              </Link>
            )}
          </nav>

          <button className="sm:hidden text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setMenuOpen(m => !m)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-zinc-100 bg-white px-4 py-4 flex flex-col gap-4">
          {navLinks.map(link => (
            <Link key={link.href + link.label} href={link.href} onClick={() => setMenuOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              {link.label}
            </Link>
          ))}
          <Link
            href={`${basePath}/advertise`}
            onClick={() => setMenuOpen(false)}
            className="text-center rounded-full py-2.5 text-sm font-bold text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Advertise
          </Link>
          {showSubscribe && (
            <Link href={`${basePath}#newsletter`} onClick={() => setMenuOpen(false)} className="text-sm font-medium underline hover:text-zinc-900 transition-colors" style={{ color: primaryColor }}>
              {subscribeLabel}
            </Link>
          )}
          {categories.length > 0 && (
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Topics</p>
              <div className="flex flex-wrap gap-3">
                {categories.map(c => (
                  <Link key={c.id} href={`${basePath}/categories/${c.slug}`} onClick={() => setMenuOpen(false)} className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function MinimalFooter({ blog, basePath, primaryColor }: SharedProps) {
  const fCfg = blog.template_config?.footer;

  const description = fCfg?.description || blog.description || '';
  const showSocial = fCfg?.showSocialLinks !== false;
  const showPoweredBy = fCfg?.showPoweredBy !== false;
  const copyright = fCfg?.copyrightText || `© ${new Date().getFullYear()} ${blog.name}`;

  const navLinks = fCfg?.navLinks?.length
    ? fCfg.navLinks.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [
        { label: 'About',     href: `${basePath}/about` },
        { label: 'Contact',   href: `${basePath}/contact` },
        { label: 'Advertise', href: `${basePath}/advertise` },
      ];

  return (
    <footer className="border-t border-zinc-100 mt-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-zinc-900">{blog.name}</p>
            {description && (
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed line-clamp-2">{description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-5 text-xs text-zinc-400">
            {showSocial && Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition-colors capitalize">
                {platform}
              </a>
            ))}
            {navLinks.map(link => (
              <Link key={link.href + link.label} href={link.href} className="hover:text-zinc-900 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 mt-8 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <span>{copyright}</span>
          <div className="flex items-center gap-4 flex-wrap">
            <ShareButtons
              url={typeof window !== 'undefined' ? window.location.origin + basePath : basePath}
              title={blog.name}
              primaryColor={primaryColor}
              variant="blog"
            />
            {showPoweredBy && (
              <span>
                Powered by{' '}
                <a href="https://nexusblog.io" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: primaryColor }}>
                  NexusBlog
                </a>
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
