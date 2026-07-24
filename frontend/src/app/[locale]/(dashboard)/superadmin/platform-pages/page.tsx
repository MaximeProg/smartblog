'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { superadminApi } from '@/lib/api';

const PAGE_LABEL_KEYS: Record<string, string> = {
  home: 'pageLabel_home',
  about: 'pageLabel_about',
  contact: 'pageLabel_contact',
  careers: 'pageLabel_careers',
  press: 'pageLabel_press',
  changelog: 'pageLabel_changelog',
  status: 'pageLabel_status',
  'legal-privacy': 'pageLabel_legalPrivacy',
  'legal-terms': 'pageLabel_legalTerms',
  'legal-cookies': 'pageLabel_legalCookies',
  'legal-security': 'pageLabel_legalSecurity',
  'legal-data-deletion': 'pageLabel_legalDataDeletion',
  docs: 'pageLabel_docs',
  'docs-api': 'pageLabel_docsApi',
  guides: 'pageLabel_guides',
  'advertise-with-us': 'pageLabel_advertiseWithUs',
};

export default function PlatformPagesListPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('superAdmin.platformPages');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-platform-pages'],
    queryFn: () => superadminApi.listPlatformPages().then((r) => r.data),
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>
              {t('cmsLabel')}
            </span>
          </div>
          <h1 className="text-[22px] font-black" style={{ color: 'var(--sa-text)' }}>{t('title')}</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(data?.pages ?? []).map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/superadmin/platform-pages/${p.slug}`}
              className="flex items-center justify-between rounded-xl border px-5 py-4 hover:bg-[var(--sa-surface)] transition-colors"
              style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}
            >
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--sa-text)' }}>
                  {PAGE_LABEL_KEYS[p.slug] ? t(PAGE_LABEL_KEYS[p.slug] as any) : p.slug}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
                  {p.updated_at ? t('modifiedOn', { date: new Date(p.updated_at).toLocaleString(locale) }) : t('neverModified')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
