'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PenLine, Sun, Moon, Menu, X } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface PublicNavProps {
  locale: string;
  transparent?: boolean;
}

export function PublicNav({ locale, transparent = false }: PublicNavProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isFr = locale === 'fr';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const navLinks = [
    { href: `/${locale}`, label: isFr ? 'Accueil' : 'Home', exact: true },
    { href: `/${locale}/blog`, label: isFr ? 'Blogs' : 'Blogs', exact: false },
    { href: `/${locale}#features`, label: isFr ? 'Fonctionnalités' : 'Features', anchor: true },
    { href: `/${locale}#pricing`, label: isFr ? 'Tarifs' : 'Pricing', anchor: true },
    { href: `/${locale}/about`, label: isFr ? 'À propos' : 'About', exact: false },
  ];

  const isTransparent = transparent && !scrolled && !menuOpen;

  const navBase = cn(
    'fixed top-0 inset-x-0 z-50 h-16 transition-all duration-300',
    isTransparent
      ? 'bg-transparent border-b border-transparent'
      : 'bg-slate-900/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-slate-800 dark:border-slate-800 shadow-lg shadow-black/20'
  );

  const linkBase = 'px-3 py-2 text-sm font-medium rounded-md transition-colors';
  const linkActive = 'text-blue-400';
  const linkDefault = 'text-slate-300 hover:text-white hover:bg-white/5';

  const iconBtn = 'h-9 w-9 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors';

  return (
    <>
      <nav className={navBase}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <PenLine className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-white tracking-widest uppercase text-sm">
              NexusBlog
            </span>
          </Link>

          {/* Center nav — desktop only */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(({ href, label, exact, anchor }) => {
              const isActive = anchor ? false : exact ? pathname === href : pathname.startsWith(href);
              return (
                <a key={href + label} href={href} className={cn(linkBase, isActive ? linkActive : linkDefault)}>
                  {label}
                </a>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Search — hidden on smallest screens to save space */}
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" className={cn(iconBtn, 'hidden sm:flex')}>
              <Search className="h-4 w-4" />
            </button>

            {/* Language switcher */}
            <LanguageSwitcher
              locale={locale}
              align="end"
              className="text-slate-400 hover:text-white hover:bg-white/10 border-transparent"
            />

            {/* Theme toggle */}
            <button onClick={toggle} aria-label="Toggle theme" className={iconBtn}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Sign in — hidden on mobile (in mobile menu instead) */}
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <Link
                href={`/${locale}/login`}
                className="px-3 sm:px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-blue-500/30"
              >
                {isFr ? 'Connexion' : 'Sign In'}
              </Link>
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className={cn(iconBtn, 'lg:hidden ml-1')}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 shadow-2xl">
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder={isFr ? 'Rechercher des articles...' : 'Search articles...'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />

          {/* Drawer */}
          <div className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-2xl">
            <div className="px-4 py-6 space-y-1">
              {navLinks.map(({ href, label, exact, anchor }) => {
                const isActive = anchor ? false : exact ? pathname === href : pathname.startsWith(href);
                return (
                  <a
                    key={href + label}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600/10 text-blue-400'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {label}
                  </a>
                );
              })}

              {/* Search on mobile */}
              <div className="pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={isFr ? 'Rechercher...' : 'Search...'}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="pt-2">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-bold transition-all shadow-lg shadow-blue-600/20"
                >
                  {isFr ? 'Se connecter' : 'Sign In'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
