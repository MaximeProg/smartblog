'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Loader2, Save, Eye, Monitor, Smartphone,
  Globe, ChevronDown, ChevronRight,
  Twitter, Instagram, Youtube, Linkedin, Github, Facebook,
  Layers, Brush, FileText, Lock, GripVertical, Type,
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  TEMPLATES, EXTENDED_COLOR_PRESETS, HEADING_FONTS, BODY_FONTS,
  DEFAULT_TEMPLATE_CONTENT, DEFAULT_SECTION_ORDER,
  type BlogTemplateConfig, type TemplateDefinition, type TemplateContent,
} from '@/lib/templates';
import { TemplatePreview } from '@/components/templates/TemplatePreview';

type Tab = 'template' | 'content' | 'design';

const SECTION_LABELS: Record<string, string> = {
  hero: 'Section Héro',
  featured: 'Articles à la une',
  categories: 'Catégories',
  latest: 'Derniers articles',
  newsletter: 'Newsletter',
};

function buildDefaultContent(tenant: Record<string, unknown>, themeId: string): TemplateContent {
  const tpl = TEMPLATES.find((t) => t.id === themeId) ?? TEMPLATES[0];
  const stored = (tenant.template_config as Record<string, unknown>)?.content as Partial<TemplateContent> | undefined;
  const blogName = (tenant.name as string) ?? tpl.defaultContent.blogName;
  return { ...tpl.defaultContent, blogName, ...stored };
}

function buildDefaultConfig(tenant: Record<string, unknown>): BlogTemplateConfig {
  const themeId = (tenant.theme as string) ?? 'minimal';
  const base = TEMPLATES.find((t) => t.id === themeId)?.defaultConfig ?? TEMPLATES[0].defaultConfig;
  const stored = tenant.template_config as Partial<BlogTemplateConfig> | undefined;
  return {
    ...base,
    primaryColor: (tenant.primary_color as string) ?? base.primaryColor,
    bodyFont:     (tenant.font_family as string)   ?? base.bodyFont,
    ...stored,
  };
}

export default function AppearancePage() {
  const params = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('appearance');

  const [activeTab, setActiveTab]         = useState<Tab>('design');
  const [config, setConfig]               = useState<BlogTemplateConfig | null>(null);
  const [content, setContent]             = useState<TemplateContent | null>(null);
  const [templateId, setTemplateId]       = useState<string>('minimal');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [openSections, setOpenSections]   = useState<string[]>(['colors', 'typography']);
  const [openContent, setOpenContent]     = useState<string[]>(['identity', 'hero']);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  useEffect(() => {
    if (tenant && !config) {
      const id = (tenant.theme as string) ?? 'minimal';
      setTemplateId(id);
      setConfig(buildDefaultConfig(tenant as unknown as Record<string, unknown>));
      setContent(buildDefaultContent(tenant as unknown as Record<string, unknown>, id));
    }
  }, [tenant, config]);

  const saveMutation = useMutation({
    mutationFn: () =>
      tenantsApi.update(blogId, {
        theme:                templateId,
        primary_color:        config?.primaryColor,
        secondary_color:      config?.secondaryColor,
        font_family:          config?.bodyFont,
        social_links:         config?.social as unknown as Record<string, string>,
        seo_title_template:   config?.seoTitleTemplate,
        seo_meta_description: config?.seoMetaDescription,
        sidebar_config: {
          sidebarEnabled:  config?.sidebarEnabled,
          sidebarPosition: config?.sidebarPosition,
          contentWidth:    config?.contentWidth,
          headerStyle:     config?.headerStyle,
          widgets:         config?.widgets,
        },
        template_config: { ...(config as unknown as Record<string, unknown>), content: content as unknown as Record<string, unknown> },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ variant: 'success', title: t('saved') });
    },
    onError: () => toast({ variant: 'destructive', title: t('saveError') }),
  });

  const update = useCallback((patch: Partial<BlogTemplateConfig>) => {
    setConfig((c) => c ? { ...c, ...patch } : c);
  }, []);

  const updateContent = useCallback((patch: Partial<TemplateContent>) => {
    setContent((c) => c ? { ...c, ...patch } : c);
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  };
  const isOpen = (key: string) => openSections.includes(key);

  if (isLoading || !config) {
    return (
      <DashboardShell locale={locale} blogId={blogId} breadcrumbs={[{ label: '…' }, { label: t('title') }]}>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      </DashboardShell>
    );
  }

  const currentTemplate = TEMPLATES.find((tpl) => tpl.id === templateId) ?? TEMPLATES[0];
  const slug = (tenant as unknown as Record<string, string>)?.slug ?? 'votre-blog';

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[{ label: (tenant as unknown as Record<string, string>)?.name ?? '…' }, { label: t('title') }]}
      noPadding
      actions={
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
          <Button size="sm" className="h-8 text-xs gap-1.5" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('save')}
          </Button>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="shrink-0 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center">
        {/* Template tab (locked) */}
        <button
          onClick={() => setActiveTab('template')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all',
            activeTab === 'template'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          )}
        >
          <Layers className="h-3.5 w-3.5" />{t('tabTemplate')}
          <Lock className="h-3 w-3 text-amber-500 ml-0.5" />
        </button>
        {/* Contenu tab */}
        <button
          onClick={() => setActiveTab('content')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all',
            activeTab === 'content'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          )}
        >
          <FileText className="h-3.5 w-3.5" />Contenu
        </button>
        {/* Design tab */}
        <button
          onClick={() => setActiveTab('design')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all',
            activeTab === 'design'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
          )}
        >
          <Brush className="h-3.5 w-3.5" />{t('tabDesign')}
        </button>
      </div>

      {/* ── TAB: Template (locked) ───────────────────────────────── */}
      {activeTab === 'template' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-5xl">
            {/* Lock banner */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 mb-8">
              <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Template verrouillé</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">Le template ne peut pas être changé une fois le blog créé. Pour utiliser un autre template, créez un nouveau blog.</p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-8">
              <div>
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{t('currentTemplate')}</p>
                <h3 className="font-bold text-slate-900 dark:text-white">{currentTemplate.name}</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{currentTemplate.description}</p>
              </div>
            </div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Autres templates disponibles</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
              {TEMPLATES.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  selected={templateId === tpl.id}
                  locked={tpl.id !== templateId}
                  onSelect={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Contenu ─────────────────────────────────────────── */}
      {activeTab === 'content' && content && (
        <ContentEditor
          content={content}
          onChange={updateContent}
          previewDevice={previewDevice}
          templateId={templateId}
          config={config!}
          openContent={openContent}
          setOpenContent={setOpenContent}
        />
      )}

      {/* ── TAB: Visual editor ───────────────────────────────────── */}
      {activeTab === 'design' && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel — editor, scrollable */}
          <div className="w-80 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">

              <EditorSection title={t('sectionColors')} open={isOpen('colors')} onToggle={() => toggleSection('colors')}>
                <ColorPicker label={t('primaryColor')}   value={config.primaryColor}   onChange={(v) => update({ primaryColor: v })} />
                <ColorPicker label={t('secondaryColor')} value={config.secondaryColor} onChange={(v) => update({ secondaryColor: v })} />
              </EditorSection>

              <EditorSection title={t('sectionTypography')} open={isOpen('typography')} onToggle={() => toggleSection('typography')}>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('headingFont')}</Label>
                  <FontSelector fonts={HEADING_FONTS} value={config.headingFont} onChange={(v) => update({ headingFont: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('bodyFont')}</Label>
                  <FontSelector fonts={BODY_FONTS} value={config.bodyFont} onChange={(v) => update({ bodyFont: v })} />
                </div>
              </EditorSection>

              <EditorSection title={t('sectionLayout')} open={isOpen('layout')} onToggle={() => toggleSection('layout')}>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('contentWidth')}</Label>
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
                        {t(`widths.${w}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleField label={t('sidebarEnabled')} checked={config.sidebarEnabled} onChange={(v) => update({ sidebarEnabled: v })} />
                {config.sidebarEnabled && (
                  <div className="pl-4 flex gap-2">
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
                        {pos === 'left' ? t('left') : t('right')}
                      </button>
                    ))}
                  </div>
                )}
                <ToggleField label={t('stickyHeader')} checked={config.stickyHeader} onChange={(v) => update({ stickyHeader: v })} />
              </EditorSection>

              <EditorSection title={t('sectionSections')} open={isOpen('sections')} onToggle={() => toggleSection('sections')}>
                <ToggleField label={t('heroEnabled')}       checked={config.heroEnabled}              onChange={(v) => update({ heroEnabled: v })} />
                <ToggleField label={t('featuredPosts')}     checked={config.featuredPostsEnabled}     onChange={(v) => update({ featuredPostsEnabled: v })} />
                <ToggleField label={t('categoriesSection')} checked={config.categoriesSectionEnabled} onChange={(v) => update({ categoriesSectionEnabled: v })} />
                <ToggleField label={t('newsletterSection')} checked={config.newsletterSectionEnabled} onChange={(v) => update({ newsletterSectionEnabled: v })} />
              </EditorSection>

              <EditorSection title={t('sectionSocial')} open={isOpen('social')} onToggle={() => toggleSection('social')}>
                {([
                  { key: 'twitter',   Icon: Twitter,   label: 'Twitter / X' },
                  { key: 'instagram', Icon: Instagram, label: 'Instagram' },
                  { key: 'facebook',  Icon: Facebook,  label: 'Facebook' },
                  { key: 'linkedin',  Icon: Linkedin,  label: 'LinkedIn' },
                  { key: 'youtube',   Icon: Youtube,   label: 'YouTube' },
                  { key: 'github',    Icon: Github,    label: 'GitHub' },
                ] as const).map(({ key, Icon, label }) => (
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
              </EditorSection>

              <EditorSection title={t('sectionSEO')} open={isOpen('seo')} onToggle={() => toggleSection('seo')}>
                <div className="space-y-1">
                  <Label className="text-xs">{t('seoTitleTemplate')}</Label>
                  <Input value={config.seoTitleTemplate} onChange={(e) => update({ seoTitleTemplate: e.target.value })} placeholder="{title} — {blog}" className="h-8 text-xs" />
                  <p className="text-[10px] text-slate-400">{t('seoTitleHint')}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('seoMetaDesc')}</Label>
                  <Textarea value={config.seoMetaDescription} onChange={(e) => update({ seoMetaDescription: e.target.value })} placeholder={t('seoMetaPlaceholder')} rows={3} className="text-xs resize-none" />
                </div>
              </EditorSection>

            </div>
          </div>

          {/* Right panel — scrollable live preview */}
          <div className="flex-1 bg-slate-100 dark:bg-zinc-950 flex flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-center gap-2 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 dark:text-zinc-500">{t('livePreview')}</span>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center">
              <div
                className="bg-white shadow-2xl rounded-xl overflow-hidden"
                style={{ width: previewDevice === 'desktop' ? 960 : 375 }}
              >
                {/* Browser chrome */}
                <div className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 flex items-center gap-2 border-b border-slate-200 dark:border-zinc-700">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-zinc-700 rounded-md px-3 py-1 text-[10px] text-slate-400 flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5" />
                    {slug}.nexusblog.io
                  </div>
                </div>
                {/* Zoomable content */}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    zoom: previewDevice === 'desktop' ? 960 / 1200 : 375 / 1200,
                    width: 1200,
                  }}>
                    <TemplatePreview templateId={templateId} config={config} content={content ?? undefined} />
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 text-center py-2">
              <p className="text-[10px] text-slate-400 dark:text-zinc-600">{t('previewNote')}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EditorSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {EXTENDED_COLOR_PRESETS.map(({ color, label: cl }) => (
          <button key={color} title={cl} onClick={() => onChange(color)}
            className={cn('h-6 w-6 rounded-full transition-all hover:scale-110', value === color ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : '')}
            style={{ backgroundColor: color }}
          />
        ))}
        <label className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300 dark:border-zinc-600 flex items-center justify-center cursor-pointer overflow-hidden relative">
          <span className="text-[9px] text-slate-400">+</span>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800 rounded-md px-2.5 py-1.5">
        <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: value }} />
        <code className="text-xs text-slate-500 dark:text-zinc-400 uppercase">{value}</code>
      </div>
    </div>
  );
}

function FontSelector({ fonts, value, onChange }: {
  fonts: Array<{ value: string; label: string; sample: string }>; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      {fonts.map(({ value: v, label, sample }) => (
        <button key={v} onClick={() => onChange(v)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all text-xs',
            value === v ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-200'
          )}
        >
          <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
          <span className="text-slate-400 text-[10px]">{sample}</span>
        </button>
      ))}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-600 dark:text-zinc-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={cn('relative rounded-full transition-colors shrink-0', checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-zinc-700')}
        style={{ height: 18, width: 32 }}
      >
        <div className={cn('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-3.5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function TemplateCard({ template, selected, locked, onSelect }: {
  template: TemplateDefinition; selected: boolean; locked?: boolean; onSelect: () => void;
}) {
  return (
    <div
      onClick={locked ? undefined : onSelect}
      className={cn(
        'relative text-left rounded-2xl border-2 overflow-hidden transition-all',
        selected ? 'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-950/30' : 'border-slate-200 dark:border-zinc-800',
        locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-md'
      )}
    >
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <div style={{ zoom: 0.25, width: 1200, pointerEvents: 'none' }}>
          <TemplatePreview templateId={template.id} config={template.defaultConfig} />
        </div>
        {selected && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Lock className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white/80" />
          </div>
        )}
      </div>
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-xs">{template.name}</h3>
          {selected && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Actuel</span>}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-snug">{template.description}</p>
      </div>
    </div>
  );
}

// ─── Sortable section ─────────────────────────────────────────────────────────
function SortableSection({ id, label, open, onToggle, children }: {
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
        <button
          className="p-3 cursor-grab active:cursor-grabbing touch-none text-slate-300 dark:text-zinc-600 hover:text-slate-500 dark:hover:text-zinc-400"
          {...attributes} {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between px-2 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</span>
          {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-3" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 mr-3" />}
        </button>
      </div>
      {open && <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 dark:border-zinc-800">{children}</div>}
    </div>
  );
}

// ─── Content editor tab ───────────────────────────────────────────────────────
function ContentEditor({
  content, onChange, previewDevice, templateId, config, openContent, setOpenContent,
}: {
  content: TemplateContent;
  onChange: (patch: Partial<TemplateContent>) => void;
  previewDevice: 'desktop' | 'mobile';
  templateId: string;
  config: BlogTemplateConfig;
  openContent: string[];
  setOpenContent: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleOpen = (key: string) =>
    setOpenContent((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  const isOpen = (key: string) => openContent.includes(key);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = content.sectionOrder.indexOf(active.id as string);
      const newIndex = content.sectionOrder.indexOf(over.id as string);
      onChange({ sectionOrder: arrayMove(content.sectionOrder, oldIndex, newIndex) });
    }
  };

  const Field = ({ label, value, onChangeVal, multiline = false }: {
    label: string; value: string; onChangeVal: (v: string) => void; multiline?: boolean;
  }) => (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500 dark:text-zinc-400">{label}</Label>
      {multiline
        ? <Textarea value={value} onChange={(e) => onChangeVal(e.target.value)} rows={2} className="text-xs resize-none" />
        : <Input value={value} onChange={(e) => onChangeVal(e.target.value)} className="h-8 text-xs" />
      }
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — editor */}
      <div className="w-80 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
        <div className="p-4 space-y-3">

          {/* Blog identity */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
            <button
              onClick={() => toggleOpen('identity')}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <Type className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Identité du blog</span>
              {isOpen('identity') ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
            </button>
            {isOpen('identity') && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 dark:border-zinc-800">
                <Field label="Nom du blog" value={content.blogName} onChangeVal={(v) => onChange({ blogName: v })} />
                <Field label="Tagline / Slogan" value={content.tagline} onChangeVal={(v) => onChange({ tagline: v })} multiline />
              </div>
            )}
          </div>

          {/* Sortable sections */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pt-1">Sections (glisser pour réordonner)</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={content.sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {content.sectionOrder.map((sectionId) => (
                  <SortableSection
                    key={sectionId}
                    id={sectionId}
                    label={SECTION_LABELS[sectionId] ?? sectionId}
                    open={isOpen(sectionId)}
                    onToggle={() => toggleOpen(sectionId)}
                  >
                    {sectionId === 'hero' && (
                      <>
                        <Field label="Titre principal" value={content.heroHeadline} onChangeVal={(v) => onChange({ heroHeadline: v })} />
                        <Field label="Sous-titre" value={content.heroSubheadline} onChangeVal={(v) => onChange({ heroSubheadline: v })} multiline />
                        <Field label="Texte du bouton CTA" value={content.heroCta} onChangeVal={(v) => onChange({ heroCta: v })} />
                      </>
                    )}
                    {sectionId === 'featured' && (
                      <Field label="Titre de la section" value={content.featuredSectionTitle} onChangeVal={(v) => onChange({ featuredSectionTitle: v })} />
                    )}
                    {sectionId === 'categories' && (
                      <Field label="Titre de la section" value={content.categoriesSectionTitle} onChangeVal={(v) => onChange({ categoriesSectionTitle: v })} />
                    )}
                    {sectionId === 'latest' && (
                      <Field label="Titre de la section" value={content.latestSectionTitle} onChangeVal={(v) => onChange({ latestSectionTitle: v })} />
                    )}
                    {sectionId === 'newsletter' && (
                      <>
                        <Field label="Titre" value={content.newsletterTitle} onChangeVal={(v) => onChange({ newsletterTitle: v })} />
                        <Field label="Description" value={content.newsletterDescription} onChangeVal={(v) => onChange({ newsletterDescription: v })} multiline />
                        <Field label="Texte du bouton" value={content.newsletterCta} onChangeVal={(v) => onChange({ newsletterCta: v })} />
                      </>
                    )}
                  </SortableSection>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Field label="Pied de page — Tagline" value={content.footerTagline} onChangeVal={(v) => onChange({ footerTagline: v })} />
        </div>
      </div>

      {/* Right — live preview */}
      <div className="flex-1 bg-slate-100 dark:bg-zinc-950 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-center gap-2 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900">
          <Eye className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 dark:text-zinc-500">Aperçu en direct</span>
        </div>
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div className="bg-white shadow-2xl rounded-xl overflow-hidden" style={{ width: previewDevice === 'desktop' ? 960 : 375 }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ zoom: previewDevice === 'desktop' ? 960 / 1200 : 375 / 1200, width: 1200 }}>
                <TemplatePreview templateId={templateId} config={config} content={content} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
