'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { authApi, twoFactorApi } from '@/lib/api';
import { signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

interface LoginFormProps {
  locale: string;
  callbackUrl?: string;
}

export function LoginForm({ locale, callbackUrl }: LoginFormProps) {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { toast } = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [googleLoading, setGoogleLoading]   = useState(false);
  const [formError, setFormError]           = useState<string | null>(null);
  const [showResend, setShowResend]         = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  // 2FA — la finalisation diffère selon la méthode de connexion : un compte
  // Google renvoie le firebase_id_token, un compte natif renvoie le
  // challenge_token émis par /auth/login-password.
  const [needs2FA, setNeeds2FA]             = useState(false);
  const [twoFAMethod, setTwoFAMethod]       = useState<'google' | 'password'>('password');
  const [firebaseToken, setFirebaseToken]   = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFACode, setTwoFACode]           = useState('');
  const [twoFALoading, setTwoFALoading]     = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function handleBackendLogin(idToken: string) {
    const { data } = await authApi.login(idToken);
    if (data.requires_2fa) {
      setFirebaseToken(idToken);
      setTwoFAMethod('google');
      setNeeds2FA(true);
      return;
    }
    const tenants = data.tenants ?? [];
    setAuth(data.user, tenants, data.access_token);
    router.push(callbackUrl ?? `/${locale}/dashboard`);
  }

  async function handle2FASubmit() {
    setFormError(null);
    setTwoFALoading(true);
    try {
      const code = twoFACode.replace(/\s/g, '');
      const { data } = twoFAMethod === 'google'
        ? await twoFactorApi.login(firebaseToken, code)
        : await twoFactorApi.loginPassword(challengeToken, code);
      const tenants = data.tenants ?? [];
      setAuth(data.user, tenants, data.access_token);
      router.push(callbackUrl ?? `/${locale}/dashboard`);
    } catch {
      setFormError(t('errors.invalid2FA'));
    } finally {
      setTwoFALoading(false);
    }
  }


  const onSubmit = async ({ email, password }: FormValues) => {
    setFormError(null);
    setShowResend(false);
    try {
      const { data } = await authApi.loginPassword(email, password);
      if (data.requires_2fa) {
        setChallengeToken(data.two_fa_challenge_token ?? '');
        setTwoFAMethod('password');
        setNeeds2FA(true);
        return;
      }
      const tenants = data.tenants ?? [];
      setAuth(data.user, tenants, data.access_token);
      router.push(callbackUrl ?? `/${locale}/dashboard`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '';

      let msg: string;
      if (detail.toLowerCase().includes('vérifier votre adresse email')) {
        msg = t('errors.emailNotVerified');
        setShowResend(true);
      } else if (detail.toLowerCase().includes('incorrect')) {
        msg = t('errors.invalidCredentials');
      } else if (detail) {
        msg = detail;
      } else {
        msg = t('errors.generic');
      }

      setFormError(msg);
      toast({ variant: 'destructive', title: msg });
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      await handleBackendLogin(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/account-exists-with-different-credential') {
        const msg = 'An account already exists with this email. Please sign in with email/password.';
        setFormError(msg);
        toast({ variant: 'destructive', title: msg });
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user closed popup — silent
      } else {
        toast({ variant: 'destructive', title: t('errors.generic') });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Écran 2FA ────────────────────────────────────────────────────────
  if (needs2FA) {
    return (
      <div className="w-full space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <p className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{t('twoFATitle')}</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">{t('twoFADesc')}</p>
        </div>

        <div>
          <input
            type="text"
            inputMode="numeric"
            value={twoFACode}
            onChange={e => setTwoFACode(e.target.value.replace(/[^0-9 ]/g, '').slice(0, 7))}
            placeholder="000 000"
            maxLength={7}
            autoFocus
            className="w-full h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[26px] font-mono tracking-[0.4em] text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          />
        </div>

        {formError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <Button
          onClick={handle2FASubmit}
          disabled={twoFACode.replace(/\s/g,'').length < 6 || twoFALoading}
          className="w-full"
        >
          {twoFALoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('twoFAVerify')}
        </Button>

        <button
          type="button"
          onClick={() => { setNeeds2FA(false); setFirebaseToken(''); setChallengeToken(''); setTwoFACode(''); setFormError(null); }}
          className="w-full text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          ← {t('twoFABack')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-3"
        onClick={handleGoogle}
        disabled={googleLoading || isSubmitting}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {t('googleButton')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t('orDivider')}</span>
        </div>
      </div>

      {/* Email/password form */}
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('passwordLabel')}</Label>
            <Link href={`/${locale}/forgot-password`} className="text-xs text-primary hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder={t('passwordPlaceholder')}
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {formError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        {showResend && (
          <button
            type="button"
            disabled={resendLoading}
            onClick={async () => {
              const { email } = getValues();
              setResendLoading(true);
              try {
                await authApi.resendVerification(email, locale);
                toast({ title: 'Email de vérification renvoyé — vérifiez votre boîte mail.' });
                setShowResend(false);
              } catch {
                toast({ variant: 'destructive', title: 'Impossible de renvoyer l\'email.' });
              } finally {
                setResendLoading(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
          >
            {resendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
            Renvoyer l&apos;email de vérification
          </button>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? t('signingIn') : t('signInButton')}
        </Button>
      </form>
    </div>
  );
}
