'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';

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

// ── Wizard data ────────────────────────────────────────────────────

interface WizardData {
  name: string;
  description: string;
  category: string;
  language: string;
  slug: string;
  theme: string;
  primaryColor: string;
  fontFamily: string;
}

const INITIAL: WizardData = {
  name: '', description: '', category: '', language: 'fr', slug: '',
  theme: 'minimal',
  primaryColor: '#3B82F6', fontFamily: 'Inter',
};

const step1Schema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string().min(4).max(50)
    .regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/),
  description: z.string().max(500).optional(),
  category: z.string().min(1),
  language: z.string().min(2),
});
type Step1Values = z.infer<typeof step1Schema>;

// ── Main wizard ────────────────────────────────────────────────────

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
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        category: data.category,
        language: data.language,
        theme: data.theme,
        primary_color: data.primaryColor,
        font_family: data.fontFamily,
      }),
    onSuccess: ({ data: result }) => {
      const tenantInfo: TenantInfo = {
        id: result.id,
        name: result.name,
        slug: result.slug,
        plan: result.plan,
        role: 'tenant_admin',
      };
      addTenant(tenantInfo);
      setCurrentTenant(result.id);
      setCreatedBlog({ id: result.id, name: result.name, slug: result.slug });
      setStep(4);
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.response?.data?.error ||
        apiErr?.message ||
        'Erreur lors de la création du blog';
      toast({ variant: 'destructive', title: 'Erreur', description: msg });
    },
  });

  const stepLabels = [
    t('steps.information'),
    t('steps.chooseTheme'),
    t('steps.customize'),
    t('steps.done'),
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 flex">
      {/* Left sidebar */}
      <div className="hidden lg:flex flex-col w-[300px] shrink-0 bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
        <div className="flex items-center gap-2 mb-12">
          <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-sm font-black">N</div>
          <span className="font-extrabold tracking-tight">NexusBlog</span>
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-semibold opacity-60 uppercase tracking-widest mb-6">{t('sidebar.assistant')}</p>
          <div className="space-y-1">
            {stepLabels.map((label, idx) => {
              const n = idx + 1;
              return (
                <div
                  key={n}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    step === n ? 'bg-white/20 font-semibold' :
                    step > n ? 'opacity-60' : 'opacity-30'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    step > n ? 'bg-white text-current' :
                    step === n ? 'bg-white/30' : 'bg-white/10'
                  }`}>
                    {step > n ? <Check className="h-3.5 w-3.5 text-green-600" /> : n}
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/20 pt-5">
          <p className="text-[11px] opacity-50">{t('sidebar.connectedAs')}</p>
          <p className="text-xs font-semibold mt-0.5 truncate">{user?.email}</p>
          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 bg-white/20">
            {t('sidebar.plan', { plan: planConfig.label })}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <Step1
              initial={{ name: data.name, slug: data.slug, description: data.description, category: data.category, language: data.language }}
              onNext={(vals) => { setData(d => ({ ...d, ...vals })); setStep(2); }}
              t={t}
              step={step}
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
              step={step}
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
              step={step}
            />
          )}
          {step === 4 && createdBlog && (
            <Step4 blog={createdBlog} locale={locale} theme={data.theme} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Information ───────────────────────────────────────────

type TFn = ReturnType<typeof useTranslations<'onboarding'>>;

function Step1({ initial, onNext, t, step }: {
  initial: Partial<Step1Values>;
  onNext: (data: Step1Values) => void;
  t: TFn;
  step: number;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step1Values>({ resolver: zodResolver(step1Schema), defaultValues: initial });

  const nameValue = watch('name', '');
  const slugValue = watch('slug', '');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (nameValue && !slugTouched) {
      setValue('slug', slugify(nameValue), { shouldValidate: true });
    }
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
      <StepHeader step={step} title={t('step1.title')} subtitle={t('step1.subtitle')} t={t} />
      <form onSubmit={handleSubmit(onNext)} className="space-y-5 mt-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="font-semibold">{t('step1.nameLabel')} <span className="text-destructive">*</span></Label>
            <Input placeholder={t('step1.namePlaceholder')} className="h-11" autoFocus {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="font-semibold">{t('step1.slugLabel')} <span className="text-destructive">*</span></Label>
            <div className="flex rounded-lg border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
              <span className="bg-muted px-3 flex items-center text-sm text-muted-foreground border-r border-input shrink-0">
                nexusblog.io/
              </span>
              <div className="flex-1 relative">
                <input
                  placeholder={t('step1.slugPlaceholder')}
                  className="w-full h-11 px-3 text-sm bg-background outline-none"
                  {...register('slug')}
                  onChange={(e) => { setSlugTouched(true); register('slug').onChange(e); }}
                />
                {showSlugStatus && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingSlug
                      ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      : slugAvailable
                      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                      : <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                )}
              </div>
            </div>
            {errors.slug ? (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            ) : showSlugStatus && !checkingSlug ? (
              <p className={`text-xs font-medium ${slugAvailable ? 'text-emerald-600' : 'text-destructive'}`}>
                {slugAvailable ? t('step1.slugAvailable') : t('step1.slugTaken')}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold">{t('step1.categoryLabel')} <span className="text-destructive">*</span></Label>
            <select
              className="w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('category')}
            >
              <option value="">{t('step1.categoryPlaceholder')}</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold">{t('step1.languageLabel')}</Label>
            <select
              className="w-full h-11 px-3 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="font-semibold">
              {t('step1.descriptionLabel')} <span className="text-muted-foreground font-normal">{t('step1.descriptionOptional')}</span>
            </Label>
            <Textarea placeholder={t('step1.descriptionPlaceholder')} rows={3} {...register('description')} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full font-bold"
          disabled={showSlugStatus && !checkingSlug && !slugAvailable}>
          {t('step1.nextButton')} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </div>
  );
}

// ── Step 2 — Theme picker ──────────────────────────────────────────

function Step2({ selected, onSelect, onBack, onNext, t, step }: {
  selected: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  t: TFn;
  step: number;
}) {
  return (
    <div>
      <StepHeader step={step} title={t('step2.title')} subtitle={t('step2.subtitle')} t={t} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none ${
              selected === theme.id
                ? 'border-primary ring-2 ring-primary/20 shadow-md'
                : 'border-border hover:border-primary/50 hover:shadow-sm'
            }`}
          >
            <ThemePreview theme={theme} />
            <div className="p-3 border-t border-border bg-white dark:bg-zinc-950">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">{theme.name}</span>
                {selected === theme.id && (
                  <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{theme.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {theme.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <Button onClick={onNext} className="flex-1 font-bold" size="lg">
          {t('step2.nextButton')} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Theme CSS preview ──────────────────────────────────────────────

function ThemePreview({ theme }: { theme: (typeof THEMES)[0] }) {
  if (theme.id === 'minimal') return (
    <div className="h-40 bg-white p-3 overflow-hidden">
      <div className="max-w-[160px] mx-auto">
        <div className="h-1.5 w-16 bg-gray-200 rounded mx-auto mb-2" />
        <div className="h-3 w-full bg-gray-900 rounded mb-1" />
        <div className="h-2 w-3/4 bg-gray-300 rounded mx-auto mb-3" />
        {[1,2,3].map(i => <div key={i} className="h-1.5 w-full bg-gray-100 rounded mb-1" />)}
        <div className="h-px w-full bg-gray-100 mb-2 mt-1" />
        <div className="h-1.5 w-1/2 bg-gray-200 rounded mx-auto" />
      </div>
    </div>
  );

  if (theme.id === 'magazine') return (
    <div className="h-40 bg-white p-2 overflow-hidden">
      <div className="h-4 flex items-center justify-between mb-1.5 border-b-2 border-red-600 pb-1">
        <div className="h-2.5 w-20 bg-red-600 rounded" />
        <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className="h-1.5 w-6 bg-gray-200 rounded" />)}</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="col-span-2 h-20 bg-gray-100 rounded overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5">
            <div className="h-1.5 w-full bg-white/80 rounded mb-1" />
            <div className="h-1 w-3/4 bg-white/50 rounded" />
          </div>
        </div>
        <div className="space-y-1.5">{[1,2,3].map(i => <div key={i} className="h-6 bg-gray-50 rounded border border-gray-100" />)}</div>
      </div>
    </div>
  );

  if (theme.id === 'business') return (
    <div className="h-40 bg-slate-50 p-2 overflow-hidden">
      <div className="h-6 bg-blue-700 rounded mb-2 flex items-center px-2 gap-2">
        <div className="h-2 w-12 bg-white/80 rounded" />
        <div className="flex gap-1 ml-auto">{[1,2,3].map(i => <div key={i} className="h-1.5 w-6 bg-white/40 rounded" />)}</div>
      </div>
      <div className="h-10 bg-white rounded border border-blue-100 mb-2 flex items-center px-2">
        <div className="space-y-1"><div className="h-2 w-28 bg-gray-800 rounded" /><div className="h-1.5 w-20 bg-gray-300 rounded" /></div>
      </div>
      {[1,2,3].map(i => <div key={i} className="h-5 bg-white rounded border border-gray-100 flex items-center px-2 gap-2 mb-1"><div className="h-3 w-3 rounded bg-blue-100 shrink-0" /><div className="h-1.5 w-full bg-gray-100 rounded" /></div>)}
    </div>
  );

  if (theme.id === 'news') return (
    <div className="h-40 bg-white p-2 overflow-hidden">
      <div className="border-b-2 border-gray-900 pb-1 mb-1.5"><div className="h-3 w-24 bg-gray-900 rounded" /></div>
      <div className="grid grid-cols-3 gap-1 mb-1.5">
        <div className="col-span-2 space-y-1">
          <div className="h-2 w-full bg-gray-800 rounded" /><div className="h-1.5 w-5/6 bg-gray-800 rounded" />
          <div className="h-1 w-full bg-gray-200 rounded" /><div className="h-1 w-4/5 bg-gray-200 rounded" />
        </div>
        <div className="h-14 bg-gray-100 rounded" />
      </div>
      <div className="border-t border-gray-200 pt-1.5 grid grid-cols-2 gap-1.5">
        {[1,2].map(i => <div key={i} className="space-y-1"><div className="h-1.5 w-full bg-gray-700 rounded" /><div className="h-1 w-full bg-gray-200 rounded" /><div className="h-1 w-3/4 bg-gray-200 rounded" /></div>)}
      </div>
    </div>
  );

  if (theme.id === 'portfolio') return (
    <div className="h-40 bg-zinc-50 p-2 overflow-hidden">
      <div className="h-4 flex items-center justify-between mb-2 px-1">
        <div className="h-2 w-16 bg-rose-500 rounded" />
        <div className="flex gap-1">{[1,2,3].map(i => <div key={i} className="h-1.5 w-8 bg-gray-300 rounded" />)}</div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[1,2,3,4].map(i => <div key={i} className={`bg-gray-200 rounded ${i % 2 === 0 ? 'h-14' : 'h-20'}`} />)}
      </div>
    </div>
  );

  // tech
  return (
    <div className="h-40 bg-zinc-950 p-2 overflow-hidden">
      <div className="flex items-center gap-1 mb-2">
        <div className="h-2 w-2 rounded-full bg-red-500" /><div className="h-2 w-2 rounded-full bg-yellow-500" /><div className="h-2 w-2 rounded-full bg-green-500" />
        <div className="h-1.5 w-24 bg-zinc-800 rounded ml-auto" />
      </div>
      <div className="h-1.5 w-full bg-violet-500 rounded mb-2" />
      <div className="space-y-1">
        <div className="h-2 w-3/4 bg-violet-400 rounded" />
        <div className="h-1.5 w-full bg-zinc-700 rounded" /><div className="h-1.5 w-5/6 bg-zinc-700 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {[1,2,3,4].map(i => <div key={i} className="h-7 bg-zinc-900 rounded border border-zinc-800 p-1"><div className="h-1.5 w-full bg-zinc-700 rounded mb-0.5" /><div className="h-1 w-3/4 bg-violet-900 rounded" /></div>)}
      </div>
    </div>
  );
}

// ── Step 3 — Customization ─────────────────────────────────────────

function Step3({ primaryColor, fontFamily, onBack, onSubmit, isPending, t, step }: {
  primaryColor: string;
  fontFamily: string;
  onBack: () => void;
  onSubmit: (data: { primaryColor: string; fontFamily: string }) => void;
  isPending: boolean;
  t: TFn;
  step: number;
}) {
  const [color, setColor] = useState(primaryColor);
  const [font, setFont] = useState(fontFamily);

  return (
    <div>
      <StepHeader step={step} title={t('step3.title')} subtitle={t('step3.subtitle')} t={t} />
      <div className="space-y-8 mt-8">
        <div>
          <Label className="font-semibold text-sm block mb-3">{t('step3.colorLabel')}</Label>
          <div className="flex flex-wrap gap-2.5 mb-3">
            {COLOR_PRESETS.map(({ color: c, label }) => (
              <button
                key={c}
                title={label}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <label className="h-9 w-9 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden relative" title="Custom color">
              <span className="text-xs text-muted-foreground">+</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md" style={{ backgroundColor: color }} />
            <code className="text-xs text-muted-foreground">{color}</code>
          </div>
        </div>

        <div>
          <Label className="font-semibold text-sm block mb-3">{t('step3.fontLabel')}</Label>
          <div className="space-y-2">
            {FONT_OPTIONS.map(({ value, label, sample }) => (
              <button
                key={value}
                onClick={() => setFont(value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  font === value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <div>
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted-foreground ml-2">— {sample}</span>
                </div>
                {font === value && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border overflow-hidden">
          <div className="px-4 py-2 bg-muted text-xs text-muted-foreground font-medium">{t('step3.previewLabel')}</div>
          <div className="p-6 bg-white dark:bg-zinc-900">
            <div className="h-1.5 rounded-full mb-3" style={{ width: 80, backgroundColor: color }} />
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: font }}>{t('step3.previewTitle')}</h3>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>{t('step3.previewBody')}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-5 w-5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-muted-foreground">{t('step3.previewAuthor')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </Button>
        <Button onClick={() => onSubmit({ primaryColor: color, fontFamily: font })} className="flex-1 font-bold" size="lg" disabled={isPending}>
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('step3.creatingButton')}</>
            : <>{t('step3.createButton')} <ArrowRight className="h-4 w-4 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — Success ───────────────────────────────────────────────

function Step4({ blog, locale, theme, t }: {
  blog: { id: string; name: string; slug: string };
  locale: string;
  theme: string;
  t: TFn;
}) {
  const themeInfo = THEMES.find(th => th.id === theme);
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-3xl font-black tracking-tight mb-2">{t('step4.title')} 🎉</h1>
      <p className="text-muted-foreground mb-2">
        <strong>{blog.name}</strong> {t('step4.liveAt')}
      </p>
      <a href={`https://${blog.slug}.nexusblog.io`} target="_blank" rel="noopener noreferrer"
        className="inline-block text-sm text-primary font-medium hover:underline mb-8">
        {blog.slug}.nexusblog.io ↗
      </a>
      <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
        <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4">
          <p className="text-2xl font-black">0</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('step4.stats.articles')}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm font-semibold capitalize">{themeInfo?.name ?? theme}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('step4.stats.theme')}</p>
        </div>
        <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4">
          <p className="text-sm font-semibold">{t('step4.stats.statusValue')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('step4.stats.status')}</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="font-bold">
          <a href={`/${locale}/blogs/${blog.id}/articles/new`}>
            {t('step4.writeFirst')} <ArrowRight className="h-4 w-4 ml-1" />
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={`/${locale}/dashboard`}>{t('step4.dashboard')}</a>
        </Button>
      </div>
    </div>
  );
}

// ── Shared header ──────────────────────────────────────────────────

function StepHeader({ step, title, subtitle, t }: {
  step: number;
  title: string;
  subtitle: string;
  t: TFn;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4 lg:hidden">
        <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-black">N</div>
        <span className="font-extrabold tracking-tight">NexusBlog</span>
        <span className="text-xs text-muted-foreground ml-auto">{t('mobileStep', { step })}</span>
      </div>
      <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>
    </div>
  );
}
