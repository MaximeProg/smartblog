'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, ScrollText } from 'lucide-react';
import { platformApi } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { LegalSections } from '@/components/marketing/LegalSection';

const SLUG = 'legal-domain-purchase-terms';

export default function DomainPurchaseTermsPage() {
  const t = useTranslations('domainTerms');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const { data, isLoading } = useQuery({
    queryKey: ['platform-page', SLUG, locale],
    queryFn: async () => { const { data } = await platformApi.getPage(SLUG, locale); return data.content; },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('back')}
            </button>

            {isLoading || !data ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center shrink-0">
                    <ScrollText className="h-5.5 w-5.5 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-[20px] sm:text-[24px] font-black text-slate-900 dark:text-slate-100 leading-tight">
                      {data.hero.title}
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5">{data.hero.subtitle}</p>
                  </div>
                </div>
                <LegalSections sections={data.sections} />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
