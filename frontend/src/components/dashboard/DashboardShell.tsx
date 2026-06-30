'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardShellProps {
  locale: string;
  blogId: string;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Remove default padding from main area (use for full-bleed content) */
  noPadding?: boolean;
}

export function DashboardShell({
  locale,
  blogId,
  title,
  breadcrumbs,
  actions,
  children,
  noPadding = false,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-950">
      <Sidebar locale={locale} blogId={blogId} />

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
