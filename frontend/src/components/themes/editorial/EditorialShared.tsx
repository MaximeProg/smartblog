'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Twitter, Linkedin, Github, ExternalLink } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { ShareButtons } from '../shared/ShareButtons';
import { BlogLanguageSwitcher } from '../shared/BlogLanguageSwitcher';

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

export function EditorialHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hCfg = blog.template_config?.header;

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

  const showSubscribe = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

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
          <button className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-4 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link key={l.href + l.label} href={l.href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors py-2">
              {l.label}
            </Link>
          ))}
          <Link
            href={`${basePath}/advertise`}
            onClick={() => setMobileOpen(false)}
            className="mt-1 flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-80 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Advertise
          </Link>
          {showSubscribe && (
            <Link href={`${basePath}#newsletter`} onClick={() => setMobileOpen(false)} className="mt-3 flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
              {subscribeLabel}
            </Link>
          )}
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

  const iconFor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p === 'twitter' || p === 'x') return <Twitter className="h-4 w-4" />;
    if (p === 'linkedin') return <Linkedin className="h-4 w-4" />;
    if (p === 'github') return <Github className="h-4 w-4" />;
    return <ExternalLink className="h-4 w-4" />;
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400">
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
                    {iconFor(platform)}
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
  );
}
