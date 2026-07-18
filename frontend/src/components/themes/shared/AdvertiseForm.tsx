'use client';

import { useState } from 'react';
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
  { id: 1, label: 'Ad Details',   icon: FileText },
  { id: 2, label: 'Targeting',    icon: MapPin },
  { id: 3, label: 'Payment',      icon: CreditCard },
  { id: 4, label: 'Confirmation', icon: CheckCircle2 },
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
                  {step.label}
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">Ad Details</h2>
        <p className="text-[13px] text-slate-400">Tell us about your ad and how to reach you.</p>
      </div>

      <div className="space-y-4">
        <SectionTitle>Your contact</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input required value={form.advertiser_name} onChange={e => set('advertiser_name', e.target.value)}
              placeholder="John Doe" className={INPUT} />
          </Field>
          <Field label="Email address" required>
            <input required type="email" value={form.advertiser_email} onChange={e => set('advertiser_email', e.target.value)}
              placeholder="john@company.com" className={INPUT} />
          </Field>
        </div>
        <Field label="Company / Brand">
          <input value={form.advertiser_company} onChange={e => set('advertiser_company', e.target.value)}
            placeholder="Acme Corp (optional)" className={INPUT} />
        </Field>
      </div>

      <div className="space-y-4">
        <SectionTitle>Ad content</SectionTitle>
        <Field label="Ad headline" required hint="Short, catchy title (max 80 characters).">
          <input required maxLength={80} value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Discover the best tool for..." className={INPUT} />
        </Field>
        <Field label="Description" hint="Brief description of your offer (max 200 characters).">
          <textarea maxLength={200} rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Boost your productivity with our award-winning app…"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none" />
        </Field>
        <Field label="Ad image URL" hint="Direct link to your banner (recommended: 1200×628 px).">
          <input type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)}
            placeholder="https://yoursite.com/banner.jpg" className={INPUT} />
        </Field>
        <Field label="Destination URL" required hint="Where should readers land when they click your ad?">
          <input required type="url" value={form.click_url} onChange={e => set('click_url', e.target.value)}
            placeholder="https://yoursite.com/landing" className={INPUT} />
        </Field>
      </div>

      <div className="space-y-4">
        <SectionTitle>Campaign (optional)</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start date">
            <input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} className={INPUT} />
          </Field>
          <Field label="End date">
            <input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)}
              min={form.starts_at || undefined} className={INPUT} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Ad Targeting ────────────────────────────────────────────────────

const SCOPE_OPTIONS: { value: TargetingScope; label: string; desc: string; icon: string }[] = [
  { value: 'global',  label: 'Global',  desc: 'Your ad reaches all readers, everywhere.', icon: '🌍' },
  { value: 'country', label: 'Country', desc: 'Target readers in a specific country.',     icon: '🏳️' },
  { value: 'region',  label: 'Region',  desc: 'Focus on a state, province, or region.',   icon: '📍' },
  { value: 'city',    label: 'City',    desc: 'Hyper-local targeting within a city.',      icon: '🏙️' },
];

function Step2({ form, set, primaryColor }: {
  form: FormState;
  set: (k: keyof FormState, v: string) => void;
  primaryColor: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">Ad Targeting</h2>
        <p className="text-[13px] text-slate-400">Choose where your ad should be displayed and your preferred currency.</p>
      </div>

      {/* Scope selector */}
      <div className="space-y-3">
        <SectionTitle>Display scope</SectionTitle>
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
                  <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">{opt.desc}</p>
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
          <SectionTitle>Location details</SectionTitle>
          <Field label="Country" required>
            <select
              value={form.targeting_country}
              onChange={e => set('targeting_country', e.target.value)}
              className={SELECT}
              required
            >
              <option value="">— Select a country —</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          {(form.targeting_scope === 'region' || form.targeting_scope === 'city') && (
            <Field label="Region / State / Province">
              <input
                value={form.targeting_region}
                onChange={e => set('targeting_region', e.target.value)}
                placeholder="e.g. California, Île-de-France, Lagos State…"
                className={INPUT}
              />
            </Field>
          )}
          {form.targeting_scope === 'city' && (
            <Field label="City" required>
              <input
                value={form.targeting_city}
                onChange={e => set('targeting_city', e.target.value)}
                placeholder="e.g. Paris, New York, Lagos…"
                className={INPUT}
                required
              />
            </Field>
          )}
        </div>
      )}

      {/* Currency */}
      <div className="space-y-3">
        <SectionTitle>Preferred currency</SectionTitle>
        <Field label="Currency" hint="Used to communicate your budget. No payment is collected today.">
          <select value={form.currency} onChange={e => set('currency', e.target.value)} className={SELECT}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Total budget" required hint="This is the amount you'll pay to run your ad.">
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
  const budget = parseFloat(form.total_budget || '0');
  const hasBudget = budget > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">Payment</h2>
        <p className="text-[13px] text-slate-400">Your ad slot is paid securely via NowPayments — crypto or card.</p>
      </div>

      {/* Budget summary */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ backgroundColor: `${primaryColor}10`, border: `2px solid ${primaryColor}30` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total to pay</p>
        {hasBudget ? (
          <p className="text-[32px] font-black" style={{ color: primaryColor }}>
            {budget.toLocaleString()} <span className="text-[18px]">{form.currency}</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-red-500">
            ⚠ Please go back and enter your budget to continue.
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="space-y-3">
        <SectionTitle>What happens next</SectionTitle>
        {[
          { step: '1', text: 'Click "Review & Pay" below — you\'ll see your ad summary.' },
          { step: '2', text: 'Click "Pay Now" — you\'re redirected to NowPayments\' secure page.' },
          { step: '3', text: 'Pay by crypto (USDT, BTC, ETH…) or by card via their platform.' },
          { step: '4', text: 'Payment confirmed → your ad is sent to the blog owner for review.' },
          { step: '5', text: 'Once approved, your ad goes live automatically.' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3">
            <div
              className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white mt-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              {s.step}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[12px] text-blue-700 leading-relaxed">
          <strong>Secure payment.</strong> Your ad slot is reserved only after payment is confirmed. NowPayments accepts 150+ cryptocurrencies and major cards.
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
  const scopeLabel = SCOPE_OPTIONS.find(o => o.value === form.targeting_scope)?.label ?? 'Global';
  const targetingSummary = form.targeting_scope === 'global'
    ? 'Global (all readers)'
    : [scopeLabel, form.targeting_country, form.targeting_region, form.targeting_city].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">Review your submission</h2>
        <p className="text-[13px] text-slate-400">Double-check everything before sending your ad request to <strong>{blogName}</strong>.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contact</p>
          <ReviewRow label="Name" value={form.advertiser_name} />
          <ReviewRow label="Email" value={form.advertiser_email} />
          <ReviewRow label="Company" value={form.advertiser_company} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ad content</p>
          <ReviewRow label="Headline" value={form.title} />
          <ReviewRow label="Description" value={form.description} />
          <ReviewRow label="Destination URL" value={form.click_url} />
          <ReviewRow label="Image URL" value={form.image_url} />
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Campaign &amp; Targeting</p>
          <ReviewRow label="Targeting" value={targetingSummary} />
          <ReviewRow label="Start date" value={form.starts_at} />
          <ReviewRow label="End date" value={form.ends_at} />
          <ReviewRow label="Budget" value={form.total_budget ? `${form.total_budget} ${form.currency}` : undefined} />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdvertiseForm({ tenantId, blogName, primaryColor }: Props) {
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
      `Targeting: ${SCOPE_OPTIONS.find(o => o.value === form.targeting_scope)?.label}`,
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
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
        <h2 className="text-xl font-black text-slate-900 mb-2">Payment received!</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-2">
          Your payment was confirmed. Your ad has been submitted to <strong>{blogName}</strong> for review.
        </p>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
          Once approved, your ad will go live automatically. You&apos;ll hear from the blog owner if any changes are needed.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStep(1); window.history.replaceState(null, '', window.location.pathname); setStatus('idle'); }}
          className="text-[13px] font-semibold px-5 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Submit another ad
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
            Please fill in all required fields before continuing.
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
            <ChevronLeft className="h-4 w-4" /> Back
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
            Continue <ChevronRight className="h-4 w-4" />
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
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing payment…</>
              : <><CreditCard className="h-4 w-4" /> Pay now — {form.total_budget} {form.currency}</>
            }
          </button>
        )}
      </div>

      {payment && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={tenantId}
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
