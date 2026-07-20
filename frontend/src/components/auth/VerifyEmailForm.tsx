'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { authApi } from '@/lib/api';

interface VerifyEmailFormProps {
  locale: string;
  token: string | null;
}

export function VerifyEmailForm({ locale, token }: VerifyEmailFormProps) {
  const t = useTranslations('auth.verifyEmail');
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'invalid'>('verifying');
  // React (StrictMode en dev) peut monter/exécuter l'effet deux fois — le
  // token étant à usage unique, un 2e appel échouerait à tort après un 1er
  // succès. Ce ref garantit un seul appel réel par lien cliqué.
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    if (calledRef.current) return;
    calledRef.current = true;
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  // Redirection automatique vers la connexion une fois la vérification confirmée.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => router.push(`/${locale}/login`), 2500);
    return () => clearTimeout(timer);
  }, [status, router, locale]);

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
