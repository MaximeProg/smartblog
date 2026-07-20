'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { authApi } from '@/lib/api';

interface VerifyEmailFormProps {
  locale: string;
  oobCode: string | null;
}

export function VerifyEmailForm({ locale, oobCode }: VerifyEmailFormProps) {
  const t = useTranslations('auth.verifyEmail');
  const [status, setStatus] = useState<'verifying' | 'success' | 'invalid'>('verifying');

  useEffect(() => {
    if (!oobCode) { setStatus('invalid'); return; }
    authApi.verifyEmail(oobCode)
      .then(() => setStatus('success'))
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

  if (status === 'verifying') {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10 mx-auto">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('errors.invalidCode')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('errors.expiredCode')}</p>
        <Link
          href={`/${locale}/login`}
          className="inline-block mt-2 text-sm text-blue-600 font-semibold hover:underline"
        >
          {t('backToLogin')} →
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/10 mx-auto">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('successTitle')}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t('successDesc')}</p>
      <Link
        href={`/${locale}/login`}
        className="inline-block mt-2 text-sm text-blue-600 font-semibold hover:underline"
      >
        {t('backToLogin')} →
      </Link>
    </div>
  );
}
