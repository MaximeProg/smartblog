'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Users, ShieldCheck, Loader2, CheckCircle2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { teamApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/lib/utils';

const ROLE_ICON_COLOR: Record<string, string> = {
  EDITOR:       'text-violet-600',
  AUTHOR:       'text-blue-600',
  VIEWER:       'text-slate-500',
  TENANT_ADMIN: 'text-amber-600',
};

function AcceptInviteContent() {
  const t = useTranslations('acceptInvite');
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const token = searchParams.get('token') ?? '';

  type InviteData = {
    tenant_id: string;
    tenant_name: string;
    inviter_name: string;
    email: string;
    role: string;
    expires_at: string;
  };

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setLoadError(t('noToken')); return; }
    teamApi.lookupInvitation(token)
      .then(r => setInvite(r.data))
      .catch(() => setLoadError(t('notFound')));
  }, [token, t]);

  async function handleAccept() {
    if (!token || accepting) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await teamApi.acceptInvitationByToken(token);
      setDone(true);
      // Redirect to the blog dashboard after 2s
      setTimeout(() => {
        router.push(`/${locale}/blogs`);
      }, 2000);
    } catch (e: any) {
      setAcceptError(getErrorMessage(e, t('acceptError')));
    } finally {
      setAccepting(false);
    }
  }

  const acceptPath = `/${locale}/accept-invite?token=${encodeURIComponent(token)}`;
  const loginUrl = `/${locale}/login?callbackUrl=${encodeURIComponent(acceptPath)}`;
  const registerUrl = `/${locale}/register?callbackUrl=${encodeURIComponent(acceptPath)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base font-black shadow-md shrink-0">N</div>
            <span className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-slate-100">SmarterBloggers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Loading */}
          {!invite && !loadError && (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-[13px] text-slate-400">{t('loading')}</p>
            </div>
          )}

          {/* Error: not found / expired */}
          {loadError && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-[18px] font-black text-slate-900 dark:text-slate-100 mb-2">{t('errorTitle')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{loadError}</p>
            </div>
          )}

          {/* Success: accepted */}
          {done && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h1 className="text-[18px] font-black text-slate-900 dark:text-slate-100 mb-2">{t('acceptedTitle')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{t('acceptedDesc')}</p>
            </div>
          )}

          {/* Invite details */}
          {invite && !done && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-600 to-violet-600 px-8 py-8 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-[20px] font-black text-white leading-tight">{t('title')}</h1>
                <p className="text-[13px] text-blue-100 mt-1">{t('subtitle', { name: invite.inviter_name })}</p>
              </div>

              <div className="px-8 py-6 space-y-4">
                {/* Invite card */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('blog')}</span>
                    <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{invite.tenant_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('role')}</span>
                    <span className={`text-[13px] font-bold ${ROLE_ICON_COLOR[invite.role] ?? 'text-slate-700'}`}>
                      {invite.role.charAt(0) + invite.role.slice(1).toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('invitedTo')}</span>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{invite.email}</span>
                  </div>
                </div>

                {/* Auth gate */}
                {isHydrated && !isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 text-center">{t('authRequired')}</p>
                    <Link
                      href={loginUrl}
                      className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      {t('loginBtn')}
                    </Link>
                    <Link
                      href={registerUrl}
                      className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[14px] font-bold hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t('registerBtn')}
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-3">
                    {acceptError && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <p className="text-[12px] text-red-600 dark:text-red-400">{acceptError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold transition-colors disabled:opacity-60"
                    >
                      {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {t('acceptBtn')}
                    </button>
                  </div>
                ) : null}

                <p className="text-center text-[11px] text-slate-400">
                  {t('expires', { date: new Date(invite.expires_at).toLocaleDateString() })}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
