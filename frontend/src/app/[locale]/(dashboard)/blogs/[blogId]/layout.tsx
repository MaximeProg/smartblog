'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { StudioPreviewPanel } from '@/components/dashboard/StudioPreviewPanel';
import { StudioPreviewContext } from '@/contexts/studio-preview';

export default function BlogStudioLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = params.locale as string;
  const blogId = params.blogId as string;

  const [previewPath, setPreviewPath] = useState('');
  const [blogSlug, setBlogSlug] = useState<string | undefined>(undefined);

  const setPreview = useCallback(({ path, blogSlug: slug }: { path: string; blogSlug?: string }) => {
    setPreviewPath(path);
    if (slug !== undefined) setBlogSlug(slug);
  }, []);

  const previewUrl = blogSlug
    ? `/en/template${previewPath}?preview=${blogSlug}`
    : `/en/template${previewPath}`;

  const ctx = useMemo(() => ({ setPreview }), [setPreview]);

  return (
    <StudioPreviewContext.Provider value={ctx}>
      <div className="flex h-screen overflow-hidden bg-white">
        <Sidebar locale={locale} blogId={blogId} />
        <div className="flex-1 flex overflow-hidden">
          {/* Settings panel — children fill this */}
          <main className="w-[400px] shrink-0 flex flex-col overflow-hidden border-r border-slate-100 bg-white shadow-sm z-10">
            {children}
          </main>
          {/* Persistent preview — never unmounts on studio navigation */}
          <StudioPreviewPanel previewUrl={previewUrl} />
        </div>
      </div>
    </StudioPreviewContext.Provider>
  );
}
