'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Sparkles, Wand2, ChevronRight, Loader2, Check,
  Globe, Users, Mic2, Palette,
} from 'lucide-react';
import { tenantsApi, aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────

interface BuilderForm {
  brand_name: string;
  niche: string;
  audience: string;
  tone: string;
  language: string;
  color_preference: string;
}

const TONES = [
  { value: 'professional', labelKey: 'toneProfessional' },
  { value: 'friendly', labelKey: 'toneFriendly' },
  { value: 'inspiring', labelKey: 'toneInspiring' },
  { value: 'educational', labelKey: 'toneEducational' },
  { value: 'bold', labelKey: 'toneBold' },
] as const;

const COLORS = [
  { value: 'blue', hex: '#2563eb', labelKey: 'colorBlue' },
  { value: 'violet', hex: '#7c3aed', labelKey: 'colorViolet' },
  { value: 'emerald', hex: '#059669', labelKey: 'colorEmerald' },
  { value: 'rose', hex: '#e11d48', labelKey: 'colorRose' },
  { value: 'amber', hex: '#d97706', labelKey: 'colorAmber' },
  { value: 'slate', hex: '#475569', labelKey: 'colorSlate' },
] as const;

// ── Main component ─────────────────────────────────────────────────

export default function AiBuilderPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const locale = useLocale();
  const t = useTranslations('aiBuilder');
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [form, setForm] = useState<BuilderForm>({
    brand_name: tenant?.name ?? '',
    niche: '',
    audience: '',
    tone: 'professional',
    language: locale === 'fr' ? 'fr' : 'en',
    color_preference: 'blue',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof BuilderForm, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const isValid = form.brand_name.trim() && form.niche.trim() && form.audience.trim();

  const handleGenerate = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const { data: config } = await aiApi.setupBlog(blogId, {
        niche: form.niche,
        audience: form.audience,
        tone: form.tone,
        language: form.language,
        brand_name: form.brand_name,
        color_preference: form.color_preference || undefined,
      });

      // Apply general settings
      const general = config.general as any;
      const seo = config.seo as any;
      const currentTc = tenant?.template_config ?? {};

      await tenantsApi.update(blogId, {
        name: general?.name ?? tenant?.name,
        description: general?.description ?? undefined,
        primary_color: general?.primary_color ?? undefined,
        seo_title_template: seo?.seo_title_template ?? undefined,
        seo_meta_description: seo?.seo_meta_description ?? undefined,
        template_config: {
          ...currentTc,
          header:  config.header  ?? currentTc.header,
          footer:  config.footer  ?? currentTc.footer,
          home:    config.home    ?? currentTc.home,
          about:   config.about   ?? currentTc.about,
          contact: config.contact ?? currentTc.contact,
        },
      } as any);

      await qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      setDone(true);

      toast({ title: t('successToast') });
    } catch (e: any) {
      const isPlanError = e?.response?.status === 402;
      toast({
        variant: 'destructive',
        title: isPlanError ? t('planRequiredError') : t('generationFailedError'),
        description: getErrorMessage(e, t('checkQuotaError')),
      });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {t('doneTitle')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-sm">
          {t('doneDesc')}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/${locale}/blogs/${blogId}/general`)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
          >
            {t('viewGeneralSettings')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/blogs/${blogId}/home`)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold transition-colors"
          >
            {t('viewHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
    <div className="px-5 py-8 max-w-xl mx-auto">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg mb-4">
          <Wand2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">

        {/* Brand name */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            {t('brandNameLabel')}
            <span className="text-red-500">*</span>
          </label>
          <input
            value={form.brand_name}
            onChange={e => set('brand_name', e.target.value)}
            placeholder={t('brandNamePlaceholder')}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Niche */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-blue-500" />
            {t('nicheLabel')}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.niche}
            onChange={e => set('niche', e.target.value)}
            placeholder={t('nichePlaceholder')}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all resize-none"
          />
        </div>

        {/* Audience */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            {t('audienceLabel')}
            <span className="text-red-500">*</span>
          </label>
          <input
            value={form.audience}
            onChange={e => set('audience', e.target.value)}
            placeholder={t('audiencePlaceholder')}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-400 transition-all"
          />
        </div>

        {/* Tone */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <Mic2 className="h-3.5 w-3.5 text-amber-500" />
            {t('toneLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {TONES.map(tone => (
              <button
                key={tone.value}
                onClick={() => set('tone', tone.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                  form.tone === tone.value
                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {t(tone.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            {t('languageLabel')}
          </label>
          <div className="flex gap-2">
            {[{ value: 'fr', label: '🇫🇷 Français' }, { value: 'en', label: '🇬🇧 English' }].map(l => (
              <button
                key={l.value}
                onClick={() => set('language', l.value)}
                className={`flex-1 py-2 rounded-xl text-[13px] font-bold border transition-all ${
                  form.language === l.value
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
            <Palette className="h-3.5 w-3.5 text-rose-500" />
            {t('colorLabel')}
          </label>
          <div className="flex gap-2.5">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => set('color_preference', c.value)}
                title={t(c.labelKey)}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${
                  form.color_preference === c.value
                    ? 'border-slate-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!isValid || loading}
          className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-black text-[15px] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('generatingButton')}
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              {t('generateButton')}
            </>
          )}
        </button>

        {!isValid && (
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            {t('requiredFieldsNote')}
          </p>
        )}

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
          {t('aiCreditsNote')}
        </p>
      </div>
    </div>
    </div>
    </div>
  );
}
