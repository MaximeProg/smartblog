'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendPasswordReset } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations('auth.forgotPassword');
  const { toast } = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: FormValues) => {
    try {
      await sendPasswordReset(email);
      setSentTo(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // Don't reveal non-existence — always show success to prevent enumeration
      if (msg.includes('user-not-found') || msg.includes('auth/user-not-found')) {
        setSentTo(email);
      } else {
        toast({ variant: 'destructive', title: t('errors.generic') });
      }
    }
  };

  if (sentTo) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/10 mx-auto">
          <MailCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('successTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('successDesc', { email: sentTo })}
        </p>
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
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? t('sending') : t('sendButton')}
      </Button>
    </form>
  );
}
