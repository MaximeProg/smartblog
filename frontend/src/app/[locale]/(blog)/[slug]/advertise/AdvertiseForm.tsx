'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const API_URL =
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL) ?? 'http://localhost:8080';

interface Props {
  tenantId: string;
  blogName: string;
  primaryColor: string;
}

interface FormState {
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
}

const EMPTY: FormState = {
  advertiser_name: '',
  advertiser_email: '',
  advertiser_company: '',
  title: '',
  description: '',
  image_url: '',
  click_url: '',
  starts_at: '',
  ends_at: '',
  total_budget: '',
};

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

const INPUT_CLS = 'w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

export function AdvertiseForm({ tenantId, blogName, primaryColor }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: keyof FormState, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const body: Record<string, unknown> = {
        advertiser_name: form.advertiser_name.trim(),
        advertiser_email: form.advertiser_email.trim(),
        title: form.title.trim(),
        click_url: form.click_url.trim(),
      };
      if (form.advertiser_company.trim()) body.advertiser_company = form.advertiser_company.trim();
      if (form.description.trim()) body.description = form.description.trim();
      if (form.image_url.trim()) body.image_url = form.image_url.trim();
      if (form.starts_at) body.starts_at = new Date(form.starts_at).toISOString();
      if (form.ends_at) body.ends_at = new Date(form.ends_at).toISOString();
      if (form.total_budget) body.total_budget = parseFloat(form.total_budget);

      const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}/ads/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Server error ${res.status}`);
      }

      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center shadow-sm">
        <div
          className="h-16 w-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-[20px] font-black text-slate-900 mb-2">Ad submitted!</h2>
        <p className="text-[14px] text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
          Your ad request has been received. The team at <strong>{blogName}</strong> will review it and get back to you by email.
        </p>
        <button
          onClick={() => { setForm(EMPTY); setStatus('idle'); }}
          className="text-[13px] font-semibold px-5 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Submit another ad
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-zinc-100 p-8 space-y-6 shadow-sm"
    >
      <div>
        <h2 className="text-[18px] font-black text-slate-900 mb-1">Your ad details</h2>
        <p className="text-[13px] text-slate-400">
          Fill in the details below. The blog owner will review and approve your ad.
        </p>
      </div>

      {/* Contact info */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input
              required
              value={form.advertiser_name}
              onChange={e => set('advertiser_name', e.target.value)}
              placeholder="John Doe"
              className={INPUT_CLS}
            />
          </Field>
          <Field label="Email address" required>
            <input
              required
              type="email"
              value={form.advertiser_email}
              onChange={e => set('advertiser_email', e.target.value)}
              placeholder="john@company.com"
              className={INPUT_CLS}
            />
          </Field>
        </div>
        <Field label="Company / Brand name">
          <input
            value={form.advertiser_company}
            onChange={e => set('advertiser_company', e.target.value)}
            placeholder="Acme Corp (optional)"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {/* Ad content */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ad content</p>
        <Field label="Ad headline" required hint="A short, catchy title for your ad (max 80 characters).">
          <input
            required
            maxLength={80}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Discover the best tool for..."
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Ad description" hint="A brief description of your offer (max 200 characters).">
          <textarea
            maxLength={200}
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Boost your productivity with our award-winning app…"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
          />
        </Field>
        <Field label="Ad image URL" hint="A direct link to your banner image (recommended: 1200×628 px).">
          <input
            type="url"
            value={form.image_url}
            onChange={e => set('image_url', e.target.value)}
            placeholder="https://yoursite.com/banner.jpg"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Destination URL" required hint="Where should readers go when they click your ad?">
          <input
            required
            type="url"
            value={form.click_url}
            onChange={e => set('click_url', e.target.value)}
            placeholder="https://yoursite.com/landing-page"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {/* Campaign */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Campaign (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start date">
            <input
              type="date"
              value={form.starts_at}
              onChange={e => set('starts_at', e.target.value)}
              className={INPUT_CLS}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={form.ends_at}
              onChange={e => set('ends_at', e.target.value)}
              min={form.starts_at || undefined}
              className={INPUT_CLS}
            />
          </Field>
        </div>
        <Field label="Total budget (USD)" hint="Indicative budget to help the blog owner prioritize. No payment is collected here.">
          <input
            type="number"
            min={0}
            step={10}
            value={form.total_budget}
            onChange={e => set('total_budget', e.target.value)}
            placeholder="500"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[12px] text-blue-700 leading-relaxed">
          <strong>No payment required today.</strong> Your submission will be reviewed manually. If approved, the blog owner will contact you to finalize the details and payment.
        </p>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-[12px] text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full h-12 rounded-xl text-white text-[14px] font-bold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        {status === 'loading'
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          : 'Submit ad request'}
      </button>
    </form>
  );
}
