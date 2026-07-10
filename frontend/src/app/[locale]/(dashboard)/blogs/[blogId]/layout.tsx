'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StudioPreviewPanel } from '@/components/dashboard/StudioPreviewPanel';
import { StudioPreviewContext } from '@/contexts/studio-preview';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { useUIStore } from '@/store/ui.store';
import { useCurrentTenant } from '@/store/auth.store';

export default function BlogStudioLayout({ children }: { children: React.ReactNode }) {
  const params   = useParams();
  const router   = useRouter();
  const locale   = params.locale as string;
  const blogId   = params.blogId as string;
  const { openBlogSidebar } = useUIStore();
  const currentTenant = useCurrentTenant();

  const [previewPath,     setPreviewPath]     = useState('');
  const [blogSlug,        setBlogSlug]        = useState<string | undefined>(undefined);
  const [refreshSignal,   setRefreshSignal]   = useState(0);
  const [fullWidth,       setFullWidthState]  = useState(false);

  const setPreview = useCallback(({ path, blogSlug: slug }: { path: string; blogSlug?: string }) => {
    setPreviewPath(path);
    if (slug !== undefined) setBlogSlug(slug);
  }, []);

  const refresh = useCallback(() => setRefreshSignal(s => s + 1), []);
  const setFullWidth = useCallback((full: boolean) => setFullWidthState(full), []);

  const previewUrl = blogSlug
    ? `/${locale}/${blogSlug}${previewPath}`
    : `/en/template${previewPath}`;

  const ctx = useMemo(() => ({ setPreview, refresh, setFullWidth }), [setPreview, refresh, setFullWidth]);

  return (
    <StudioPreviewContext.Provider value={ctx}>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <TrialBanner />

        {/* Mobile header — visible only below lg */}
        <div className="lg:hidden flex items-center h-12 shrink-0 border-b border-slate-100 dark:border-slate-700 px-3 gap-2 bg-white dark:bg-slate-900 z-30">
          <button
            onClick={openBlogSidebar}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <span className="flex-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
            {currentTenant?.name ?? 'Blog'}
          </span>
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Dashboard
          </Link>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar locale={locale} blogId={blogId} />

          <div className="flex-1 flex overflow-hidden">
            {fullWidth ? (
              <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                {children}
              </main>
            ) : (
              <>
                {/* Settings panel: full width on mobile, 400px on desktop */}
                <main className="flex-1 lg:flex-none lg:w-[400px] shrink-0 flex flex-col overflow-hidden border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm z-10">
                  {children}
                </main>
                {/* Preview panel: hidden on mobile */}
                <div className="hidden lg:flex flex-1 overflow-hidden">
                  <StudioPreviewPanel previewUrl={previewUrl} refreshSignal={refreshSignal} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </StudioPreviewContext.Provider>
  );
}
