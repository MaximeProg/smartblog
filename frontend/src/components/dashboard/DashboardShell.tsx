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
    <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Sidebar locale={locale} blogId={blogId} />

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
