'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Languages, Check, Search } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CMS_SUPPORTED_LANGS } from '@/config/cms';

const LANG_CODES: Set<string> = new Set(CMS_SUPPORTED_LANGS.map((l) => l.code));
const CONTENT_LANG_COOKIE = 'sb_content_lang';

interface Props {
  sourceLang: string;
  /** Langues activées par le tenant (fonctionnalité réservée aux plans
   * payants) — vide = pas de traduction proposée, le sélecteur ne s'affiche
   * pas du tout. */
  enabledLanguages: string[];
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
export function BlogLanguageSwitcher({ sourceLang, enabledLanguages, basePath = '', className }: Props) {
  const pathname = usePathname() || '/';
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const enabledSet = new Set(enabledLanguages.map((c) => c.toLowerCase()));
  const availableLangs = CMS_SUPPORTED_LANGS.filter(
    (l) => l.code === sourceLang.toLowerCase() || enabledSet.has(l.code)
  );

  // Pas de langue additionnelle activée (plan gratuit ou aucune activée) —
  // rien à proposer, on n'affiche même pas le sélecteur.
  if (availableLangs.length <= 1) return null;

  const filteredLangs = availableLangs.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase()) || l.code.includes(query.toLowerCase())
  );

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

  // Le préfixe /{lang}/ rafraîchit le cookie côté middleware, mais revenir à
  // la langue source ne passe par aucun préfixe — sans ça, le cookie garde
  // l'ancien choix et le middleware renvoie l'utilisateur vers celui-ci en
  // boucle. On le nettoie explicitement ici avant la navigation.
  const handleSelect = (code: string) => {
    if (code === sourceLang.toLowerCase()) {
      document.cookie = `${CONTENT_LANG_COOKIE}=; path=/; max-age=0`;
    } else {
      document.cookie = `${CONTENT_LANG_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  };

  const activeMeta = availableLangs.find((l) => l.code === active) ?? availableLangs[0];

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
      <DropdownMenuContent
        align="end"
        className="min-w-[200px] p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
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
          {filteredLangs.length === 0 && (
            <p className="px-2.5 py-2 text-sm text-muted-foreground">No match</p>
          )}
          {filteredLangs.map((l) => (
            <DropdownMenuItem key={l.code} asChild className="flex items-center gap-2.5 cursor-pointer">
              <a href={hrefFor(l.code)} onClick={() => handleSelect(l.code)}>
                <span className="text-base leading-none">{l.flag}</span>
                <span className="text-sm flex-1">{l.label}</span>
                {l.code === active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </a>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
