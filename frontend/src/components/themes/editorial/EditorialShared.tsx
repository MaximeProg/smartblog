'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, Twitter, Linkedin, Github, ExternalLink } from 'lucide-react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';

interface SharedProps {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
  primaryColor: string;
}

export function EditorialHeader({ blog, categories, basePath, primaryColor }: SharedProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navCats = categories.slice(0, 3);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href={basePath} className="shrink-0">
          {blog.logo_url ? (
            <Image
              src={blog.logo_url}
              alt={blog.name}
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="font-bold italic text-lg text-zinc-900 tracking-tight">
              {blog.name}
              <span style={{ color: primaryColor }}>.</span>
            </span>
          )}
        </Link>

        <nav className="hidden md:flex items-center">
          <Link
            href={basePath}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3"
          >
            Home
          </Link>
          <Link
            href={`${basePath}/about`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3"
          >
            About
          </Link>
          <Link
            href={`${basePath}/contact`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3"
          >
            Contact
          </Link>
          {navCats.map(c => (
            <Link
              key={c.id}
              href={`${basePath}/categories/${c.slug}`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}#newsletter`}
            className="hidden sm:inline-flex items-center rounded-full px-5 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Subscribe
          </Link>
          <button
            className="md:hidden text-zinc-500 hover:text-zinc-900 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 py-4 flex flex-col gap-1">
          {[
            { label: 'Home', href: basePath },
            { label: 'About', href: `${basePath}/about` },
            { label: 'Contact', href: `${basePath}/contact` },
          ].map(l => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors py-2"
            >
              {l.label}
            </Link>
          ))}
          {navCats.map(c => (
            <Link
              key={c.id}
              href={`${basePath}/categories/${c.slug}`}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors py-2"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href={`${basePath}#newsletter`}
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Subscribe
          </Link>
        </div>
      )}
    </header>
  );
}

export function EditorialFooter({ blog, categories, basePath, primaryColor }: SharedProps) {
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
            {blog.description && (
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed line-clamp-3">
                {blog.description}
              </p>
            )}
            {Object.keys(blog.social_links ?? {}).length > 0 && (
              <div className="flex gap-3 mt-6 flex-wrap">
                {Object.entries(blog.social_links ?? {}).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center hover:text-white hover:bg-zinc-700 transition-all"
                    title={platform}
                  >
                    {iconFor(platform)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white mb-4">Topics</p>
            <ul className="space-y-1">
              {categories.slice(0, 6).map(c => (
                <li key={c.id}>
                  <Link
                    href={`${basePath}/categories/${c.slug}`}
                    className="text-sm text-zinc-400 hover:text-white transition-colors py-1 inline-block"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-white mb-4">Navigate</p>
            <ul className="space-y-1">
              {[
                { label: 'Home', href: basePath },
                { label: 'About', href: `${basePath}/about` },
                { label: 'Contact', href: `${basePath}/contact` },
                { label: 'Categories', href: `${basePath}/categories` },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-white transition-colors py-1 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-600">
          <span>© 2026 {blog.name}. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Powered by
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="inline-block"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            NexusBlog
          </span>
        </div>
      </div>
    </footer>
  );
}
