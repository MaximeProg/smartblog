'use client';

import { PlatformSidebar } from './PlatformSidebar';
import { Header } from './Header';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PlatformShellProps {
  locale: string;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export function PlatformShell({
  locale,
  title,
  breadcrumbs,
  actions,
  children,
  noPadding = false,
}: PlatformShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <PlatformSidebar locale={locale} />

      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header
          locale={locale}
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <main className={`flex-1 mt-14 overflow-auto ${noPadding ? '' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
