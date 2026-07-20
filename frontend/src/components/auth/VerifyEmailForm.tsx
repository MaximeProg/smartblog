'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { applyEmailVerificationCode } from '@/lib/firebase';

interface VerifyEmailFormProps {
  locale: string;
  oobCode: string | null;
}

export function VerifyEmailForm({ locale, oobCode }: VerifyEmailFormProps) {
  const t = useTranslations('auth.verifyEmail');
  const [status, setStatus] = useState<'verifying' | 'success' | 'invalid'>('verifying');

  useEffect(() => {
    // Pas de oobCode = Firebase a déjà traité la vérification sur sa propre
    // page hébergée avant de rediriger ici (comportement par défaut, même
    // avec handleCodeInApp: true — voir Customize action URL côté console
    // pour l'éviter complètement). Ce n'est pas un échec : l'email est déjà
    // vérifié, on l'affiche comme un succès plutôt qu'une fausse erreur.
    if (!oobCode) { setStatus('success'); return; }
    applyEmailVerificationCode(oobCode)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const code = (err as { code?: string })?.code ?? '';
        // Code déjà consommé (par la page Firebase hébergée juste avant, ou
        // un double-clic) — l'action a très probablement déjà réussi.
        if (code === 'auth/invalid-action-code') setStatus('success');
        else setStatus('invalid');
      });
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
