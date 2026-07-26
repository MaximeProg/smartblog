'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Save, Loader2, User, Mail, Shield, Key, Eye, EyeOff, Phone, Globe, Lock, ShieldCheck, ShieldOff, Camera, Wallet, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getInitials, getErrorMessage } from '@/lib/utils';
import { COUNTRIES, CONTINENTS, GENDERS, getContinentFromCountry, getDialCode, countryFlag } from '@/lib/constants/countries';
import { twoFactorApi } from '@/lib/api';
import { TwoFactorSetupModal } from '@/components/auth/TwoFactorSetupModal';

// ── Composant Select commun ────────────────────────────────────────

function SelectField({
  value, onChange, placeholder, children, disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full h-10 px-3.5 rounded-xl border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors appearance-none cursor-pointer
        ${disabled
          ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
        }`}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

// ── Avatar Upload ─────────────────────────────────────────────────

function AvatarUpload({
  currentUrl, initials, onUpload,
}: {
  currentUrl?: string | null;
  initials: string;
  onUpload: (file: File) => void;
}) {
  const t = useTranslations('profile');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onUpload(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative h-20 w-20 rounded-full group transition-all ${dragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
      >
        {/* Avatar or initials */}
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={t('avatarAlt')}
            className="h-20 w-20 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[26px] font-black shadow-lg">
            {initials}
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        {t('avatarChange')}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const t = useTranslations('profile');

  // Champs profil
  const [displayName, setDisplayName] = useState('');
  const [localPhone, setLocalPhone]   = useState('');
  const [dialCode, setDialCode]       = useState('');
  const [country, setCountry]         = useState('');
  const [continent, setContinent]     = useState('');
  const [gender, setGender]           = useState('');
  const genderLocked = Boolean(user?.gender);

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false);

  // 2FA
  const [show2FASetup, setShow2FASetup]       = useState(false);
  const [show2FADisable, setShow2FADisable]   = useState(false);
  const [disableCode, setDisableCode]         = useState('');
  const [disableError, setDisableError]       = useState('');
  const [twoFAEnabled, setTwoFAEnabled]       = useState(user?.two_fa_enabled ?? false);

  // Wallet USDT
  const [walletAddress, setWalletAddress]   = useState(user?.usdt_wallet_address ?? '');
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [walletInput, setWalletInput]       = useState('');
  const [walletError, setWalletError]       = useState('');

  const walletMut = useMutation({
    mutationFn: () => authApi.updateWallet({
      usdt_wallet_address: walletInput.trim(),
    }),
    onSuccess: (res) => {
      const newAddress = res.data.usdt_wallet_address ?? walletInput.trim();
      setWalletAddress(newAddress);
      setShowWalletForm(false);
      setWalletInput('');
      setWalletError('');
      useAuthStore.setState(s => ({ user: s.user ? { ...s.user, usdt_wallet_address: newAddress } : null }));
      toast({ title: t('walletSavedToast') });
    },
    onError: (err: unknown) => {
      setWalletError(getErrorMessage(err, t('walletInvalidAddress')));
    },
  });

  const disable2FAMut = useMutation({
    mutationFn: () => twoFactorApi.disable(disableCode.replace(/\s/g, '')),
    onSuccess: () => {
      setTwoFAEnabled(false);
      setShow2FADisable(false);
      setDisableCode('');
      setDisableError('');
      useAuthStore.setState(s => ({ user: s.user ? { ...s.user, two_fa_enabled: false } : null }));
      toast({ title: t('twoFADisabledToast') });
    },
    onError: () => setDisableError(t('twoFAInvalidCode')),
  });

  // Mot de passe
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw]         = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [pwError, setPwError]             = useState('');

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.display_name ?? '');
    const savedCountry = user.country ?? '';
    setCountry(savedCountry);
    setContinent(user.continent ?? '');
    setGender(user.gender ?? '');
    setTwoFAEnabled(user.two_fa_enabled ?? false);
    setWalletAddress(user.usdt_wallet_address ?? '');
    const dc = savedCountry ? (getDialCode(savedCountry) ?? '') : '';
    setDialCode(dc);
    const fullPhone = user.phone ?? '';
    if (dc && fullPhone.startsWith(dc)) {
      setLocalPhone(fullPhone.slice(dc.length).trimStart());
    } else {
      setLocalPhone(fullPhone);
    }
  }, [user]);

  function handleCountryChange(code: string) {
    setCountry(code);
    if (code) {
      const detected = getContinentFromCountry(code);
      if (detected) setContinent(detected);
      const dc = getDialCode(code) ?? '';
      setDialCode(dc);
    } else {
      setDialCode('');
    }
  }

  const profileMut = useMutation({
    mutationFn: () => {
      const fullPhone = localPhone.trim()
        ? (dialCode ? `${dialCode} ${localPhone.trim()}` : localPhone.trim())
        : undefined;
      return authApi.updateProfile({
        display_name: displayName.trim() || undefined,
        phone:     fullPhone,
        country:   country     || undefined,
        continent: continent   || undefined,
        gender:    genderLocked ? undefined : (gender || undefined),
      } as any);
    },
    onSuccess: ({ data }) => {
      const savedPhone: string = (data as any).phone ?? '';
      const savedCountry: string = (data as any).country ?? '';
      const dc = savedCountry ? (getDialCode(savedCountry) ?? '') : '';
      setDialCode(dc);
      if (dc && savedPhone.startsWith(dc)) {
        setLocalPhone(savedPhone.slice(dc.length).trimStart());
      } else {
        setLocalPhone(savedPhone);
      }
      useAuthStore.setState(s => ({
        user: s.user ? {
          ...s.user,
          display_name: (data as any).display_name,
          phone:        savedPhone,
          country:      savedCountry,
          continent:    (data as any).continent,
          gender:       (data as any).gender,
        } : null,
      }));
      toast({ title: t('profileUpdatedToast') });
    },
    onError: (err: unknown) => toast({ variant: 'destructive', title: t('profileUpdateError'), description: getErrorMessage(err, '') }),
  });

  async function handleAvatarUpload(file: File) {
    setAvatarLoading(true);
    try {
      const { data } = await authApi.uploadAvatar(file);
      useAuthStore.setState(s => ({
        user: s.user ? { ...s.user, avatar_url: (data as any).avatar_url } : null,
      }));
      toast({ title: t('avatarUpdated') });
    } catch {
      toast({ variant: 'destructive', title: t('avatarError') });
    } finally {
      setAvatarLoading(false);
    }
  }

  const changePwMut = useMutation({
    mutationFn: () => authApi.changePassword(currentPw, newPw),
    onSuccess: () => {
      toast({ title: t('passwordUpdatedToast') });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setShowPwSection(false);
    },
    onError: (err: any) => setPwError(getErrorMessage(err, t('pwGenericError'))),
  });

  function handlePwSave() {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) { setPwError(t('pwFillAll')); return; }
    if (newPw.length < 8) { setPwError(t('pwTooShort')); return; }
    if (newPw !== confirmPw) { setPwError(t('pwMismatch')); return; }
    changePwMut.mutate();
  }

  const initials = user ? getInitials(user.display_name ?? user.email).slice(0, 2) : 'U';

  const inputCls = 'w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13.5px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  const genderLabel = (code: string) => {
    const g = GENDERS.find(x => x.code === code);
    if (!g) return code;
    return t(`genders.${g.code}` as any);
  };

  const chevron = (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto w-full">

            {/* ── Avatar + hero ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 mb-6">
              <div className="relative">
                {avatarLoading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                <AvatarUpload
                  currentUrl={user?.avatar_url}
                  initials={initials}
                  onUpload={handleAvatarUpload}
                />
              </div>
              <div className="text-center sm:text-left pb-1">
                <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">
                  {user?.display_name ?? user?.email?.split('@')[0]}
                </h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* ── Informations personnelles ──────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
              <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('personalInfo')}</h3>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">

                {/* Nom */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('displayNameLabel')}</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={t('displayNamePlaceholder')}
                    className={inputCls}
                  />
                </div>

                {/* Email (lecture seule) */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('emailLabel')} <span className="font-normal text-slate-400">{t('emailNote')}</span>
                  </label>
                  <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[13.5px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</span>
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> {t('phoneLabel')}
                    </span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center gap-1.5 h-10 px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[13px] text-slate-600 dark:text-slate-300 shrink-0 select-none min-w-[72px] justify-center">
                      {country
                        ? <><span className="text-base leading-none">{countryFlag(country)}</span><span>{dialCode}</span></>
                        : <span className="text-slate-400">+</span>
                      }
                    </div>
                    <input
                      type="tel"
                      value={localPhone}
                      onChange={e => setLocalPhone(e.target.value)}
                      placeholder={t('phonePlaceholder')}
                      className="flex-1 min-w-0 h-10 px-3.5 rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13.5px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Pays + Continent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> {t('countryLabel')}
                      </span>
                    </label>
                    <div className="relative">
                      <SelectField value={country} onChange={handleCountryChange} placeholder={t('countryPlaceholder')}>
                        {COUNTRIES.map(c => (
                          <option key={c.code + c.name} value={c.code}>{c.name}</option>
                        ))}
                      </SelectField>
                      {chevron}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('continentLabel')}</label>
                    <div className="relative">
                      <SelectField value={continent} onChange={setContinent} placeholder={t('continentPlaceholder')}>
                        {CONTINENTS.map(c => (
                          <option key={c.code} value={c.code}>{t(`continents.${c.code}` as any)}</option>
                        ))}
                      </SelectField>
                      {chevron}
                    </div>
                  </div>
                </div>

                {/* Sexe */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('genderLabel')}</label>
                  {genderLocked ? (
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
                      <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-[13.5px] text-slate-600 dark:text-slate-300">{genderLabel(user?.gender ?? '')}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <SelectField value={gender} onChange={setGender} placeholder={t('genderPlaceholder')}>
                        {GENDERS.map(g => (
                          <option key={g.code} value={g.code}>{t(`genders.${g.code}` as any)}</option>
                        ))}
                      </SelectField>
                      {chevron}
                    </div>
                  )}
                  {(genderLocked || (!genderLocked && gender)) && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> {t('genderLocked')}
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => profileMut.mutate()}
                    disabled={profileMut.isPending}
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

            {/* ── Mot de passe ──────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
              <button
                onClick={() => setShowPwSection(v => !v)}
                className="w-full flex items-center justify-between gap-2.5 px-4 sm:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('changePassword')}</h3>
                </div>
                <svg className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${showPwSection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPwSection && (
                <div className="px-4 sm:px-6 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
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
                  <button
                    onClick={handlePwSave}
                    disabled={changePwMut.isPending}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[13px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {changePwMut.isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('saving')}</>
                      : <><Save className="h-3.5 w-3.5" /> {t('updatePasswordButton')}</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* ── Sécurité du compte ───────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200">{t('accountSection')}</h3>
              </div>
              <div className="px-4 sm:px-6 py-5 space-y-4">
                {/* Plan */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{t('currentPlanLabel')}</p>
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 capitalize">{user?.plan ?? t('planFree')}</p>
                </div>

                {/* 2FA */}
                <div className={`rounded-xl border px-4 py-3.5 ${twoFAEnabled ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-2.5">
                      {twoFAEnabled
                        ? <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                        : <ShieldOff className="h-5 w-5 text-slate-400 shrink-0" />
                      }
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('twoFASection')}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {twoFAEnabled ? t('twoFAStatusEnabled') : t('twoFAStatusDisabled')}
                        </p>
                      </div>
                    </div>
                    {twoFAEnabled ? (
                      <button
                        onClick={() => { setShow2FADisable(true); setDisableCode(''); setDisableError(''); }}
                        className="self-start sm:self-auto flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[12px] font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> {t('twoFADisableButton')}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShow2FASetup(true)}
                        className="self-start sm:self-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> {t('twoFAEnableButton')}
                      </button>
                    )}
                  </div>

                  {show2FADisable && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                      <p className="text-[12px] text-slate-600 dark:text-slate-400">{t('twoFADisableConfirm')}</p>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={disableCode}
                        onChange={e => { setDisableCode(e.target.value.replace(/[^0-9 ]/g,'').slice(0,7)); setDisableError(''); }}
                        placeholder="000 000"
                        maxLength={7}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[16px] font-mono tracking-[0.3em] text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      />
                      {disableError && <p className="text-[11px] text-red-500">{disableError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShow2FADisable(false); setDisableCode(''); setDisableError(''); }}
                          className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[12px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {t('cancelButton')}
                        </button>
                        <button
                          onClick={() => disable2FAMut.mutate()}
                          disabled={disableCode.replace(/\s/g,'').length < 6 || disable2FAMut.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {disable2FAMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          {t('twoFAConfirmDisable')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Wallet USDT BSC (BEP20) ──────────────────────────── */}
                <div className={`rounded-xl border px-4 py-3.5 ${walletAddress ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-2.5">
                      <Wallet className={`h-5 w-5 shrink-0 ${walletAddress ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('walletSection')}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {walletAddress
                            ? `${walletAddress.slice(0, 6)}•••${walletAddress.slice(-4)}`
                            : t('walletNotSet')
                          }
                        </p>
                      </div>
                    </div>
                    {twoFAEnabled ? (
                      <button
                        onClick={() => { setShowWalletForm(v => !v); setWalletInput(walletAddress); setWalletError(''); }}
                        className="self-start sm:self-auto flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-[12px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        {walletAddress ? t('walletEditButton') : t('walletAddButton')}
                      </button>
                    ) : (
                      <span className="self-start sm:self-auto text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                        {t('walletRequires2FA')}
                      </span>
                    )}
                  </div>

                  {showWalletForm && twoFAEnabled && (
                    <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800/50 space-y-3">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('walletDescription')}</p>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('walletAddressLabel')}</label>
                        <input
                          type="text"
                          value={walletInput}
                          onChange={e => { setWalletInput(e.target.value.trim()); setWalletError(''); }}
                          placeholder={t('walletAddressPlaceholder')}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
                        />
                      </div>
                      {walletError && <p className="text-[11px] text-red-500">{walletError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowWalletForm(false); setWalletInput(''); setWalletError(''); }}
                          className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[12px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {t('cancelButton')}
                        </button>
                        <button
                          onClick={() => walletMut.mutate()}
                          disabled={!/^0x[a-fA-F0-9]{40}$/.test(walletInput) || walletMut.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {walletMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {t('walletSaveButton')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {show2FASetup && (
        <TwoFactorSetupModal
          onClose={() => setShow2FASetup(false)}
          onEnabled={() => {
            setTwoFAEnabled(true);
            useAuthStore.setState(s => ({ user: s.user ? { ...s.user, two_fa_enabled: true } : null }));
          }}
        />
      )}
    </div>
  );
}
