'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Clock, ShieldAlert, ShieldX } from 'lucide-react';

const STATUS_CONFIG: Record<string, { icon: typeof ShieldCheck; color: string; bg: string; border: string }> = {
  not_started: { icon: ShieldCheck, color: 'text-blue-600',   bg: 'bg-blue-500',   border: 'border-blue-200 dark:border-blue-800' },
  pending:     { icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-500',  border: 'border-amber-200 dark:border-amber-800' },
  expired:     { icon: ShieldAlert, color: 'text-amber-600',  bg: 'bg-amber-500',  border: 'border-amber-200 dark:border-amber-800' },
  rejected:    { icon: ShieldX,     color: 'text-red-600',    bg: 'bg-red-500',    border: 'border-red-200 dark:border-red-800' },
};

export function KycRequiredGate({ kycStatus }: { kycStatus?: string }) {
  const t = useTranslations('kyc');
  const params = useParams();
  const locale = params.locale as string;

  const status = kycStatus && STATUS_CONFIG[kycStatus] ? kycStatus : 'not_started';
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border ${cfg.border} shadow-sm p-8 text-center`}>
        <div className={`h-14 w-14 rounded-2xl ${cfg.bg} flex items-center justify-center mx-auto mb-5`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-[18px] font-black text-slate-900 dark:text-slate-100 mb-2">
          {t(`gate.${status}.title`)}
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          {t(`gate.${status}.description`)}
        </p>
        <Link
          href={`/${locale}/kyc`}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors"
        >
          {t(`gate.${status}.cta`)}
        </Link>
      </div>
    </div>
  );
}
