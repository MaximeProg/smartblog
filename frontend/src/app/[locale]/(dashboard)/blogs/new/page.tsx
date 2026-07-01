'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft,
  Check, Globe, Palette, Rocket, Settings2, Upload,
  ChevronDown, ChevronRight, Twitter, Instagram, Youtube,
  Linkedin, Github, Facebook, Eye, Monitor, Smartphone,
  Plus, GripVertical, FileText, Brush,
} from 'lucide-react';

import { tenantsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { slugify, cn } from '@/lib/utils';
import { canCreateBlog, getPlanConfig } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TEMPLATES, BLOG_CATEGORIES, EXTENDED_COLOR_PRESETS, HEADING_FONTS, BODY_FONTS,
  type BlogTemplateConfig, type TemplateDefinition, type TemplateContent,
} from '@/lib/templates';
import { TemplatePreview } from '@/components/templates/TemplatePreview';
import type { TenantInfo } from '@/types';

// ─── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  templateId: string;
  config: BlogTemplateConfig;
  content: TemplateContent;
  name: string;
  slug: string;
  description: string;
  category: string;
  language: string;
}

const STEP_ICONS = [Eye, Settings2, Palette, Rocket];

// ─── Step 2 form schema ───────────────────────────────────────────────────────

const configSchema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().min(4).max(50).regex(/^[a-z0-9][a-z0-9-]{2,48}[a-z0-9]$/),
  description: z.string().max(500).optional(),
  category:    z.string().min(1),
  language:    z.string().min(2),
});
type ConfigValues = z.infer<typeof configSchema>;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewBlogPage() {
  const t       = useTranslations('blogCreate');
  const params  = useParams();
  const locale  = params.locale as string;
  const router  = useRouter();
  const { toast } = useToast();
  const { user, tenants, addTenant, setCurrentTenant } = useAuthStore();

  const plan       = user?.plan ?? 'free';
  const planConfig = getPlanConfig(plan);
  const atLimit    = !canCreateBlog(plan, tenants.length);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdBlog, setCreatedBlog] = useState<{ id: string; name: string; slug: string } | null>(null);

  const defaultTemplate = TEMPLATES[0];

  const [state, setState] = useState<WizardState>({
    templateId: defaultTemplate.id,
    config: { ...defaultTemplate.defaultConfig },
    content: { ...defaultTemplate.defaultContent },
    name: '', slug: '', description: '', category: '', language: 'fr',
  });

  const stepLabels = [
    t('step1.label'),
    t('step2.label'),
    t('step3.label'),
    t('step4.label'),
  ];

  const createMutation = useMutation({
    mutationFn: () => {
      const tpl = TEMPLATES.find((t) => t.id === state.templateId)!;
      return tenantsApi.create({
        name:        state.name,
        slug:        state.slug,
        description: state.description || undefined,
        category:    state.category,
        language:    state.language,
        theme:       state.templateId,
        primary_color:   state.config.primaryColor,
        secondary_color: state.config.secondaryColor,
        font_family:     state.config.bodyFont,
        social_links:    state.config.social as unknown as Record<string, string>,
        seo_title_template: state.config.seoTitleTemplate,
        seo_meta_description: state.config.seoMetaDescription,
        sidebar_config: {
          sidebarEnabled:   state.config.sidebarEnabled,
          sidebarPosition:  state.config.sidebarPosition,
          contentWidth:     state.config.contentWidth,
          headerStyle:      state.config.headerStyle,
          widgets:          state.config.widgets,
        },
        template_config: { ...(state.config as unknown as Record<string, unknown>), content: state.content as unknown as Record<string, unknown> },
      });
    },
    onSuccess: ({ data }) => {
      const tenantInfo: TenantInfo = {
        id: data.id, name: data.name, slug: data.slug,
        plan: data.plan, role: 'tenant_admin',
      };
      addTenant(tenantInfo);
      setCurrentTenant(data.id);
      setCreatedBlog({ id: data.id, name: data.name, slug: data.slug });
      setStep(4);
    },
    onError: () => toast({ variant: 'destructive', title: t('errors.createFailed') }),
  });

  if (atLimit) return <LimitReached locale={locale} plan={planConfig.label} max={planConfig.maxBlogs} t={t} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-900 dark:bg-zinc-900 border-r border-slate-800">
        <div className="px-6 pt-7 pb-5 border-b border-slate-800/60">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-black">N</span>
            </div>
            <span className="text-white font-bold tracking-tight text-sm">NexusBlog</span>
          </Link>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-5 px-2">
            {t('sidebarTitle')}
          </p>
          <div className="space-y-1">
            {stepLabels.map((label, idx) => {
              const n = (idx + 1) as 1 | 2 | 3 | 4;
              const Icon = STEP_ICONS[idx];
              const isDone   = step > n;
              const isActive = step === n;
              return (
                <div
                  key={n}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    isActive ? 'bg-slate-800' : ''
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                    isDone   ? 'bg-emerald-500'
                    : isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 border border-slate-700'
                  )}>
                    {isDone
                      ? <Check className="h-3.5 w-3.5 text-white" />
                      : <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-slate-600')} />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm font-medium leading-tight',
                      isActive ? 'text-white' : isDone ? 'text-slate-400' : 'text-slate-600'
                    )}>{label}</p>
                    {isActive && <p className="text-[10px] text-blue-400 mt-0.5">{t('inProgress')}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-300 truncate">{user?.email}</p>
              <p className="text-[10px] text-blue-400 font-medium">{planConfig.label}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto">

        {/* Mobile header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 lg:hidden bg-white dark:bg-zinc-900">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="font-bold text-sm">NexusBlog</span>
          </Link>
          <span className="text-xs text-slate-400">{t('mobileStep', { step })}</span>
        </div>

        {step === 1 && (
          <Step1Gallery
            selectedId={state.templateId}
            onSelect={(id) => {
              const tpl = TEMPLATES.find((t) => t.id === id)!;
              setState((s) => ({ ...s, templateId: id, config: { ...tpl.defaultConfig }, content: { ...tpl.defaultContent, blogName: s.name || tpl.defaultContent.blogName } }));
            }}
            onNext={() => setStep(2)}
            locale={locale}
            t={t}
          />
        )}

        {step === 2 && (
          <Step2Config
            initial={{ name: state.name, slug: state.slug, description: state.description, category: state.category, language: state.language }}
            templateName={TEMPLATES.find((t) => t.id === state.templateId)?.name ?? state.templateId}
            onBack={() => setStep(1)}
            onNext={(vals) => {
              setState((s) => ({ ...s, ...vals, content: { ...s.content, blogName: vals.name } }));
              setStep(3);
            }}
            t={t}
          />
        )}

        {step === 3 && (
          <Step3Editor
            blogName={state.name}
            templateId={state.templateId}
            config={state.config}
            content={state.content}
            onChange={(config) => setState((s) => ({ ...s, config }))}
            onContentChange={(content) => setState((s) => ({ ...s, content }))}
            onBack={() => setStep(2)}
            onPublish={() => createMutation.mutate()}
            isPending={createMutation.isPending}
            t={t}
          />
        )}

        {step === 4 && createdBlog && (
          <Step4Success blog={createdBlog} locale={locale} templateId={state.templateId} t={t} />
        )}
      </main>
    </div>
  );
}

// ─── Limit reached ────────────────────────────────────────────────────────────

function LimitReached({ locale, plan, max, t }: { locale: string; plan: string; max: number; t: ReturnType<typeof useTranslations<'blogCreate'>> }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>{t('limit.title')}</CardTitle>
          <CardDescription>{t('limit.desc', { plan, max: max === 1 ? '1 blog' : `${max} blogs` })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild><Link href={`/${locale}/subscription`}>{t('limit.viewPlans')}</Link></Button>
          <Button variant="outline" asChild><Link href={`/${locale}/dashboard`}>{t('limit.back')}</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Template Gallery
// ─────────────────────────────────────────────────────────────────────────────

function Step1Gallery({
  selectedId, onSelect, onNext, locale, t,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations<'blogCreate'>>;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 lg:px-10 py-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('step1.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{t('step1.subtitle')}</p>
      </div>

      {/* Gallery */}
      <div className="flex-1 px-6 lg:px-10 py-8 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 max-w-6xl">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedId === template.id}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-6 lg:px-10 py-4 flex items-center justify-between">
        <Link
          href={`/${locale}/dashboard`}
          className="text-sm text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          ← {t('backToDashboard')}
        </Link>
        <Button onClick={onNext} disabled={!selectedId} className="gap-2">
          {t('step1.next')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TemplateCard({ template, selected, onSelect }: {
  template: TemplateDefinition;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative text-left rounded-2xl border-2 overflow-hidden transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-950/30'
          : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-md'
      )}
    >
      {/* Visual preview */}
      <div className="overflow-hidden relative" style={{ height: 220 }}>
        <div style={{ zoom: 0.27, width: 1200, pointerEvents: 'none' }}>
          <TemplatePreview templateId={template.id} config={template.defaultConfig} content={template.defaultContent} />
        </div>
        {selected && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Check className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{template.name}</h3>
          <span className="shrink-0 text-[10px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
            {template.category}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{template.description}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 rounded px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-zinc-700 flex items-center justify-center">
            {selected && <div className="h-2 w-2 rounded-full bg-blue-500" />}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            {selected ? 'Sélectionné' : 'Sélectionner'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Blog Configuration
// ─────────────────────────────────────────────────────────────────────────────

function Step2Config({ initial, templateName, onBack, onNext, t }: {
  initial: Partial<ConfigValues & { description: string }>;
  templateName: string;
  onBack: () => void;
  onNext: (vals: ConfigValues) => void;
  t: ReturnType<typeof useTranslations<'blogCreate'>>;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<ConfigValues>({ resolver: zodResolver(configSchema), defaultValues: initial });

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
    <div className="flex-1 flex flex-col">
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 lg:px-10 py-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('step2.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          {t('step2.subtitle')} — <span className="font-medium text-slate-700 dark:text-slate-300">{templateName}</span>
        </p>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-8 overflow-auto">
        <form id="step2-form" onSubmit={handleSubmit(onNext)} className="max-w-xl space-y-6">

          {/* Blog name */}
          <div className="space-y-1.5">
            <Label>{t('step2.nameLabel')} <span className="text-red-500">*</span></Label>
            <Input placeholder={t('step2.namePlaceholder')} {...register('name')} autoFocus className="h-11" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label>{t('step2.slugLabel')} <span className="text-red-500">*</span></Label>
            <div className="flex rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <span className="flex items-center px-3.5 text-sm text-slate-400 bg-slate-50 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-700 shrink-0 select-none">
                nexusblog.io/
              </span>
              <div className="flex-1 relative">
                <input
                  placeholder={t('step2.slugPlaceholder')}
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
              ? <p className={cn('text-xs font-medium', slugAvailable ? 'text-emerald-600' : 'text-red-500')}>
                  {slugAvailable ? t('step2.slugAvailable') : t('step2.slugTaken')}
                </p>
              : null}
          </div>

          {/* Category + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('step2.categoryLabel')} <span className="text-red-500">*</span></Label>
              <select
                className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('category')}
              >
                <option value="">{t('step2.categoryPlaceholder')}</option>
                {BLOG_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('step2.languageLabel')}</Label>
              <select
                className="w-full h-11 px-3 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <Label>
              {t('step2.descriptionLabel')}{' '}
              <span className="text-slate-400 font-normal text-xs">{t('step2.descriptionOptional')}</span>
            </Label>
            <Textarea
              placeholder={t('step2.descriptionPlaceholder')}
              rows={3}
              className="resize-none"
              {...register('description')}
            />
          </div>

        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-6 lg:px-10 py-4 flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Button>
        <Button
          type="submit"
          form="step2-form"
          className="gap-2"
          disabled={showSlugStatus && !checkingSlug && !slugAvailable}
        >
          {t('step2.next')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Visual Editor
// ─────────────────────────────────────────────────────────────────────────────

const WIZARD_SECTION_LABELS: Record<string, string> = {
  hero: 'Section Héro',
  featured: 'À la une',
  categories: 'Catégories',
  latest: 'Derniers articles',
  newsletter: 'Newsletter',
};

function Step3Editor({ blogName, templateId, config, content, onChange, onContentChange, onBack, onPublish, isPending, t }: {
  blogName: string;
  templateId: string;
  config: BlogTemplateConfig;
  content: TemplateContent;
  onChange: (config: BlogTemplateConfig) => void;
  onContentChange: (content: TemplateContent) => void;
  onBack: () => void;
  onPublish: () => void;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<'blogCreate'>>;
}) {
  const [openSections, setOpenSections] = useState<string[]>(['identity', 'colors']);
  const [leftTab, setLeftTab]           = useState<'design' | 'content'>('design');
  const [openContent, setOpenContent]   = useState<string[]>(['hero']);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const update = useCallback((patch: Partial<BlogTemplateConfig>) => {
    onChange({ ...config, ...patch });
  }, [config, onChange]);

  const updateContent = useCallback((patch: Partial<TemplateContent>) => {
    onContentChange({ ...content, ...patch });
  }, [content, onContentChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = content.sectionOrder.indexOf(active.id as string);
      const newIdx = content.sectionOrder.indexOf(over.id as string);
      onContentChange({ ...content, sectionOrder: arrayMove(content.sectionOrder, oldIdx, newIdx) });
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  };

  const toggleContent = (key: string) => {
    setOpenContent((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  };

  const isOpen = (key: string) => openSections.includes(key);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">{t('step3.title')}</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{t('step3.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn('p-1.5 rounded-md transition-all', previewDevice === 'desktop' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-slate-400')}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn('p-1.5 rounded-md transition-all', previewDevice === 'mobile' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-slate-400')}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 h-8 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('back')}
          </Button>
          <Button size="sm" onClick={onPublish} disabled={isPending} className="gap-1.5 h-8 text-xs">
            {isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('step3.publishing')}</>
              : <><Rocket className="h-3.5 w-3.5" /> {t('step3.publish')}</>
            }
          </Button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left panel — Config */}
        <div className="w-80 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Sub-tab bar */}
          <div className="shrink-0 flex border-b border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setLeftTab('design')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all', leftTab === 'design' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600')}
            >
              <Brush className="h-3 w-3" />Design
            </button>
            <button
              onClick={() => setLeftTab('content')}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all', leftTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600')}
            >
              <FileText className="h-3 w-3" />Contenu
            </button>
          </div>

          {/* Design panel */}
          {leftTab === 'design' && (
          <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">

            {/* Identité */}
            <EditorSection title={t('step3.sections.identity')} open={isOpen('identity')} onToggle={() => toggleSection('identity')}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.blogName')}</Label>
                  <Input
                    value={blogName}
                    readOnly
                    className="h-8 text-xs bg-slate-50 dark:bg-zinc-800"
                  />
                  <p className="text-[10px] text-slate-400">{t('step3.fields.blogNameHint')}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.logo')}</Label>
                  <button className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                    <Upload className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400">{t('step3.fields.uploadLogo')}</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.favicon')}</Label>
                  <button className="w-full h-12 border-2 border-dashed border-slate-200 dark:border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                    <Plus className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400">{t('step3.fields.uploadFavicon')}</span>
                  </button>
                </div>
              </div>
            </EditorSection>

            {/* Couleurs */}
            <EditorSection title={t('step3.sections.colors')} open={isOpen('colors')} onToggle={() => toggleSection('colors')}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.primaryColor')}</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {EXTENDED_COLOR_PRESETS.map(({ color, label }) => (
                      <button
                        key={color}
                        title={label}
                        onClick={() => update({ primaryColor: color })}
                        className={cn(
                          'h-6 w-6 rounded-full transition-all hover:scale-110',
                          config.primaryColor === color ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label
                      className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer overflow-hidden relative hover:border-slate-400 transition-colors"
                      title="Couleur personnalisée"
                    >
                      <span className="text-[9px] text-slate-400">+</span>
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => update({ primaryColor: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-md px-2.5 py-1.5">
                    <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: config.primaryColor }} />
                    <code className="text-xs text-slate-500 dark:text-zinc-400 uppercase">{config.primaryColor}</code>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.secondaryColor')}</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {EXTENDED_COLOR_PRESETS.map(({ color, label }) => (
                      <button
                        key={color}
                        title={label}
                        onClick={() => update({ secondaryColor: color })}
                        className={cn(
                          'h-6 w-6 rounded-full transition-all hover:scale-110',
                          config.secondaryColor === color ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </EditorSection>

            {/* Typographie */}
            <EditorSection title={t('step3.sections.typography')} open={isOpen('typography')} onToggle={() => toggleSection('typography')}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.headingFont')}</Label>
                  <div className="space-y-1">
                    {HEADING_FONTS.map(({ value, label, sample }) => (
                      <button
                        key={value}
                        onClick={() => update({ headingFont: value })}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all text-xs',
                          config.headingFont === value
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-200'
                        )}
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                        <span className="text-slate-400 text-[10px]">{sample}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.bodyFont')}</Label>
                  <div className="space-y-1">
                    {BODY_FONTS.map(({ value, label, sample }) => (
                      <button
                        key={value}
                        onClick={() => update({ bodyFont: value })}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all text-xs',
                          config.bodyFont === value
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-200'
                        )}
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                        <span className="text-slate-400 text-[10px]">{sample}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </EditorSection>

            {/* Mise en page */}
            <EditorSection title={t('step3.sections.layout')} open={isOpen('layout')} onToggle={() => toggleSection('layout')}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.contentWidth')}</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['narrow', 'standard', 'wide', 'full'] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => update({ contentWidth: w })}
                        className={cn(
                          'px-2 py-1.5 rounded-lg border text-xs font-medium transition-all',
                          config.contentWidth === w
                            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                        )}
                      >
                        {t(`step3.widths.${w}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <ToggleField
                    label={t('step3.fields.sidebarEnabled')}
                    checked={config.sidebarEnabled}
                    onChange={(v) => update({ sidebarEnabled: v })}
                  />
                  {config.sidebarEnabled && (
                    <div className="pl-4 space-y-1.5">
                      <Label className="text-xs text-slate-500">{t('step3.fields.sidebarPosition')}</Label>
                      <div className="flex gap-2">
                        {(['left', 'right'] as const).map((pos) => (
                          <button
                            key={pos}
                            onClick={() => update({ sidebarPosition: pos })}
                            className={cn(
                              'flex-1 py-1 rounded-md border text-xs font-medium transition-all',
                              config.sidebarPosition === pos
                                ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30'
                                : 'border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'
                            )}
                          >
                            {pos === 'left' ? t('step3.fields.left') : t('step3.fields.right')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <ToggleField
                    label={t('step3.fields.stickyHeader')}
                    checked={config.stickyHeader}
                    onChange={(v) => update({ stickyHeader: v })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t('step3.fields.headerStyle')}</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['minimal', 'classic', 'magazine', 'centered'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ headerStyle: s })}
                        className={cn(
                          'px-2 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize',
                          config.headerStyle === s
                            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-zinc-700 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        {t(`step3.headerStyles.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </EditorSection>

            {/* Sections */}
            <EditorSection title={t('step3.sections.sections')} open={isOpen('sections')} onToggle={() => toggleSection('sections')}>
              <div className="space-y-2">
                <ToggleField label={t('step3.fields.heroEnabled')} checked={config.heroEnabled} onChange={(v) => update({ heroEnabled: v })} />
                {config.heroEnabled && (
                  <div className="pl-4">
                    <div className="grid grid-cols-3 gap-1">
                      {(['full-image', 'compact', 'text-only'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => update({ heroStyle: s })}
                          className={cn(
                            'py-1 rounded border text-[10px] font-medium transition-all',
                            config.heroStyle === s
                              ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-zinc-700 text-slate-500 hover:border-slate-300'
                          )}
                        >
                          {t(`step3.heroStyles.${s.replace('-', '_')}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <ToggleField label={t('step3.fields.featuredPosts')} checked={config.featuredPostsEnabled} onChange={(v) => update({ featuredPostsEnabled: v })} />
                <ToggleField label={t('step3.fields.categories')} checked={config.categoriesSectionEnabled} onChange={(v) => update({ categoriesSectionEnabled: v })} />
                <ToggleField label={t('step3.fields.newsletter')} checked={config.newsletterSectionEnabled} onChange={(v) => update({ newsletterSectionEnabled: v })} />
              </div>
            </EditorSection>

            {/* Réseaux sociaux */}
            <EditorSection title={t('step3.sections.social')} open={isOpen('social')} onToggle={() => toggleSection('social')}>
              <div className="space-y-2">
                {(
                  [
                    { key: 'twitter',   Icon: Twitter,   label: 'Twitter / X' },
                    { key: 'instagram', Icon: Instagram, label: 'Instagram' },
                    { key: 'facebook',  Icon: Facebook,  label: 'Facebook' },
                    { key: 'linkedin',  Icon: Linkedin,  label: 'LinkedIn' },
                    { key: 'youtube',   Icon: Youtube,   label: 'YouTube' },
                    { key: 'github',    Icon: Github,    label: 'GitHub' },
                  ] as const
                ).map(({ key, Icon, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <Input
                      value={(config.social as unknown as Record<string, string>)[key] ?? ''}
                      onChange={(e) => update({ social: { ...config.social, [key]: e.target.value } })}
                      placeholder={label}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            </EditorSection>

            {/* SEO */}
            <EditorSection title={t('step3.sections.seo')} open={isOpen('seo')} onToggle={() => toggleSection('seo')}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('step3.fields.seoTitleTemplate')}</Label>
                  <Input
                    value={config.seoTitleTemplate}
                    onChange={(e) => update({ seoTitleTemplate: e.target.value })}
                    placeholder="{title} — {blog}"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-slate-400">{t('step3.fields.seoTitleHint')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('step3.fields.seoDescription')}</Label>
                  <Textarea
                    value={config.seoMetaDescription}
                    onChange={(e) => update({ seoMetaDescription: e.target.value })}
                    placeholder={t('step3.fields.seoDescriptionPlaceholder')}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            </EditorSection>

          </div>
          </div>
          )}

          {/* Contenu panel */}
          {leftTab === 'content' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-2">
              {/* Blog identity */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
                <button onClick={() => toggleContent('identity')} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
                  <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Identité</span>
                  {openContent.includes('identity') ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                </button>
                {openContent.includes('identity') && (
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="space-y-1"><Label className="text-xs">Nom du blog</Label><Input value={content.blogName} onChange={(e) => updateContent({ blogName: e.target.value })} className="h-8 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Tagline</Label><Textarea value={content.tagline} onChange={(e) => updateContent({ tagline: e.target.value })} rows={2} className="text-xs resize-none" /></div>
                  </div>
                )}
              </div>
              {/* Sections drag-and-drop */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pt-1">Sections — glisser pour réordonner</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={content.sectionOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {content.sectionOrder.map((sid) => (
                      <WizardSortableSection key={sid} id={sid} label={WIZARD_SECTION_LABELS[sid] ?? sid} open={openContent.includes(sid)} onToggle={() => toggleContent(sid)}>
                        {sid === 'hero' && (<>
                          <div className="space-y-1"><Label className="text-xs">Titre</Label><Input value={content.heroHeadline} onChange={(e) => updateContent({ heroHeadline: e.target.value })} className="h-7 text-xs" /></div>
                          <div className="space-y-1"><Label className="text-xs">Sous-titre</Label><Textarea value={content.heroSubheadline} onChange={(e) => updateContent({ heroSubheadline: e.target.value })} rows={2} className="text-xs resize-none" /></div>
                          <div className="space-y-1"><Label className="text-xs">Bouton CTA</Label><Input value={content.heroCta} onChange={(e) => updateContent({ heroCta: e.target.value })} className="h-7 text-xs" /></div>
                        </>)}
                        {sid === 'featured' && <div className="space-y-1"><Label className="text-xs">Titre section</Label><Input value={content.featuredSectionTitle} onChange={(e) => updateContent({ featuredSectionTitle: e.target.value })} className="h-7 text-xs" /></div>}
                        {sid === 'categories' && <div className="space-y-1"><Label className="text-xs">Titre section</Label><Input value={content.categoriesSectionTitle} onChange={(e) => updateContent({ categoriesSectionTitle: e.target.value })} className="h-7 text-xs" /></div>}
                        {sid === 'latest' && <div className="space-y-1"><Label className="text-xs">Titre section</Label><Input value={content.latestSectionTitle} onChange={(e) => updateContent({ latestSectionTitle: e.target.value })} className="h-7 text-xs" /></div>}
                        {sid === 'newsletter' && (<>
                          <div className="space-y-1"><Label className="text-xs">Titre</Label><Input value={content.newsletterTitle} onChange={(e) => updateContent({ newsletterTitle: e.target.value })} className="h-7 text-xs" /></div>
                          <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea value={content.newsletterDescription} onChange={(e) => updateContent({ newsletterDescription: e.target.value })} rows={2} className="text-xs resize-none" /></div>
                          <div className="space-y-1"><Label className="text-xs">Bouton</Label><Input value={content.newsletterCta} onChange={(e) => updateContent({ newsletterCta: e.target.value })} className="h-7 text-xs" /></div>
                        </>)}
                      </WizardSortableSection>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="space-y-1 pt-1"><Label className="text-xs">Footer — tagline</Label><Input value={content.footerTagline} onChange={(e) => updateContent({ footerTagline: e.target.value })} className="h-7 text-xs" /></div>
            </div>
          </div>
          )}
        </div>

        {/* Right panel — Live Preview */}
        <div className="flex-1 bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-start p-6 overflow-auto">
          <div className="text-xs text-slate-400 dark:text-zinc-500 mb-4 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {t('step3.previewLabel')}
          </div>

          {/* Browser chrome */}
          <div className={cn(
            'bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-zinc-800 transition-all',
            previewDevice === 'desktop' ? 'w-full max-w-4xl' : 'w-80'
          )}>
            {/* Tab bar */}
            <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-700">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white dark:bg-zinc-700 rounded-md px-3 py-1 text-[10px] text-slate-400 dark:text-zinc-400 flex items-center gap-1">
                <Globe className="h-2.5 w-2.5" />
                nexusblog.io/votre-blog
              </div>
            </div>

            {/* Scrollable scaled template preview */}
            <div className="overflow-auto" style={{ maxHeight: previewDevice === 'desktop' ? 520 : 640 }}>
              <div style={{
                zoom: previewDevice === 'desktop' ? 960 / 1200 : 375 / 1200,
                width: 1200,
              }}>
                <TemplatePreview templateId={templateId} config={config} content={content} />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-zinc-600 mt-4 text-center">{t('step3.previewNote')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Editor Section accordion ─────────────────────────────────────────────────

function EditorSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Toggle field ─────────────────────────────────────────────────────────────

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600 dark:text-zinc-400">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-4.5 w-8 rounded-full transition-colors shrink-0',
          checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-zinc-700'
        )}
        style={{ height: 18, width: 32 }}
      >
        <div className={cn(
          'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-3.5' : 'translate-x-0.5'
        )} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wizard sortable section (drag-and-drop in Step3 Contenu panel)
// ─────────────────────────────────────────────────────────────────────────────

function WizardSortableSection({ id, label, open, onToggle, children }: {
  id: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900"
    >
      <div className="flex items-center">
        <button className="p-2 cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-500" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center justify-between pr-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
          {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
        </button>
      </div>
      {open && <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100 dark:border-zinc-800">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Success
// ─────────────────────────────────────────────────────────────────────────────

function Step4Success({ blog, locale, templateId, t }: {
  blog: { id: string; name: string; slug: string };
  locale: string;
  templateId: string;
  t: ReturnType<typeof useTranslations<'blogCreate'>>;
}) {
  const template = TEMPLATES.find((t) => t.id === templateId);
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center mb-6 shadow-xl shadow-emerald-200 dark:shadow-emerald-950/40">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          {t('step4.title')} 🎉
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{blog.name}</span> {t('step4.liveAt')}
        </p>
        <a
          href={`https://${blog.slug}.nexusblog.io`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline mb-8"
        >
          <Globe className="h-3.5 w-3.5" />
          {blog.slug}.nexusblog.io
        </a>

        <div className="grid grid-cols-3 gap-3 mb-8 text-left">
          {[
            { value: '0', label: t('step4.stats.articles') },
            { value: template?.name ?? templateId, label: t('step4.stats.template') },
            { value: t('step4.stats.statusValue'), label: t('step4.stats.status') },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4">
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 h-11 font-semibold">
            <Link href={`/${locale}/blogs/${blog.id}/articles/new`}>
              {t('step4.writeFirst')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 h-11">
            <Link href={`/${locale}/blogs/${blog.id}/overview`}>
              {t('step4.goToDashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

