'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { getFetchErrorMessage } from '@/lib/utils';
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

export function MagazineHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hCfg = blog.template_config?.header;

  const showTopBar = hCfg?.topBar?.enabled !== false;
  const showDate = hCfg?.topBar?.showDate !== false;
  const showSocial = hCfg?.topBar?.showSocial !== false;
  const showSubscribeBtn = hCfg?.subscribe?.enabled !== false;
  const subscribeLabel = hCfg?.subscribe?.label || 'Subscribe';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const twitter = blog.social_links?.twitter || blog.social_links?.x || '';
  const linkedin = blog.social_links?.linkedin || '';

  // Main nav: use config links if set, else show categories
  const pageLinks = hCfg?.nav?.links?.length
    ? hCfg.nav.links.map(l => ({ label: l.label, href: rl(l.url, basePath) }))
    : [{ label: 'Home', href: basePath || '/' }];
  const navLinks = [
    ...pageLinks,
    ...categories.slice(0, 6).map(c => ({ label: c.name, href: `${basePath}/categories/${c.slug}` })),
  ];
  // Le tiroir mobile n'a pas besoin de "Home" — déjà dans la bottom nav.
  const drawerLinks = navLinks.filter(l => l.href !== (basePath || '/'));

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <header>
      {/* Top bar: date + social */}
      {showTopBar && (
        <div className="hidden sm:flex bg-zinc-950 text-zinc-400 text-[11px] px-4 sm:px-6 py-2 items-center justify-between">
          {showDate ? <span>{today}</span> : <span />}
          {showSocial && (
            <div className="flex items-center gap-4">
              {twitter && (
                <a href={twitter} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Logo + subscribe + hamburger */}
      <div className="bg-white border-b-2" style={{ borderColor: primaryColor }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href={basePath || "/"} className="shrink-0">
            {blog.logo_url ? (
              <div className="relative h-10 w-32">
                <Image src={blog.logo_url} alt={blog.name} fill className="object-contain object-left" />
              </div>
            ) : (
              <span className="text-2xl font-black tracking-tight text-zinc-950">{blog.name}</span>
            )}
          </Link>
          <div className="flex items-center gap-3">
            <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} />
            <button className="text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link
              href={`${basePath}/advertise`}
              className="hidden sm:inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Advertise
            </Link>
            {showSubscribeBtn && (
              <Link href={`${basePath}#newsletter`} className="hidden sm:inline-flex rounded px-5 py-2 text-sm font-black text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                {subscribeLabel}
              </Link>
            )}
            <button className="sm:hidden text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <nav className="bg-zinc-950 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto flex gap-0 scrollbar-none">
          {navLinks.map(link => (
            <Link key={link.href + link.label} href={link.href}
              className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-3 whitespace-nowrap transition-colors shrink-0">
              {link.label}
            </Link>
          ))}
          {!hCfg?.nav?.links?.length && (
            <Link href={`${basePath}/categories`}
              className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800 px-4 py-3 whitespace-nowrap transition-colors shrink-0 ml-auto">
              More
            </Link>
          )}
        </div>
      </nav>

      {/* ── Tiroir vertical mobile (menu complet) ───────────────────── */}
      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-[82%] max-w-sm bg-zinc-950 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-zinc-800">
              <span className="text-lg font-black tracking-tight text-white">{blog.name}</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-1">
              {drawerLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} onClick={() => setDrawerOpen(false)}
                  className="text-[15px] font-bold text-zinc-200 hover:text-white transition-colors py-3 border-b border-zinc-900">
                  {l.label}
                </Link>
              ))}
              <Link href={`${basePath}/advertise`} onClick={() => setDrawerOpen(false)}
                className="text-[15px] font-bold text-zinc-200 hover:text-white transition-colors py-3 border-b border-zinc-900">
                Advertise
              </Link>

              <div className="mt-5">
                <BlogLanguageSwitcher sourceLang={blog.language} enabledLanguages={blog.enabled_languages ?? []} basePath={basePath} />
              </div>
            </div>

            {showSubscribeBtn && (
              <div className="shrink-0 p-5 border-t border-zinc-800">
                <Link href={`${basePath}#newsletter`} onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center rounded px-5 py-3 text-sm font-black text-white hover:opacity-90 transition-opacity"
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

export function MagazineFooter({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [subError, setSubError] = useState('');
  const fCfg = blog.template_config?.footer;

  const description = fCfg?.description || blog.description || '';
  const showCategories = fCfg?.showCategories !== false;
  const showSocial = fCfg?.showSocialLinks !== false;
  const showNewsletterMini = fCfg?.showNewsletterMini !== false;
  const newsletterText = fCfg?.newsletterMiniText || `Get the best of ${blog.name} delivered weekly.`;
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

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    setSubError('');
    try {
      const res = await fetch(`/api/public-proxy/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubStatus('ok');
      } else {
        setSubError(await getFetchErrorMessage(res, 'Something went wrong. Please try again.'));
        setSubStatus('error');
      }
    } catch {
      setSubError('Something went wrong. Please try again.');
      setSubStatus('error');
    }
  };

  return (
    <footer className="border-t-4 mt-0 pb-16 sm:pb-0" style={{ borderColor: primaryColor }}>
      <div className="bg-zinc-950 text-zinc-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <p className="text-white font-bold text-xl">{blog.name}</p>
              {description && <p className="text-sm mt-2 text-zinc-400 leading-relaxed">{description}</p>}
              {showSocial && Object.keys(blog.social_links ?? {}).length > 0 && (
                <div className="flex gap-4 mt-5">
                  {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors capitalize text-xs font-semibold">
                      {platform}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {showCategories && categories.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Topics</p>
                <ul className="space-y-2">
                  {categories.slice(0, 8).map(c => (
                    <li key={c.id}>
                      <Link href={`${basePath}/categories/${c.slug}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Pages</p>
              <ul className="space-y-2">
                {navLinks.map(link => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {showNewsletterMini && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Newsletter</p>
                <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{newsletterText}</p>
                {subStatus === 'ok' ? (
                  <p className="text-sm font-bold" style={{ color: primaryColor }}>You&apos;re subscribed!</p>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500" />
                    <button type="submit" disabled={subStatus === 'loading'}
                      className="w-full rounded py-2 text-sm font-black text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                      style={{ backgroundColor: primaryColor }}>
                      {subStatus === 'loading' ? '…' : 'Subscribe'}
                    </button>
                    {subStatus === 'error' && <p className="text-xs text-red-400">{subError}</p>}
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-600">
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
                  <a href="https://smarterbloggers.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>
                    SmarterBloggers
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav basePath={basePath} primaryColor={primaryColor} dark breakpoint="sm" />
    </footer>
  );
}
