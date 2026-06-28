'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { signInWithEmail, signInWithGoogle, getGoogleRedirectResult } from '@/lib/firebase';
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

  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function handleBackendLogin(idToken: string) {
    const { data } = await authApi.login(idToken);
    const tenants = data.tenants ?? [];
    setAuth(data.user, tenants, data.access_token);
    // Redirect to onboarding if user has no blogs yet
    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (tenants.length === 0) {
      router.push(`/${locale}/onboarding`);
    } else {
      router.push(`/${locale}/dashboard`);
    }
  }

  // After signInWithRedirect, sessionStorage flag signals a pending result
  useEffect(() => {
    const hasPendingRedirect =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('nexusblog_google_redirect') === '1';
    if (!hasPendingRedirect) return;

    let cancelled = false;
    setGoogleLoading(true);

    getGoogleRedirectResult()
      .then(async (idToken) => {
        if (idToken && !cancelled) await handleBackendLogin(idToken);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = (err as { code?: string })?.code ?? '';
        console.error('[Google Login] redirect result error:', code, err);
        if (code === 'auth/account-exists-with-different-credential') {
          const msg = 'An account already exists with this email using a different sign-in method. Please sign in with email/password instead.';
          setFormError(msg);
          toast({ variant: 'destructive', title: msg });
        } else {
          toast({ variant: 'destructive', title: t('errors.generic') });
        }
      })
      .finally(() => {
        if (!cancelled) setGoogleLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async ({ email, password }: FormValues) => {
    setFormError(null);
    try {
      console.log('[Login] starting for', email);
      const idToken = await signInWithEmail(email, password);
      console.log('[Login] Firebase OK, calling backend...');
      await handleBackendLogin(idToken);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const detail: string =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? '';
      const rawMsg = err instanceof Error ? err.message : '';

      console.error('[Login] error:', code || rawMsg, detail || '');

      let msg: string;
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        msg = t('errors.invalidCredentials');
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later or reset your password.';
      } else if (detail.toLowerCase().includes('verify') || detail.includes('EMAIL_NOT_VERIFIED')) {
        msg = t('errors.emailNotVerified');
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network error — cannot reach Firebase.';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Email/password sign-in is disabled in Firebase Console.';
      } else {
        msg = `${t('errors.generic')} [${code || detail || rawMsg || 'unknown'}]`;
      }

      setFormError(msg);
      toast({ variant: 'destructive', title: msg });
    }
  };

  // Trigger the redirect to Google
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(); // navigates away — page redirects to Google
    } catch {
      setGoogleLoading(false);
      toast({ variant: 'destructive', title: t('errors.generic') });
    }
  };

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

        <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? t('signingIn') : t('signInButton')}
        </Button>
      </form>
    </div>
  );
}
