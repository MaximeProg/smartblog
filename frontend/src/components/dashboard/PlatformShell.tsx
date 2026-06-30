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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
      <PlatformSidebar locale={locale} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          locale={locale}
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <main className={noPadding ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1 overflow-auto p-6'}>
          {children}
        </main>
      </div>
    </div>
  );
}
