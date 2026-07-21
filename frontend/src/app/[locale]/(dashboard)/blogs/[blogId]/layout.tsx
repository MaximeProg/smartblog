'use client';

import { useCallback, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { StructurePanel } from './_studio/StructurePanel';
import { PropertiesPanel } from './_studio/PropertiesPanel';
import { StudioPreviewContext } from '@/contexts/studio-preview';
import { TrialBanner } from '@/components/dashboard/TrialBanner';
import { DomainRequiredBanner } from '@/components/dashboard/DomainRequiredBanner';
import { useUIStore } from '@/store/ui.store';
import { useCurrentTenant } from '@/store/auth.store';
import { useEditorStore } from '@/store/editor.store';

export default function BlogStudioLayout({ children }: { children: React.ReactNode }) {
  const params   = useParams();
  const pathname = usePathname();
  const locale   = params.locale as string;
  const blogId   = params.blogId as string;
  const t = useTranslations('dashboardPage');

  const { openBlogSidebar } = useUIStore();
  const currentTenant = useCurrentTenant();
  const { selectedSectionId } = useEditorStore();

  const isStudioRoot = pathname === `/${locale}/blogs/${blogId}`;
  const showRightPanel = isStudioRoot && Boolean(selectedSectionId);

  // Keep StudioPreviewContext alive as no-op so existing settings pages don't crash
  const ctx = useMemo(() => ({
    setPreview: () => {},
    refresh:    () => {},
    setFullWidth: () => {},
  }), []);

  return (
    <StudioPreviewContext.Provider value={ctx}>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <TrialBanner />
        <DomainRequiredBanner />

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-11 shrink-0 border-b border-slate-100 dark:border-slate-700 px-3 gap-2 bg-white dark:bg-slate-900 z-30">
          <button
            onClick={openBlogSidebar}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="flex-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
            {currentTenant?.name ?? t('blogCardStudio')}
          </span>
        </div>

        {/* Main 3-panel area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — StructurePanel */}
          <StructurePanel />

          {/* Center — page content or canvas */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>

          {/* Right — PropertiesPanel (conditional) */}
          {showRightPanel && <PropertiesPanel />}
        </div>
      </div>
    </StudioPreviewContext.Provider>
  );
}
