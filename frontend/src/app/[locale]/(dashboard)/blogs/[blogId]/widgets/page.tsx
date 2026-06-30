'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ComingSoonPage } from '@/components/dashboard/ComingSoonPage';

export default function WidgetsPage() {
  const params = useParams();
  const t = useTranslations('comingSoon.widgets');
  const tNav = useTranslations('blogNav');
  return (
    <DashboardShell locale={params.locale as string} blogId={params.blogId as string} breadcrumbs={[{ label: tNav('widgets') }]}>
      <ComingSoonPage
        icon={<LayoutGrid className="h-7 w-7 text-slate-400 dark:text-zinc-500" />}
        title={t('title')}
        description={t('description')}
      />
    </DashboardShell>
  );
}
