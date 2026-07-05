'use client';
import { useState, type FormEvent, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, Twitter, Linkedin, Github, ExternalLink, Instagram, Youtube } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nexusblog.io';

interface SharedProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
  primaryColor: string;
}

function currentIssueLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

function socialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p === 'twitter' || p === 'x') return <Twitter className="h-3.5 w-3.5" />;
  if (p === 'linkedin') return <Linkedin className="h-3.5 w-3.5" />;
  if (p === 'github') return <Github className="h-3.5 w-3.5" />;
  if (p === 'instagram') return <Instagram className="h-3.5 w-3.5" />;
  if (p === 'youtube') return <Youtube className="h-3.5 w-3.5" />;
  return <ExternalLink className="h-3.5 w-3.5" />;
}

export function LuminaryHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navCats = categories.slice(0, 6);

  return (
    <header
      className="sticky top-0 z-50 bg-[#faf8f4]/95 backdrop-blur-sm border-b border-zinc-200"
      style={{ '--cp': primaryColor } as CSSProperties}
    >
      <div className="border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          <span className="font-sans text-[10px] tracking-widest text-zinc-400 uppercase">
            Issue &bull; {currentIssueLabel()}
          </span>
          <div className="flex items-center gap-4">
            <Link
              href={`${basePath}#newsletter`}
              className="font-sans text-[10px] uppercase tracking-widest text-zinc-600 underline underline-offset-2 hover:text-zinc-900 transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href={basePath} className="flex-1 flex justify-center md:flex-none md:justify-start">
          {blog.logo_url ? (
            <div className="relative h-10 w-36">
              <Image
                src={blog.logo_url}
                alt={blog.name}
                fill
                className="object-contain object-center"
              />
            </div>
          ) : (
            <span className="font-serif italic text-3xl sm:text-4xl text-zinc-900 tracking-tight leading-none">
              {blog.name}
            </span>
          )}
        </Link>

        <div className="hidden md:flex flex-1 justify-end">
          <Link
            href={`${basePath}/about`}
            className="text-xs font-sans uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors px-3"
          >
            About
          </Link>
          <Link
            href={`${basePath}/contact`}
            className="text-xs font-sans uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors px-3"
          >
            Contact
          </Link>
        </div>

        <div className="md:hidden w-10" />
      </div>

      <div className="border-t border-b border-zinc-300 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-center gap-0">
            <Link
              href={basePath}
              className="font-sans text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2.5 border-r border-zinc-200 first:border-l"
            >
              Home
            </Link>
            {navCats.map(c => (
              <Link
                key={c.id}
                href={`${basePath}/categories/${c.slug}`}
                className="font-sans text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2.5 border-r border-zinc-200"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href={`${basePath}/categories`}
              className="font-sans text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2.5"
            >
              All Topics
            </Link>
          </nav>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#faf8f4] border-t border-zinc-200 px-4 py-6 flex flex-col gap-4">
          {[
            { label: 'Home', href: basePath },
            { label: 'About', href: `${basePath}/about` },
            { label: 'Contact', href: `${basePath}/contact` },
            { label: 'All Topics', href: `${basePath}/categories` },
          ].map(l => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="font-sans text-sm uppercase tracking-widest text-zinc-600 hover:text-zinc-900 transition-colors py-1 border-b border-zinc-100"
            >
              {l.label}
            </Link>
          ))}
          {navCats.map(c => (
            <Link
              key={c.id}
              href={`${basePath}/categories/${c.slug}`}
              onClick={() => setMobileOpen(false)}
              className="font-sans text-sm uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors py-1"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href={`${basePath}#newsletter`}
            onClick={() => setMobileOpen(false)}
            className="mt-2 text-center font-sans text-xs uppercase tracking-widest text-zinc-900 border border-zinc-900 py-3 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            Subscribe
          </Link>
        </div>
      )}
    </header>
  );
}

export function LuminaryFooter({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/v1/public/${blog.slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubStatus(res.ok ? 'ok' : 'error');
    } catch {
      setSubStatus('error');
    }
  };

  return (
    <footer className="bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
        <div className="text-center mb-16 pb-16 border-b border-zinc-800">
          <Link href={basePath}>
            <span className="font-serif italic text-4xl sm:text-5xl text-white tracking-tight">
              {blog.name}
            </span>
          </Link>
          {blog.description && (
            <p className="text-zinc-400 text-sm mt-4 max-w-md mx-auto leading-relaxed">
              {blog.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-6">
              Navigate
            </p>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: basePath },
                { label: 'About', href: `${basePath}/about` },
                { label: 'Contact', href: `${basePath}/contact` },
                { label: 'All Categories', href: `${basePath}/categories` },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-sans text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-6">
              Topics
            </p>
            <ul className="space-y-3">
              {categories.slice(0, 7).map(c => (
                <li key={c.id}>
                  <Link
                    href={`${basePath}/categories/${c.slug}`}
                    className="font-sans text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-6">
              Follow
            </p>
            {Object.keys(blog.social_links ?? {}).length > 0 ? (
              <ul className="space-y-3">
                {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 capitalize"
                    >
                      {socialIcon(platform)}
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-600">No social links configured.</p>
            )}
            <div className="mt-10">
              <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-500 mb-4">
                Newsletter
              </p>
              {subStatus === 'ok' ? (
                <p className="text-sm font-sans" style={{ color: primaryColor }}>
                  You&apos;re subscribed. Thank you.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-transparent border-0 border-b border-zinc-700 px-0 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={subStatus === 'loading'}
                    className="text-left font-sans text-xs uppercase tracking-widest disabled:opacity-60 transition-colors mt-1"
                    style={{ color: primaryColor }}
                  >
                    {subStatus === 'loading' ? 'Subscribing…' : 'Subscribe →'}
                  </button>
                  {subStatus === 'error' && (
                    <p className="text-xs text-red-400">Something went wrong.</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-600 font-sans">
          <span>
            &copy; {new Date().getFullYear()} {blog.name}. All rights reserved.
          </span>
          <span>Powered by NexusBlog</span>
        </div>
      </div>
    </footer>
  );
}
