'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, Search, Headphones } from 'lucide-react';

interface MobileBottomNavProps {
  basePath: string;
  primaryColor: string;
  /** Themes with a dark header/footer (magazine, creative) pass true for a matching dark bar. */
  dark?: boolean;
  /** Must match the theme's own desktop-nav breakpoint (each theme picked its own — sm/md/lg)
   * so the bottom nav and the desktop header never show at the same time. Default 'md'. */
  breakpoint?: 'sm' | 'md' | 'lg';
}

// Classes Tailwind écrites en toutes lettres (pas de concaténation dynamique
// de type `${breakpoint}:hidden`) pour que le scanner JIT les détecte.
const HIDDEN_ABOVE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
};

/**
 * App-style bottom tab bar, mobile only (hidden from `md:` up — desktop keeps
 * the theme's normal header nav). Shared across all 5 themes: only the color
 * (per-blog `primaryColor`) and light/dark skin vary, the 4 destinations are
 * intentionally identical everywhere for a predictable "mobile app" feel —
 * Home / Categories / Search / Listen. The hamburger "Menu" stays in each
 * theme's own app bar (opens the full vertical drawer), it is NOT duplicated
 * here — see plan discussed with the user.
 *
 * Sets `--bottom-nav-h` on <html> while mounted so the other fixed-position
 * mobile widgets (audio player, listen banner, reader-settings button) can
 * shift themselves above this bar via `bottom: var(--bottom-nav-h, 0px)`
 * instead of every theme having to know about every other fixed widget.
 */
export function MobileBottomNav({ basePath, primaryColor, dark = false, breakpoint = 'md' }: MobileBottomNavProps) {
  const pathname = usePathname() || '';

  useEffect(() => {
    document.documentElement.style.setProperty('--bottom-nav-h', '64px');
    return () => { document.documentElement.style.setProperty('--bottom-nav-h', '0px'); };
  }, []);

  const items = [
    { href: basePath || '/', icon: Home, label: 'Home', active: pathname === basePath || pathname === `${basePath}/` || pathname === '/' },
    { href: `${basePath}/categories`, icon: LayoutGrid, label: 'Categories', active: pathname.startsWith(`${basePath}/categories`) },
    { href: `${basePath}/search`, icon: Search, label: 'Search', active: pathname.startsWith(`${basePath}/search`) },
    { href: `${basePath}/podcast`, icon: Headphones, label: 'Listen', active: pathname.startsWith(`${basePath}/podcast`) },
  ];

  return (
    <nav
      className={`${HIDDEN_ABOVE[breakpoint]} fixed bottom-0 left-0 right-0 z-40 border-t flex items-stretch ${
        dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ href, icon: Icon, label, active }) => (
        <Link
          key={href}
          href={href}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
          style={{ color: active ? primaryColor : dark ? '#71717a' : '#a1a1aa' }}
        >
          <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
