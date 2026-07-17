'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Languages, Check, Search } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { CMS_SUPPORTED_LANGS } from '@/config/cms';

interface Props {
  currentLang: string;
  className?: string;
}

/**
 * Sélecteur de langue pour le CONTENU CMS des pages marketing pilotes
 * (Home/About/Contact) — distinct du LanguageSwitcher (en/fr, next-intl/URL).
 * Écrit ?cmsLang=xx dans l'URL courante ; le Server Component lit ce param
 * et refetch getPlatformPage(slug, cmsLang) en conséquence.
 */
export function CmsLanguageSwitcher({ currentLang, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const switchLang = (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('cmsLang', code);
    router.push(`${pathname}?${params.toString()}`);
  };

  const active = CMS_SUPPORTED_LANGS.find((l) => l.code === currentLang) ?? CMS_SUPPORTED_LANGS[0];

  const filtered = CMS_SUPPORTED_LANGS.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase()) || l.code.includes(query.toLowerCase())
  );

  const triggerClass = cn(
    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none',
    'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border',
    className,
  );

  if (!mounted) {
    return (
      <div className={triggerClass} aria-hidden>
        <Languages className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{active.code}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass}>
        <Languages className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{active.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[200px] p-0"
        onCloseAutoFocus={() => setQuery('')}
      >
        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">No match</p>
          )}
          {filtered.map((l) => (
            <DropdownMenuItem
              key={l.code}
              onClick={() => switchLang(l.code)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="text-sm flex-1">{l.label}</span>
              {l.code === currentLang && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
