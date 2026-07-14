import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.resetPassword' });
  return { title: `${t('title')} — SmarterBloggers` };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ oobCode?: string; mode?: string }>;
}) {
  const { locale } = await params;
  const { oobCode } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth.resetPassword' });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <LanguageSwitcher locale={locale} />
      </div>

      {/* Center form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              N
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {t('title')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('subtitle')}
              </p>
            </div>

            <ResetPasswordForm locale={locale} oobCode={oobCode ?? null} />
          </div>
        </div>
      </div>
    </div>
  );
}
