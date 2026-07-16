'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CMS_SUPPORTED_LANGS } from '@/config/cms';

const LANG_CODES: Set<string> = new Set(CMS_SUPPORTED_LANGS.map((l) => l.code));

interface Props {
  sourceLang: string;
  /** Non-empty only on the next-intl dev/preview route, where the URL has a
   * fixed depth (no room for a /{lang}/ segment) — falls back to ?lang=.
   * Empty (default) on the real blog domain/subdomain route. */
  basePath?: string;
  className?: string;
}

/**
 * Sélecteur de langue site-wide du blog public — un seul composant pour
 * toutes les pages (accueil, à propos, contact, catégories, article, ...).
 * Dérive entièrement la langue active du pathname courant : pas besoin de
 * prop-driller `lang` à travers chaque page/thème.
 */
export function BlogLanguageSwitcher({ sourceLang, basePath = '', className }: Props) {
  const pathname = usePathname() || '/';
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const withoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname;

  const langMatch = withoutBase.match(/^\/([a-z]{2})(\/.*)?$/);
  const hasKnownPrefix = !!(langMatch && LANG_CODES.has(langMatch[1]));
  const active = hasKnownPrefix ? langMatch![1] : sourceLang.toLowerCase();
  const restPath = hasKnownPrefix ? (langMatch![2] || '/') : withoutBase;

  const hrefFor = (code: string) => {
    const target = code === sourceLang.toLowerCase()
      ? restPath
      : `/${code}${restPath === '/' ? '' : restPath}`;
    return basePath ? `${basePath}${target}${target.includes('?') ? '&' : '?'}lang=${code}` : target;
  };

  const activeMeta = CMS_SUPPORTED_LANGS.find((l) => l.code === active) ?? CMS_SUPPORTED_LANGS[0];

  const triggerClass = `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 ${className ?? ''}`;

  if (!mounted) {
    return (
      <div className={triggerClass} aria-hidden>
        <Languages className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{activeMeta.code}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass}>
        <Languages className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{activeMeta.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {CMS_SUPPORTED_LANGS.map((l) => (
          <DropdownMenuItem key={l.code} asChild className="flex items-center gap-2.5 cursor-pointer">
            <a href={hrefFor(l.code)}>
              <span className="text-base leading-none">{l.flag}</span>
              <span className="text-sm flex-1">{l.label}</span>
              {l.code === active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
