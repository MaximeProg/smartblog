'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Globe, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { domainsApi } from '@/lib/api';

export function DomainRequiredBanner() {
  const t = useTranslations('domains');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const blogId = params?.blogId as string | undefined;

  const { data: domains } = useQuery({
    queryKey: ['domains', blogId],
    queryFn: async () => { const { data } = await domainsApi.list(blogId!); return data; },
    enabled: !!blogId,
    staleTime: 30_000,
  });

  if (!blogId || !domains || domains.length > 0) return null;

  return (
    <div className="flex items-center gap-3 bg-blue-600 text-white px-5 py-2.5">
      <Globe className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-[13px] font-medium">{t('bannerNotVisible')}</p>
      <Link
        href={`/${locale}/blogs/${blogId}/domains`}
        className="flex items-center gap-1.5 text-[12px] font-bold bg-white text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors shrink-0"
      >
        {t('bannerAddDomain')} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
