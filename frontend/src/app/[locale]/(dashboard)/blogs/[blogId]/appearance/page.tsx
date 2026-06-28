'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Lock, ExternalLink, Save, Loader2, Check } from 'lucide-react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { tenantsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const THEMES = [
  {
    id: 'minimal',
    label: 'Minimal',
    preview: 'bg-white border-2 border-gray-900',
    accent: '#171717',
    font: 'Georgia',
    dots: ['bg-gray-900', 'bg-gray-400', 'bg-gray-200'],
  },
  {
    id: 'magazine',
    label: 'Magazine',
    preview: 'bg-white border-2 border-red-600',
    accent: '#DC2626',
    font: 'Playfair Display',
    dots: ['bg-red-600', 'bg-gray-800', 'bg-gray-200'],
  },
  {
    id: 'business',
    label: 'Business',
    preview: 'bg-white border-2 border-blue-700',
    accent: '#1D4ED8',
    font: 'Inter',
    dots: ['bg-blue-700', 'bg-blue-300', 'bg-gray-100'],
  },
  {
    id: 'news',
    label: 'News',
    preview: 'bg-gray-900 border-2 border-gray-700',
    accent: '#111827',
    font: 'Merriweather',
    dots: ['bg-white', 'bg-gray-400', 'bg-gray-700'],
  },
  {
    id: 'tech',
    label: 'Tech',
    preview: 'bg-gray-950 border-2 border-violet-500',
    accent: '#8B5CF6',
    font: 'JetBrains Mono',
    dots: ['bg-violet-500', 'bg-gray-400', 'bg-gray-800'],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    preview: 'bg-white border-2 border-rose-500',
    accent: '#E11D48',
    font: 'DM Sans',
    dots: ['bg-rose-500', 'bg-gray-200', 'bg-gray-100'],
  },
] as const;

type ThemeId = (typeof THEMES)[number]['id'];

const FONTS = [
  { value: 'Inter',            label: 'Inter — modern sans-serif' },
  { value: 'Georgia',          label: 'Georgia — classic serif' },
  { value: 'Playfair Display', label: 'Playfair Display — editorial' },
  { value: 'Merriweather',     label: 'Merriweather — long-form reading' },
  { value: 'JetBrains Mono',   label: 'JetBrains Mono — technical' },
  { value: 'DM Sans',          label: 'DM Sans — creative' },
  { value: 'Lato',             label: 'Lato — versatile' },
  { value: 'Poppins',          label: 'Poppins — rounded' },
];

export default function AppearancePage() {
  const params = useParams();
  const locale  = params.locale as string;
  const blogId  = params.blogId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('appearance');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: () => tenantsApi.get(blogId).then((r) => r.data),
  });

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('minimal');
  const [primaryColor, setPrimaryColor]   = useState('#1D4ED8');
  const [fontFamily, setFontFamily]       = useState('Inter');

  useEffect(() => {
    if (tenant) {
      setSelectedTheme((tenant.theme as ThemeId) ?? 'minimal');
      setPrimaryColor(tenant.primary_color ?? '#1D4ED8');
      setFontFamily(tenant.font_family ?? 'Inter');
    }
  }, [tenant]);

  const isThemeLocked = (tenant?.articles_count ?? 0) > 0 && tenant?.status === 'active';

  const saveMutation = useMutation({
    mutationFn: () =>
      tenantsApi.update(blogId, {
        theme:         selectedTheme,
        primary_color: primaryColor,
        font_family:   fontFamily,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ variant: 'success', title: t('saved') });
    },
    onError: () => toast({ variant: 'destructive', title: 'Failed to save appearance.' }),
  });

  const isDirty =
    selectedTheme !== tenant?.theme ||
    primaryColor  !== tenant?.primary_color ||
    fontFamily    !== (tenant as any)?.font_family;

  return (
    <DashboardShell
      locale={locale}
      blogId={blogId}
      breadcrumbs={[
        { label: tenant?.name ?? '…' },
        { label: t('title') },
      ]}
      actions={
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          disabled={!isDirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {t('save')}
        </Button>
      }
    >
      <div className="max-w-4xl space-y-10">

        {/* Theme */}
        <section>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{t('themeTitle')}</h2>
              <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{t('themeDesc')}</p>
            </div>
            {isThemeLocked && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                <Lock className="h-3 w-3" />
                {t('lockedBadge')}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                const locked = isThemeLocked && !isSelected;
                const themeDesc = t(`themes.${theme.id}` as any);
                return (
                  <button
                    key={theme.id}
                    onClick={() => !isThemeLocked && setSelectedTheme(theme.id)}
                    disabled={isThemeLocked && !isSelected}
                    className={cn(
                      'relative group rounded-xl border-2 p-0 overflow-hidden text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      isSelected
                        ? 'border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-950/30'
                        : locked
                        ? 'border-slate-100 dark:border-zinc-800 opacity-50 cursor-not-allowed'
                        : 'border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 cursor-pointer hover:shadow-sm'
                    )}
                  >
                    <div className={`h-20 ${theme.preview} relative overflow-hidden`}>
                      <div className="absolute inset-2 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {theme.dots.map((dot, i) => (
                            <div key={i} className={`h-1.5 ${i === 0 ? 'w-8' : i === 1 ? 'w-5' : 'w-3'} rounded-full ${dot}`} />
                          ))}
                        </div>
                        <div className={`h-2 w-3/4 rounded ${theme.dots[0]} opacity-80`} />
                        <div className={`h-1.5 w-full rounded ${theme.dots[2]} opacity-60`} />
                        <div className={`h-1.5 w-5/6 rounded ${theme.dots[2]} opacity-60`} />
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5 bg-white dark:bg-zinc-900">
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-none">
                        {theme.label}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-snug">{themeDesc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isLoading && (
            <div className="mt-3 flex gap-3 flex-wrap">
              {THEMES.map((theme) => (
                <Link
                  key={theme.id}
                  href={`/blog-preview/${theme.id}`}
                  target="_blank"
                  className={cn(
                    'text-[11px] font-medium flex items-center gap-1 transition-colors',
                    selectedTheme === theme.id
                      ? 'text-blue-600 hover:text-blue-700'
                      : 'text-slate-400 hover:text-slate-600'
                  )}
                >
                  {theme.label}
                  <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              ))}
              <span className="text-[11px] text-slate-300">·</span>
              <span className="text-[11px] text-slate-400">{t('preview')}</span>
            </div>
          )}
        </section>

        {/* Primary color */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">{t('colorTitle')}</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">{t('colorDesc')}</p>

          {isLoading ? <Skeleton className="h-10 w-48" /> : (
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v);
                  }}
                  className="w-28 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <div className="h-9 w-9 rounded-lg shadow-sm border border-slate-100" style={{ background: primaryColor }} />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3 flex-wrap">
            {['#1D4ED8','#DC2626','#16A34A','#9333EA','#EA580C','#0891B2','#171717','#E11D48'].map((c) => (
              <button
                key={c}
                onClick={() => setPrimaryColor(c)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all hover:scale-110',
                  primaryColor === c ? 'border-slate-400 scale-110' : 'border-transparent'
                )}
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">{t('fontTitle')}</h2>
          <p className="text-sm text-slate-400 dark:text-zinc-500 mb-4">{t('fontDesc')}</p>

          {isLoading ? <Skeleton className="h-10 w-64" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                    fontFamily === font.value
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700'
                      : 'border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-600'
                  )}
                >
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    fontFamily === font.value ? 'border-blue-500' : 'border-slate-200 dark:border-zinc-600'
                  )}>
                    {fontFamily === font.value && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <span className="text-[13px] text-slate-700 dark:text-slate-200 leading-tight">{font.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Sticky save footer */}
        {isDirty && (
          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-zinc-400">{t('unsavedChanges')}</p>
            <Button
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="gap-1.5"
            >
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {t('saveChanges')}
            </Button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
