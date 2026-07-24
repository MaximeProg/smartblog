'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Globe, MapPin, CreditCard, FileText,
} from 'lucide-react';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import type { CryptoPaymentResponse } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

interface Props {
  tenantId: string;
  blogName: string;
  primaryColor: string;
}

type TargetingScope = 'global' | 'country' | 'region' | 'city';

interface FormState {
  // Step 1 — Ad Details
  advertiser_name: string;
  advertiser_email: string;
  advertiser_company: string;
  title: string;
  description: string;
  image_url: string;
  click_url: string;
  starts_at: string;
  ends_at: string;
  total_budget: string;
  // Step 2 — Targeting
  targeting_scope: TargetingScope;
  targeting_country: string;
  targeting_region: string;
  targeting_city: string;
  currency: string;
}

const EMPTY: FormState = {
  advertiser_name: '', advertiser_email: '', advertiser_company: '',
  title: '', description: '', image_url: '', click_url: '',
  starts_at: '', ends_at: '', total_budget: '',
  targeting_scope: 'global', targeting_country: '', targeting_region: '', targeting_city: '',
  currency: 'USD',
};

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'XOF', label: 'XOF — CFA Franc BCEAO' },
  { code: 'MAD', label: 'MAD — Moroccan Dirham' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'France', 'Germany',
  'Spain', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Switzerland',
  'Japan', 'China', 'India', 'South Korea', 'Singapore', 'UAE', 'Saudi Arabia',
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Senegal', 'Côte d\'Ivoire', 'Morocco',
  'Egypt', 'Brazil', 'Argentina', 'Mexico', 'Colombia', 'Chile', 'Peru',
];

const STEPS = [
  { id: 1, labelKey: 'adDetailsStepLabel',   icon: FileText },
  { id: 2, labelKey: 'targetingStepLabel',   icon: MapPin },
  { id: 3, labelKey: 'paymentStepLabel',     icon: CreditCard },
  { id: 4, labelKey: 'confirmationStepLabel', icon: CheckCircle2 },
];

// ── Small helpers ────────────────────────────────────────────────────────────

const INPUT = 'w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';
const SELECT = 'w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors cursor-pointer';

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-[11px] text-slate-400 mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">{children}</p>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, primaryColor }: { current: number; primaryColor: string }) {
  const t = useTranslations('publicBlog');
  return (
    <div className="px-6 pt-6 pb-5 border-b border-zinc-100">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                  style={{
                    backgroundColor: done || active ? primaryColor : undefined,
                    color: done || active ? '#fff' : '#94a3b8',
                    border: done || active ? 'none' : '2px solid #e2e8f0',
                  }}
                >
                  {done ? '✓' : step.id}
                </div>
                <span
                  className="hidden sm:block text-[10px] font-semibold whitespace-nowrap transition-colors duration-300"
                  style={{ color: active ? primaryColor : done ? '#64748b' : '#cbd5e1' }}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 transition-colors duration-300"
                  style={{ backgroundColor: done ? primaryColor : '#e2e8f0' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1 — Ad Details ───────────────────────────────────────────────────────

function Step1({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const t = useTranslations('publicBlog');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{t('adDetailsStepLabel')}</h2>
        <p className="text-[13px] text-slate-400">{t('adDetailsSubtitle')}</p>
      </div>

      <div className="space-y-4">
        <SectionTitle>{t('yourContactSectionTitle')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('contactNameLabel')} required>
            <input required value={form.advertiser_name} onChange={e => set('advertiser_name', e.target.value)}
              placeholder={t('contactNamePlaceholder')} className={INPUT} />
          </Field>
          <Field label={t('emailAddressLabel')} required>
            <input required type="email" value={form.advertiser_email} onChange={e => set('advertiser_email', e.target.value)}
              placeholder={t('contactEmailPlaceholder')} className={INPUT} />
          </Field>
        </div>
        <Field label={t('companyBrandLabel')}>
          <input value={form.advertiser_company} onChange={e => set('advertiser_company', e.target.value)}
            placeholder={t('companyBrandPlaceholder')} className={INPUT} />
        </Field>
      </div>

      <div className="space-y-4">
        <SectionTitle>{t('adContentSectionTitle')}</SectionTitle>
        <Field label={t('adHeadlineLabel')} required hint={t('adHeadlineHint')}>
          <input required maxLength={80} value={form.title} onChange={e => set('title', e.target.value)}
            placeholder={t('adHeadlinePlaceholder')} className={INPUT} />
        </Field>
        <Field label={t('adDescriptionLabel')} hint={t('adDescriptionHint')}>
          <textarea maxLength={200} rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder={t('adDescriptionPlaceholder')}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none" />
        </Field>
        <Field label={t('adImageUrlLabel')} hint={t('adImageUrlHint')}>
          <input type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)}
            placeholder="https://yoursite.com/banner.jpg" className={INPUT} />
        </Field>
        <Field label={t('destinationUrlLabel')} required hint={t('destinationUrlHint')}>
          <input required type="url" value={form.click_url} onChange={e => set('click_url', e.target.value)}
            placeholder="https://yoursite.com/landing" className={INPUT} />
        </Field>
      </div>

      <div className="space-y-4">
        <SectionTitle>{t('campaignOptionalSectionTitle')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('startDateLabel')}>
            <input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} className={INPUT} />
          </Field>
          <Field label={t('endDateLabel')}>
            <input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
              min={form.starts_at || undefined} className={INPUT} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Ad Targeting ────────────────────────────────────────────────────

const SCOPE_OPTIONS: { value: TargetingScope; labelKey: string; descKey: string; icon: string }[] = [
  { value: 'global',  labelKey: 'scopeGlobalLabel',  descKey: 'scopeGlobalDesc',  icon: '🌍' },
  { value: 'country', labelKey: 'scopeCountryLabel', descKey: 'scopeCountryDesc', icon: '🏳️' },
  { value: 'region',  labelKey: 'scopeRegionLabel',  descKey: 'scopeRegionDesc',  icon: '📍' },
  { value: 'city',    labelKey: 'scopeCityLabel',    descKey: 'scopeCityDesc',    icon: '🏙️' },
];

// Fixed English labels used only for the plain-text note sent to the backend API
// (not user-facing UI — keep untranslated so submissions stay consistent for blog owners).
const SCOPE_LABELS_EN: Record<TargetingScope, string> = {
  global: 'Global', country: 'Country', region: 'Region', city: 'City',
};

function Step2({ form, set, primaryColor }: {
  form: FormState;
  set: (k: keyof FormState, v: string) => void;
  primaryColor: string;
}) {
  const t = useTranslations('publicBlog');
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{t('adTargetingTitle')}</h2>
        <p className="text-[13px] text-slate-400">{t('adTargetingSubtitle')}</p>
      </div>

      {/* Scope selector */}
      <div className="space-y-3">
        <SectionTitle>{t('displayScopeSectionTitle')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCOPE_OPTIONS.map(opt => {
            const active = form.targeting_scope === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('targeting_scope', opt.value)}
                className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: active ? primaryColor : '#e2e8f0',
                  backgroundColor: active ? `${primaryColor}08` : '#fff',
                }}
              >
                <span className="text-xl leading-none mt-0.5 shrink-0">{opt.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{t(opt.labelKey)}</p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">{t(opt.descKey)}</p>
                </div>
                {active && (
                  <div
                    className="ml-auto shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: primaryColor }}
                  >
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Geo fields — shown based on scope */}
      {form.targeting_scope !== 'global' && (
        <div className="space-y-4">
          <SectionTitle>{t('locationDetailsSectionTitle')}</SectionTitle>
          <Field label={t('scopeCountryLabel')} required>
            <select
              value={form.targeting_country}
              onChange={e => set('targeting_country', e.target.value)}
              className={SELECT}
              required
            >
              <option value="">{t('selectCountryPlaceholder')}</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          {(form.targeting_scope === 'region' || form.targeting_scope === 'city') && (
            <Field label={t('regionFieldLabel')}>
              <input
                value={form.targeting_region}
                onChange={e => set('targeting_region', e.target.value)}
                placeholder={t('regionPlaceholder')}
                className={INPUT}
              />
            </Field>
          )}
          {form.targeting_scope === 'city' && (
            <Field label={t('scopeCityLabel')} required>
              <input
                value={form.targeting_city}
                onChange={e => set('targeting_city', e.target.value)}
                placeholder={t('cityPlaceholder')}
                className={INPUT}
                required
              />
            </Field>
          )}
        </div>
      )}

      {/* Currency */}
      <div className="space-y-3">
        <SectionTitle>{t('preferredCurrencySectionTitle')}</SectionTitle>
        <Field label={t('currencyLabel')} hint={t('currencyHint')}>
          <select value={form.currency} onChange={e => set('currency', e.target.value)} className={SELECT}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Field>
        <Field label={t('totalBudgetLabel')} required hint={t('totalBudgetHint')}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {form.currency}
            </span>
            <input
              type="number" min={0} step={10}
              value={form.total_budget}
              onChange={e => set('total_budget', e.target.value)}
              placeholder="500"
              className={`${INPUT} pl-12`}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

// ── Step 3 — Payment ─────────────────────────────────────────────────────────

function Step3({ form, primaryColor }: { form: FormState; primaryColor: string }) {
  const t = useTranslations('publicBlog');
  const budget = parseFloat(form.total_budget || '0');
  const hasBudget = budget > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{t('paymentStepLabel')}</h2>
        <p className="text-[13px] text-slate-400">{t('paymentSubtitle')}</p>
      </div>

      {/* Budget summary */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t('totalToPayLabel')}</p>
        {hasBudget ? (
          <p className="text-[32px] font-black" style={{ color: primaryColor }}>
            {budget.toLocaleString()} <span className="text-[18px]">{form.currency}</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-red-500">
            ⚠ {t('missingBudgetWarning')}
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <SectionTitle>{t('whatHappensNextSectionTitle')}</SectionTitle>
        {[
          { step: '1', textKey: 'paymentStep1Text' },
          { step: '2', textKey: 'paymentStep2Text' },
          { step: '3', textKey: 'paymentStep3Text' },
          { step: '4', textKey: 'paymentStep4Text' },
          { step: '5', textKey: 'paymentStep5Text' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3">
            <div
              className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white mt-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              {s.step}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{t(s.textKey)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[12px] text-blue-700 leading-relaxed">
          <strong>{t('securePaymentBold')}</strong> {t('securePaymentDesc')}
        </p>
      </div>
    </div>
  );
}

// ── Step 4 — Confirmation ────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-700 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function Step4({ form, blogName, primaryColor }: { form: FormState; blogName: string; primaryColor: string }) {
  const t = useTranslations('publicBlog');
  const scopeLabelKey = SCOPE_OPTIONS.find(o => o.value === form.targeting_scope)?.labelKey ?? 'scopeGlobalLabel';
  const scopeLabel = t(scopeLabelKey);
  const targetingSummary = form.targeting_scope === 'global'
    ? t('globalAllReadersLabel')
    : [scopeLabel, form.targeting_country, form.targeting_region, form.targeting_city].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">{t('reviewSubmissionTitle')}</h2>
        <p className="text-[13px] text-slate-400">{t('reviewSubmissionSubtitlePrefix')} <strong>{blogName}</strong>{t('reviewSubmissionSubtitleSuffix')}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('contactSubtitle')}</p>
          <ReviewRow label={t('commentFormNameLabel')} value={form.advertiser_name} />
          <ReviewRow label={t('commentFormEmailLabel')} value={form.advertiser_email} />
          <ReviewRow label={t('companyLabel')} value={form.advertiser_company} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('adContentSectionTitle')}</p>
          <ReviewRow label={t('headlineLabel')} value={form.title} />
          <ReviewRow label={t('adDescriptionLabel')} value={form.description} />
          <ReviewRow label={t('destinationUrlLabel')} value={form.click_url} />
          <ReviewRow label={t('imageUrlLabel')} value={form.image_url} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t('campaignTargetingSectionLabel')}</p>
          <ReviewRow label={t('targetingStepLabel')} value={targetingSummary} />
          <ReviewRow label={t('startDateLabel')} value={form.starts_at} />
          <ReviewRow label={t('endDateLabel')} value={form.ends_at} />
          <ReviewRow label={t('budgetLabel')} value={form.total_budget ? `${form.total_budget} ${form.currency}` : undefined} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdvertiseForm({ tenantId, blogName, primaryColor }: Props) {
  const t = useTranslations('publicBlog');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [touched, setTouched] = useState(false);
  const [payment, setPayment] = useState<CryptoPaymentResponse | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const validateStep1 = () =>
    !!(form.advertiser_name.trim() && form.advertiser_email.trim() && form.title.trim() && form.click_url.trim());

  const validateStep2 = () => {
    if (form.targeting_scope !== 'global' && !form.targeting_country) return false;
    if (form.targeting_scope === 'city' && !form.targeting_city) return false;
    if (!form.total_budget || parseFloat(form.total_budget) <= 0) return false;
    return true;
  };

  const canAdvance = () => {
    if (step === 1) return validateStep1();
    if (step === 2) return validateStep2();
    if (step === 3) return !!(form.total_budget && parseFloat(form.total_budget) > 0);
    return true;
  };

  const next = () => {
    setTouched(true);
    if (canAdvance()) { setStep(s => s + 1); setTouched(false); }
  };
  const back = () => setStep(s => s - 1);

  const buildTargetingNote = () => {
    if (form.targeting_scope === 'global') return 'Targeting: Global';
    const parts = [
      `Targeting: ${SCOPE_LABELS_EN[form.targeting_scope]}`,
      form.targeting_country && `Country: ${form.targeting_country}`,
      form.targeting_region && `Region: ${form.targeting_region}`,
      form.targeting_city && `City: ${form.targeting_city}`,
    ].filter(Boolean);
    return parts.join(' | ');
  };

  const handleSubmit = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const body: Record<string, unknown> = {
        advertiser_name: form.advertiser_name.trim(),
        advertiser_email: form.advertiser_email.trim(),
        title: form.title.trim(),
        click_url: form.click_url.trim(),
        total_budget: parseFloat(form.total_budget),
        currency: form.currency,
      };
      if (form.advertiser_company.trim()) body.advertiser_company = form.advertiser_company.trim();
      const descParts = [form.description.trim(), buildTargetingNote()].filter(Boolean);
      if (descParts.length) body.description = descParts.join('\n\n');
      if (form.image_url.trim()) body.image_url = form.image_url.trim();
      if (form.starts_at) body.starts_at = new Date(form.starts_at).toISOString();
      if (form.ends_at) body.ends_at = new Date(form.ends_at).toISOString();

      const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/ads/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Server error ${res.status}`);
      }
      const data = await res.json();
      setPayment(data);
      setStatus('idle');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('genericSubmitError'));
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-10 text-center">
        <div
          className="h-16 w-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">{t('paymentReceivedTitle')}</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-2">
          {t('paymentReceivedDescPrefix')} <strong>{blogName}</strong> {t('paymentReceivedDescSuffix')}
        </p>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
          {t('paymentReceivedNote')}
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStep(1); window.history.replaceState(null, '', window.location.pathname); setStatus('idle'); }}
          className="text-[13px] font-semibold px-5 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t('submitAnotherAdButton')}
        </button>
      </div>
    );
  }

  const step1Invalid = touched && step === 1 && !validateStep1();

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Step indicator */}
      <StepIndicator current={step} primaryColor={primaryColor} />

      {/* Step content */}
      <div className="p-6 sm:p-8">
        {step === 1 && <Step1 form={form} set={set} />}
        {step === 2 && <Step2 form={form} set={set} primaryColor={primaryColor} />}
        {step === 3 && <Step3 form={form} primaryColor={primaryColor} />}
        {step === 4 && <Step4 form={form} blogName={blogName} primaryColor={primaryColor} />}
      </div>

      {/* Validation hint */}
      {step1Invalid && (
        <div className="px-6 sm:px-8 pb-4">
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {t('fillRequiredFieldsError')}
          </p>
        </div>
      )}

      {/* Error from submit */}
      {status === 'error' && (
        <div className="px-6 sm:px-8 pb-4">
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-[12px] text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="px-6 sm:px-8 pb-6 flex items-center justify-between gap-3 border-t border-zinc-50 pt-5">
        {step > 1 ? (
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> {t('backButton')}
          </button>
        ) : (
          <span />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {t('continueButton')} <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {status === 'loading'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('preparingPaymentButton')}</>
              : <><CreditCard className="h-4 w-4" /> {t('payNowButton', { budget: form.total_budget, currency: form.currency })}</>
            }
          </button>
        )}
      </div>

      {payment && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={tenantId}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={() => { setPayment(null); setStatus('success'); }}
        />
      )}
    </div>
  );
}
