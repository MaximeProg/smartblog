'use client';

import { useTranslations } from 'next-intl';
import { Construction } from 'lucide-react';

interface ComingSoonPageProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export function ComingSoonPage({ icon, title, description }: ComingSoonPageProps) {
  const t = useTranslations('comingSoon');
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-5 shadow-sm">
        {icon ?? <Construction className="h-7 w-7 text-slate-400 dark:text-zinc-500" />}
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-sm leading-relaxed">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-300 dark:text-zinc-600 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-4 py-2">
        <Construction className="h-3.5 w-3.5" />
        {t('badge')}
      </div>
    </div>
  );
}
