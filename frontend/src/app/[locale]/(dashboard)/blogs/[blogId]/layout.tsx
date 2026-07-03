'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StudioPreviewPanel } from '@/components/dashboard/StudioPreviewPanel';
import { StudioPreviewContext } from '@/contexts/studio-preview';

export default function BlogStudioLayout({ children }: { children: React.ReactNode }) {
  const params   = useParams();
  const locale   = params.locale as string;
  const blogId   = params.blogId as string;

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
      <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
        <Sidebar locale={locale} blogId={blogId} />

        <div className="flex-1 flex overflow-hidden">
          {fullWidth ? (
            /* Article editor mode — full available width, no preview */
            <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
              {children}
            </main>
          ) : (
            /* Normal studio mode — 400px settings panel + preview */
            <>
              <main className="w-[400px] shrink-0 flex flex-col overflow-hidden border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm z-10">
                {children}
              </main>
              <StudioPreviewPanel previewUrl={previewUrl} refreshSignal={refreshSignal} />
            </>
          )}
        </div>
      </div>
    </StudioPreviewContext.Provider>
  );
}
