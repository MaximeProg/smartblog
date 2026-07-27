'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import { platformApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface FormConfig {
  title: string;
  name_label: string; name_placeholder: string;
  email_label: string; email_placeholder: string;
  subject_label: string; subject_placeholder: string;
  message_label: string; message_placeholder: string;
  submit_label: string;
  success_title: string;
  success_message: string;
}

export interface ContactFormErrors {
  rateLimited: string;
  generic: string;
}

const EN_ERRORS: ContactFormErrors = {
  rateLimited: 'Too many messages sent. Please try again in an hour.',
  generic: 'Something went wrong. Please try again or email us directly.',
};

export function ContactForm({
  config, errors = EN_ERRORS, channel = 'general', initialSubject = '',
}: { config: FormConfig; errors?: ContactFormErrors; channel?: string; initialSubject?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: initialSubject, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await platformApi.sendContactMessage({ channel, ...form });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.status === 429 ? errors.rateLimited : getErrorMessage(err, errors.generic));
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3">{config.success_title}</h3>
        <p className="text-slate-500 dark:text-slate-400">{config.success_message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold mb-8">{config.title}</h2>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
            {config.name_label}
          </label>
          <input
            required
            type="text"
            className={inputCls}
            placeholder={config.name_placeholder}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
            {config.email_label}
          </label>
          <input
            required
            type="email"
            className={inputCls}
            placeholder={config.email_placeholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
          {config.subject_label}
        </label>
        <input
          required
          type="text"
          className={inputCls}
          placeholder={config.subject_placeholder}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
          {config.message_label}
        </label>
        <textarea
          required
          rows={6}
          className={`${inputCls} resize-none`}
          placeholder={config.message_placeholder}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:opacity-70"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{config.submit_label}<ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
