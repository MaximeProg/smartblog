'use client';

import { useTranslations } from 'next-intl';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { EditorialHeader, EditorialFooter } from '../editorial/EditorialShared';
import { MagazineHeader, MagazineFooter } from '../magazine/MagazineShared';
import { LuminaryHeader, LuminaryFooter } from '../luminary/LuminaryShared';
import { CreativeHeader, CreativeFooter } from '../creative/CreativeShared';
import { CorporateHeader, CorporateFooter } from '../corporate/shared';
import { AdvertiseForm } from '@/components/themes/shared/AdvertiseForm';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

const STEPS = [
  { step: '1', titleKey: 'advertiseStep1Title', descKey: 'advertiseStep1Desc' },
  { step: '2', titleKey: 'advertiseStep2Title', descKey: 'advertiseStep2Desc' },
  { step: '3', titleKey: 'advertiseStep3Title', descKey: 'advertiseStep3Desc' },
];

export default function AdvertisePage({ blog, categories, basePath }: Props) {
  const t = useTranslations('publicBlog');
  const primaryColor = blog.primary_color || '#6366f1';
  const shared = { blog, categories, basePath, primaryColor };

  let header: React.ReactNode;
  let footer: React.ReactNode;

  switch (blog.theme) {
    case 'magazine':
      header = <MagazineHeader {...shared} />;
      footer = <MagazineFooter {...shared} />;
      break;
    case 'creative':
      header = <CreativeHeader {...shared} />;
      footer = <CreativeFooter {...shared} />;
      break;
    case 'luminary':
      header = <LuminaryHeader {...shared} />;
      footer = <LuminaryFooter {...shared} />;
      break;
    case 'corporate':
      header = <CorporateHeader blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />;
      footer = <CorporateFooter blog={blog} categories={categories} primaryColor={primaryColor} basePath={basePath} />;
      break;
    default:
      header = <EditorialHeader {...shared} />;
      footer = <EditorialFooter {...shared} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {header}
      <main className="flex-1 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">

          {/* Hero */}
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-black text-white mb-8"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 24px ${primaryColor}55`,
              }}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              {t('advertiseWithUsBadge')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 leading-tight mb-4">
              {t('advertiseHeroTitlePrefix')}{' '}
              <span style={{ color: primaryColor }}>{blog.name}</span>{' '}
              {t('advertiseHeroTitleSuffix')}
            </h1>
            {blog.description && (
              <p className="text-base text-zinc-500 max-w-lg mx-auto leading-relaxed">
                {blog.description}
              </p>
            )}
          </div>

          {/* How it works */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {STEPS.map(s => (
              <div key={s.step} className="bg-white rounded-2xl border border-zinc-100 p-6 text-center shadow-sm">
                <div
                  className="h-10 w-10 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-sm font-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  {s.step}
                </div>
                <p className="text-sm font-bold text-zinc-800 mb-1.5">{t(s.titleKey)}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{t(s.descKey)}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <AdvertiseForm tenantId={blog.id} blogName={blog.name} primaryColor={primaryColor} />
        </div>
      </main>
      {footer}
    </div>
  );
}
