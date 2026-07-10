'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyResetCode, confirmPasswordResetWithCode } from '@/lib/firebase';

const schema = z
  .object({
    password: z.string().min(8),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'mismatch' });

type FormValues = z.infer<typeof schema>;

interface ResetPasswordFormProps {
  locale: string;
  oobCode: string | null;
}

export function ResetPasswordForm({ locale, oobCode }: ResetPasswordFormProps) {
  const t = useTranslations('auth.resetPassword');

  const [status, setStatus] = useState<'verifying' | 'ready' | 'success' | 'invalid'>('verifying');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!oobCode) { setStatus('invalid'); return; }
    verifyResetCode(oobCode)
      .then(() => setStatus('ready'))
      .catch(() => setStatus('invalid'));
  }, [oobCode]);

  const onSubmit = async ({ password }: FormValues) => {
    if (!oobCode) return;
    setFormError(null);
    try {
      await confirmPasswordResetWithCode(oobCode, password);
      setStatus('success');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/expired-action-code') {
        setFormError(t('errors.expiredCode'));
      } else if (code === 'auth/invalid-action-code') {
        setFormError(t('errors.invalidCode'));
      } else {
        setFormError(t('errors.generic'));
      }
    }
  };

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
          href={`/${locale}/forgot-password`}
          className="inline-block mt-2 text-sm text-blue-600 font-semibold hover:underline"
        >
          Request a new link →
        </Link>
      </div>
    );
  }

  if (status === 'success') {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          autoComplete="new-password"
          autoFocus
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">{t('confirmLabel')}</Label>
        <Input
          id="confirm"
          type="password"
          placeholder={t('confirmPlaceholder')}
          autoComplete="new-password"
          {...register('confirm')}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">
            {errors.confirm.message === 'mismatch' ? t('errors.mismatch') : errors.confirm.message}
          </p>
        )}
      </div>

      {formError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
          {formError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? t('saving') : t('saveButton')}
      </Button>
    </form>
  );
}
