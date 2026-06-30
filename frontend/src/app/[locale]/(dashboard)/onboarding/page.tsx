'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Check, Sparkles, Globe, Palette, Rocket,
} from 'lucide-react';

import { tenantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { slugify } from '@/lib/utils';
import { getPlanConfig } from '@/lib/plans';
import { THEMES, BLOG_CATEGORIES, FONT_OPTIONS, COLOR_PRESETS } from '@/lib/themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { TenantInfo } from '@/types';

interface WizardData {
  name: string; description: string; category: string;
  language: string; slug: string; theme: string;
  primaryColor: string; fontFamily: string;
}

const INITIAL: WizardData = {
  name: '', description: '', category: '', language: 'fr',
  slug: '', theme: 'minimal', primaryColor: '#3B82F6', fontFamily: 'Inter',
};

const step1Schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(4).max(50).regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/),
  description: z.string().max(500).optional(),
  category: z.string().min(1),
  language: z.string().min(2),
});
type Step1Values = z.infer<typeof step1Schema>;
type TFn = ReturnType<typeof useTranslations<'onboarding'>>;

// ── Sidebar step config ────────────────────────────────────────────

const STEP_ICONS = [Globe, Palette, Sparkles, Rocket];

export default function OnboardingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('onboarding');
  const { user, tenants, addTenant, setCurrentTenant } = useAuthStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [createdBlog, setCreatedBlog] = useState<{ id: string; name: string; slug: string } | null>(null);

  useEffect(() => {
    if (tenants.length > 0) router.replace(`/${locale}/dashboard`);
  }, [tenants.length, locale, router]);

  const plan = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);

  const createMutation = useMutation({
    mutationFn: () =>
      tenantsApi.create({
        name: data.name, slug: data.slug,
        description: data.description || undefined,
        category: data.category, language: data.language,
        theme: data.theme, primary_color: data.primaryColor,
        font_family: data.fontFamily,
      }),
    onSuccess: ({ data: result }) => {
      const tenantInfo: TenantInfo = {
        id: result.id, name: result.name,
        slug: result.slug, plan: result.plan, role: 'tenant_admin',
      };
      addTenant(tenantInfo);
      setCurrentTenant(result.id);
      setCreatedBlog({ id: result.id, name: result.name, slug: result.slug });
      setStep(4);
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = apiErr?.response?.data?.message || apiErr?.response?.data?.error || apiErr?.message || 'Erreur lors de la création du blog';
      toast({ variant: 'destructive', title: 'Erreur', description: msg });
    },
  });

  const stepLabels = [
    t('steps.information'), t('steps.chooseTheme'),
    t('steps.customize'), t('steps.done'),
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-slate-950 border-r border-slate-800">
        {/* Logo */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">N</span>
            </div>
            <span className="text-white font-bold tracking-tight">NexusBlog</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 px-6 py-8">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-6">
            {t('sidebar.assistant')}
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[17px] top-6 bottom-6 w-px bg-slate-800" />

            <div className="space-y-1">
              {stepLabels.map((label, idx) => {
                const n = idx + 1;
                const Icon = STEP_ICONS[idx];
                const isDone = step > n;
                const isActive = step === n;
                return (
                  <div key={n} className={`relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-slate-800/80' : ''
                  }`}>
                    <div className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-emerald-500'
                        : isActive
                        ? 'bg-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-slate-800 border border-slate-700'
                    }`}>
                      {isDone
                        ? <Check className="h-4 w-4 text-white" />
                        : <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      }
                    </div>
                    <div>
                      <p className={`text-sm font-medium leading-tight ${
                        isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-600'
                      }`}>{label}</p>
                      {isActive && (
                        <p className="text-[10px] text-blue-400 mt-0.5">En cours</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-5 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-300 truncate">{user?.email}</p>
              <span className="text-[10px] text-blue-400 font-medium">{planConfig.label}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-slate-50 dark:bg-zinc-900">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">N</span>
            </div>
            <span className="font-bold tracking-tight">NexusBlog</span>
            <span className="ml-auto text-xs text-slate-400">{t('mobileStep', { step })}</span>
          </div>

          {step === 1 && (
            <Step1
              initial={{ name: data.name, slug: data.slug, description: data.description, category: data.category, language: data.language }}
              onNext={(vals) => { setData(d => ({ ...d, ...vals })); setStep(2); }}
              t={t}
            />
          )}
          {step === 2 && (
            <Step2
              selected={data.theme}
              onSelect={(theme) => setData(d => ({
                ...d, theme,
                primaryColor: THEMES.find(th => th.id === theme)?.defaultColor ?? d.primaryColor,
                fontFamily: THEMES.find(th => th.id === theme)?.defaultFont ?? d.fontFamily,
              }))}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              t={t}
            />
          )}
          {step === 3 && (
            <Step3
              primaryColor={data.primaryColor}
              fontFamily={data.fontFamily}
              onBack={() => setStep(2)}
              onSubmit={({ primaryColor, fontFamily }) => {
                setData(d => ({ ...d, primaryColor, fontFamily }));
                createMutation.mutate();
              }}
              isPending={createMutation.isPending}
              t={t}
            />
          )}
          {step === 4 && createdBlog && (
            <Step4 blog={createdBlog} locale={locale} theme={data.theme} t={t} />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Step header ────────────────────────────────────────────────────

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-full mb-4">
        <span>Étape {step} sur 3</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{subtitle}</p>
    </div>
  );
}

// ── Step 1 ─────────────────────────────────────────────────────────

function Step1({ initial, onNext, t }: {
  initial: Partial<Step1Values>;
  onNext: (data: Step1Values) => void;
  t: TFn;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step1Values>({ resolver: zodResolver(step1Schema), defaultValues: initial });

  const nameValue = watch('name', '');
  const slugValue = watch('slug', '');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (nameValue && !slugTouched) setValue('slug', slugify(nameValue), { shouldValidate: true });
  }, [nameValue, slugTouched, setValue]);

  const { data: slugCheck, isFetching: checkingSlug } = useQuery({
    queryKey: ['slug-check', slugValue],
    queryFn: () => tenantsApi.checkSlug(slugValue).then((r) => r.data),
    enabled: slugValue.length >= 4 && !errors.slug,
    staleTime: 5000,
  });

  const slugAvailable = slugCheck?.available;
  const showSlugStatus = slugValue.length >= 4 && !errors.slug;

  return (
    <div>
      <StepHeader step={1} title={t('step1.title')} subtitle={t('step1.subtitle')} />

      <form onSubmit={handleSubmit(onNext)} className="space-y-5">
        {/* Blog name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('step1.nameLabel')} <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder={t('step1.namePlaceholder')}
            className="h-11 bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
            autoFocus
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Subdomain */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('step1.slugLabel')} <span className="text-red-500">*</span>
          </Label>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <span className="flex items-center px-3.5 text-sm text-slate-400 bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-slate-700 shrink-0 select-none">
              nexusblog.io/
            </span>
            <div className="flex-1 relative">
              <input
                placeholder={t('step1.slugPlaceholder')}
                className="w-full h-11 px-3 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                {...register('slug')}
                onChange={(e) => { setSlugTouched(true); register('slug').onChange(e); }}
              />
              {showSlugStatus && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug
                    ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    : slugAvailable
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              )}
            </div>
          </div>
          {errors.slug
            ? <p className="text-xs text-red-500">{errors.slug.message}</p>
            : showSlugStatus && !checkingSlug
            ? <p className={`text-xs font-medium ${slugAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                {slugAvailable ? t('step1.slugAvailable') : t('step1.slugTaken')}
              </p>
            : null}
        </div>

        {/* Category + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('step1.categoryLabel')} <span className="text-red-500">*</span>
            </Label>
            <select
              className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              {...register('category')}
            >
              <option value="">{t('step1.categoryPlaceholder')}</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('step1.languageLabel')}
            </Label>
            <select
              className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              {...register('language')}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="pt">🇧🇷 Português</option>
              <option value="ar">🇸🇦 العربية</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('step1.descriptionLabel')}{' '}
            <span className="text-slate-400 font-normal">{t('step1.descriptionOptional')}</span>
          </Label>
          <Textarea
            placeholder={t('step1.descriptionPlaceholder')}
            rows={3}
            className="bg-white dark:bg-zinc-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 resize-none"
            {...register('description')}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
          disabled={showSlugStatus && !checkingSlug && !slugAvailable}
        >
          {t('step1.nextButton')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </form>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────────

function Step2({ selected, onSelect, onBack, onNext, t }: {
  selected: string; onSelect: (id: string) => void;
  onBack: () => void; onNext: () => void; t: TFn;
}) {
  return (
    <div>
      <StepHeader step={2} title={t('step2.title')} subtitle={t('step2.subtitle')} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`relative text-left rounded-xl border-2 overflow-hidden transition-all focus:outline-none group ${
              selected === theme.id
                ? 'border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-950/40'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <ThemePreview theme={theme} />
            <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{theme.name}</span>
                {selected === theme.id && (
                  <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack} className="gap-2 border-slate-200 dark:border-slate-700">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <Button onClick={onNext} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold">
          {t('step2.nextButton')} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Theme preview ──────────────────────────────────────────────────

function ThemePreview({ theme }: { theme: (typeof THEMES)[0] }) {
  if (theme.id === 'minimal') return (
    <div className="h-32 bg-white p-3 overflow-hidden">
      <div className="max-w-[140px] mx-auto">
        <div className="h-1.5 w-12 bg-gray-200 rounded mx-auto mb-2" />
        <div className="h-2.5 w-full bg-gray-900 rounded mb-1" />
        <div className="h-1.5 w-3/4 bg-gray-300 rounded mx-auto mb-3" />
        {[1,2,3].map(i => <div key={i} className="h-1.5 w-full bg-gray-100 rounded mb-1" />)}
      </div>
    </div>
  );
  if (theme.id === 'magazine') return (
    <div className="h-32 bg-white p-2 overflow-hidden">
      <div className="h-3.5 flex items-center justify-between mb-1.5 border-b-2 border-red-600 pb-1">
        <div className="h-2 w-14 bg-red-600 rounded" />
        <div className="flex gap-1">{[1,2,3].map(i => <div key={i} className="h-1.5 w-5 bg-gray-200 rounded" />)}</div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className="col-span-2 h-16 bg-gray-100 rounded relative">
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5">
            <div className="h-1.5 w-full bg-white/80 rounded mb-0.5" />
          </div>
        </div>
        <div className="space-y-1">{[1,2,3].map(i => <div key={i} className="h-5 bg-gray-50 rounded border border-gray-100" />)}</div>
      </div>
    </div>
  );
  if (theme.id === 'business') return (
    <div className="h-32 bg-slate-50 p-2 overflow-hidden">
      <div className="h-5 bg-blue-700 rounded mb-2 flex items-center px-2">
        <div className="h-1.5 w-10 bg-white/80 rounded" />
      </div>
      <div className="h-8 bg-white rounded border border-blue-100 mb-1.5 flex items-center px-2">
        <div className="space-y-1"><div className="h-1.5 w-20 bg-gray-800 rounded" /><div className="h-1 w-14 bg-gray-300 rounded" /></div>
      </div>
      {[1,2].map(i => <div key={i} className="h-4 bg-white rounded border border-gray-100 flex items-center px-2 gap-2 mb-1"><div className="h-2.5 w-2.5 rounded bg-blue-100 shrink-0" /><div className="h-1.5 w-full bg-gray-100 rounded" /></div>)}
    </div>
  );
  if (theme.id === 'news') return (
    <div className="h-32 bg-white p-2 overflow-hidden">
      <div className="border-b-2 border-gray-900 pb-1 mb-1.5"><div className="h-2.5 w-20 bg-gray-900 rounded" /></div>
      <div className="grid grid-cols-3 gap-1 mb-1.5">
        <div className="col-span-2 space-y-1">
          <div className="h-2 w-full bg-gray-800 rounded" /><div className="h-1.5 w-5/6 bg-gray-800 rounded" />
          <div className="h-1 w-full bg-gray-200 rounded" />
        </div>
        <div className="h-12 bg-gray-100 rounded" />
      </div>
    </div>
  );
  if (theme.id === 'portfolio') return (
    <div className="h-32 bg-zinc-50 p-2 overflow-hidden">
      <div className="h-3 flex items-center justify-between mb-2 px-1">
        <div className="h-1.5 w-12 bg-rose-500 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[1,2,3,4].map(i => <div key={i} className={`bg-gray-200 rounded ${i % 2 === 0 ? 'h-11' : 'h-16'}`} />)}
      </div>
    </div>
  );
  return (
    <div className="h-32 bg-zinc-950 p-2 overflow-hidden">
      <div className="flex items-center gap-1 mb-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-red-500" /><div className="h-1.5 w-1.5 rounded-full bg-yellow-500" /><div className="h-1.5 w-1.5 rounded-full bg-green-500" />
      </div>
      <div className="h-1 w-full bg-violet-500 rounded mb-2" />
      <div className="space-y-1">
        <div className="h-1.5 w-2/3 bg-violet-400 rounded" />
        <div className="h-1 w-full bg-zinc-700 rounded" /><div className="h-1 w-5/6 bg-zinc-700 rounded" />
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────────────

function Step3({ primaryColor, fontFamily, onBack, onSubmit, isPending, t }: {
  primaryColor: string; fontFamily: string; onBack: () => void;
  onSubmit: (data: { primaryColor: string; fontFamily: string }) => void;
  isPending: boolean; t: TFn;
}) {
  const [color, setColor] = useState(primaryColor);
  const [font, setFont] = useState(fontFamily);

  return (
    <div>
      <StepHeader step={3} title={t('step3.title')} subtitle={t('step3.subtitle')} />
      <div className="space-y-7">
        {/* Color */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('step3.colorLabel')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {COLOR_PRESETS.map(({ color: c, label }) => (
              <button
                key={c}
                title={label}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-slate-300'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden relative hover:border-slate-400 transition-colors" title="Custom">
              <span className="text-xs text-slate-400">+</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-2 w-fit">
            <div className="h-5 w-5 rounded-md shadow-sm" style={{ backgroundColor: color }} />
            <code className="text-xs text-slate-500 dark:text-slate-400">{color}</code>
          </div>
        </div>

        {/* Font */}
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t('step3.fontLabel')}</p>
          <div className="space-y-2">
            {FONT_OPTIONS.map(({ value, label, sample }) => (
              <button
                key={value}
                onClick={() => setFont(value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                  font === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                  <span className="text-xs text-slate-400 ml-2">{sample}</span>
                </div>
                {font === value && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <span className="text-[10px] text-slate-400 ml-1">{t('step3.previewLabel')}</span>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900">
            <div className="h-1 rounded-full mb-3" style={{ width: 48, backgroundColor: color }} />
            <h3 className="text-base font-bold mb-1.5 text-slate-900 dark:text-white" style={{ fontFamily: font }}>
              {t('step3.previewTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed" style={{ fontFamily: font }}>
              {t('step3.previewBody')}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400">{t('step3.previewAuthor')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-7">
        <Button variant="outline" onClick={onBack} className="gap-2 border-slate-200 dark:border-slate-700">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <Button
          onClick={() => onSubmit({ primaryColor: color, fontFamily: font })}
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold"
          disabled={isPending}
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('step3.creatingButton')}</>
            : <>{t('step3.createButton')} <ArrowRight className="h-4 w-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — Success ───────────────────────────────────────────────

function Step4({ blog, locale, theme, t }: {
  blog: { id: string; name: string; slug: string };
  locale: string; theme: string; t: TFn;
}) {
  const themeInfo = THEMES.find(th => th.id === theme);
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center mb-6 shadow-xl shadow-emerald-200 dark:shadow-emerald-950/40">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        {t('step4.title')} 🎉
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{blog.name}</span>{' '}{t('step4.liveAt')}
      </p>
      <a
        href={`https://${blog.slug}.nexusblog.io`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline mb-8"
      >
        {blog.slug}.nexusblog.io
        <ArrowRight className="h-3.5 w-3.5" />
      </a>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8 text-left">
        {[
          { value: '0', label: t('step4.stats.articles') },
          { value: themeInfo?.name ?? theme, label: t('step4.stats.theme') },
          { value: t('step4.stats.statusValue'), label: t('step4.stats.status') },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4">
            <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 font-semibold">
          <a href={`/${locale}/blogs/${blog.id}/articles/new`}>
            {t('step4.writeFirst')} <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-11 border-slate-200 dark:border-slate-700">
          <a href={`/${locale}/dashboard`}>{t('step4.dashboard')}</a>
        </Button>
      </div>
    </div>
  );
}
