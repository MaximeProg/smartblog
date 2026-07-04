'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, Loader2, User, Mail, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const t = useTranslations('profile');

  const [displayName, setDisplayName] = useState('');
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) setDisplayName(user.display_name ?? '');
  }, [user]);

  const profileMut = useMutation({
    mutationFn: () => authApi.updateProfile({ display_name: displayName.trim() }),
    onSuccess: ({ data }) => {
      useAuthStore.setState(s => ({ user: s.user ? { ...s.user, display_name: (data as any).display_name } : null }));
      toast({ title: t('profileUpdatedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: t('profileUpdateError') }),
  });

  const initials = user ? getInitials(user.display_name ?? user.email).slice(0, 2) : 'U';

  function handlePwSave() {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) { setPwError(t('pwFillAll')); return; }
    if (newPw.length < 8) { setPwError(t('pwTooShort')); return; }
    if (newPw !== confirmPw) { setPwError(t('pwMismatch')); return; }
    toast({ title: t('passwordUpdatedToast') });
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setShowPwSection(false);
  }

  const inputCls = 'w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13.5px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-2xl">

            {/* Avatar + name hero */}
            <div className="flex items-center gap-5 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[22px] font-black shadow-lg">
                {initials}
              </div>
              <div>
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">{user?.display_name ?? user?.email?.split('@')[0]}</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Profile info card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('personalInfo')}</h3>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('displayNameLabel')}</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={t('displayNamePlaceholder')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('emailLabel')} <span className="font-normal text-slate-400">{t('emailNote')}</span>
                  </label>
                  <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[13.5px] text-slate-500 dark:text-slate-400">{user?.email}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => profileMut.mutate()}
                    disabled={!displayName.trim() || profileMut.isPending}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {profileMut.isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('saving')}</>
                      : <><Save className="h-3.5 w-3.5" /> {t('saveProfile')}</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Security card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
              <button
                onClick={() => setShowPwSection(v => !v)}
                className="w-full flex items-center justify-between gap-2.5 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('changePassword')}</h3>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform ${showPwSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPwSection && (
                <div className="px-6 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('currentPasswordLabel')}</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className={inputCls + ' pr-10'}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('newPasswordLabel')}</label>
                    <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder={t('newPasswordHint')} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('confirmPasswordLabel')}</label>
                    <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder={t('confirmPasswordPlaceholder')} className={inputCls} />
                  </div>
                  {pwError && <p className="text-[12px] text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{pwError}</p>}
                  <button onClick={handlePwSave} className="flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[13px] font-semibold transition-colors">
                    <Save className="h-3.5 w-3.5" /> {t('updatePasswordButton')}
                  </button>
                </div>
              )}
            </div>

            {/* Account info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('accountSection')}</h3>
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t('currentPlanLabel')}</p>
                    <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 capitalize">{user?.plan ?? t('planFree')}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t('twoFALabel')}</p>
                    <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{user?.two_fa_enabled ? t('twoFAEnabled') : t('twoFADisabled')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
