'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  locale: string;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

export function Header({ locale, title, breadcrumbs, actions }: HeaderProps) {
  const showBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header className="fixed top-0 right-0 left-[260px] z-20 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 dark:bg-zinc-900/95 dark:border-zinc-800 backdrop-blur px-5 gap-4">

      {/* Left: breadcrumbs OR title */}
      <div className="flex items-center gap-1.5 min-w-0">
        {showBreadcrumbs ? (
          <>
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />}
                  {isLast ? (
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href ?? '#'}
                      className="text-sm text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </>
        ) : title ? (
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</h1>
        ) : null}
      </div>

      {/* Right: custom actions + language switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
