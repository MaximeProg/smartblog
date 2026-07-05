'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import {
  Loader2, ArrowRight, CheckCircle2, Globe, Palette,
  ArrowLeft, ImageIcon, Link2, X, Upload, ExternalLink, Check,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { tenantsApi, mediaApi } from '@/lib/api';
import { slugify } from '@/lib/utils';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import type { TenantInfo } from '@/types';

// ── Template definitions ─────────────────────────────────────────────────────

interface TemplateOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  preview: React.ReactNode;
}

function EditorialPreview() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* bg */}
      <rect width="240" height="160" fill="#ffffff" />
      {/* header */}
      <rect width="240" height="28" fill="#ffffff" />
      <line x1="0" y1="28" x2="240" y2="28" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="96" y="10" width="48" height="8" rx="1" fill="#18181b" />
      <rect x="12" y="12" width="20" height="4" rx="1" fill="#d1d5db" />
      <rect x="36" y="12" width="20" height="4" rx="1" fill="#d1d5db" />
      <rect x="208" y="10" width="20" height="8" rx="4" fill="#18181b" />
      {/* hero */}
      <rect x="40" y="40" width="160" height="6" rx="1" fill="#18181b" />
      <rect x="60" y="52" width="120" height="4" rx="1" fill="#71717a" />
      <rect x="76" y="62" width="88" height="3" rx="1" fill="#a1a1aa" />
      <rect x="100" y="72" width="40" height="10" rx="2" fill="#18181b" />
      {/* divider */}
      <line x1="80" y1="92" x2="160" y2="92" stroke="#e5e7eb" strokeWidth="1" />
      {/* 3 col cards */}
      <rect x="12" y="100" width="64" height="48" rx="2" fill="#f4f4f5" />
      <rect x="88" y="100" width="64" height="48" rx="2" fill="#f4f4f5" />
      <rect x="164" y="100" width="64" height="48" rx="2" fill="#f4f4f5" />
      <rect x="18" y="116" width="40" height="4" rx="1" fill="#3f3f46" />
      <rect x="18" y="124" width="32" height="3" rx="1" fill="#a1a1aa" />
      <rect x="94" y="116" width="40" height="4" rx="1" fill="#3f3f46" />
      <rect x="94" y="124" width="32" height="3" rx="1" fill="#a1a1aa" />
      <rect x="170" y="116" width="40" height="4" rx="1" fill="#3f3f46" />
      <rect x="170" y="124" width="32" height="3" rx="1" fill="#a1a1aa" />
    </svg>
  );
}

function MagazinePreview() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* bg */}
      <rect width="240" height="160" fill="#ffffff" />
      {/* dark header */}
      <rect width="240" height="32" fill="#09090b" />
      <rect x="12" y="12" width="40" height="8" rx="1" fill="#e11d48" />
      <rect x="64" y="14" width="16" height="4" rx="1" fill="#52525b" />
      <rect x="84" y="14" width="16" height="4" rx="1" fill="#52525b" />
      <rect x="104" y="14" width="16" height="4" rx="1" fill="#52525b" />
      <rect x="204" y="11" width="24" height="10" rx="2" fill="#e11d48" />
      {/* hero */}
      <rect x="0" y="32" width="160" height="72" fill="#27272a" />
      <rect x="10" y="58" width="30" height="6" rx="1" fill="#e11d48" />
      <rect x="10" y="68" width="130" height="8" rx="1" fill="#ffffff" />
      <rect x="10" y="80" width="100" height="5" rx="1" fill="#a1a1aa" />
      <rect x="10" y="89" width="70" height="4" rx="1" fill="#71717a" />
      {/* sidebar */}
      <rect x="164" y="32" width="76" height="72" fill="#f4f4f5" />
      <rect x="170" y="40" width="60" height="4" rx="1" fill="#18181b" />
      <rect x="170" y="50" width="48" height="16" rx="1" fill="#e4e4e7" />
      <rect x="170" y="70" width="48" height="16" rx="1" fill="#e4e4e7" />
      <rect x="170" y="90" width="48" height="8" rx="1" fill="#e4e4e7" />
      {/* grid */}
      <rect x="0" y="108" width="77" height="52" fill="#f9f9f9" />
      <rect x="81" y="108" width="77" height="52" fill="#f9f9f9" />
      <rect x="162" y="108" width="78" height="52" fill="#f9f9f9" />
      <rect x="6" y="126" width="50" height="4" rx="1" fill="#3f3f46" />
      <rect x="87" y="126" width="50" height="4" rx="1" fill="#3f3f46" />
      <rect x="168" y="126" width="50" height="4" rx="1" fill="#3f3f46" />
      <rect x="6" y="134" width="36" height="3" rx="1" fill="#a1a1aa" />
      <rect x="87" y="134" width="36" height="3" rx="1" fill="#a1a1aa" />
      <rect x="168" y="134" width="36" height="3" rx="1" fill="#a1a1aa" />
    </svg>
  );
}

function CreativePreview() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* dark bg */}
      <rect width="240" height="160" fill="#09090b" />
      {/* header */}
      <rect width="240" height="28" fill="#09090b" />
      <rect x="12" y="10" width="28" height="8" rx="1" fill="#7c3aed" />
      <rect x="48" y="12" width="18" height="4" rx="1" fill="#3f3f46" />
      <rect x="70" y="12" width="18" height="4" rx="1" fill="#3f3f46" />
      <rect x="92" y="12" width="18" height="4" rx="1" fill="#3f3f46" />
      <line x1="0" y1="28" x2="240" y2="28" stroke="#27272a" strokeWidth="1" />
      {/* masonry grid */}
      <rect x="12" y="36" width="66" height="70" rx="2" fill="#1c1917" />
      <rect x="82" y="36" width="66" height="42" rx="2" fill="#1c1917" />
      <rect x="152" y="36" width="76" height="58" rx="2" fill="#1c1917" />
      <rect x="82" y="82" width="66" height="24" rx="2" fill="#1c1917" />
      <rect x="12" y="110" width="66" height="38" rx="2" fill="#1c1917" />
      <rect x="82" y="110" width="66" height="38" rx="2" fill="#1c1917" />
      <rect x="152" y="98" width="76" height="50" rx="2" fill="#1c1917" />
      {/* accent dots */}
      <circle cx="16" cy="40" r="3" fill="#7c3aed" />
      <circle cx="16" cy="114" r="3" fill="#7c3aed" />
      {/* text overlays */}
      <rect x="18" y="86" width="40" height="4" rx="1" fill="#e4e4e7" />
      <rect x="18" y="94" width="28" height="3" rx="1" fill="#71717a" />
      <rect x="18" y="128" width="40" height="4" rx="1" fill="#e4e4e7" />
    </svg>
  );
}

function LuminaryPreview() {
  return (
    <svg viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* cream bg */}
      <rect width="240" height="160" fill="#faf8f4" />
      {/* header */}
      <rect width="240" height="36" fill="#faf8f4" />
      <line x1="0" y1="36" x2="240" y2="36" stroke="#e7e5e0" strokeWidth="0.5" />
      <rect x="84" y="14" width="72" height="10" rx="1" fill="#1c1917" />
      <rect x="10" y="16" width="14" height="6" rx="1" fill="#d6d3ca" />
      <rect x="28" y="16" width="14" height="6" rx="1" fill="#d6d3ca" />
      <rect x="46" y="16" width="14" height="6" rx="1" fill="#d6d3ca" />
      {/* hero */}
      <rect x="20" y="52" width="200" height="40" rx="1" fill="#f0ede6" />
      <rect x="40" y="58" width="60" height="5" rx="1" fill="#b8960c" />
      <rect x="32" y="66" width="176" height="8" rx="1" fill="#1c1917" />
      <rect x="52" y="78" width="136" height="5" rx="1" fill="#78716c" />
      {/* line */}
      <line x1="60" y1="102" x2="180" y2="102" stroke="#e7e5e0" strokeWidth="0.5" />
      {/* 3 col */}
      <rect x="12" y="110" width="64" height="40" rx="1" fill="#f0ede6" />
      <rect x="88" y="110" width="64" height="40" rx="1" fill="#f0ede6" />
      <rect x="164" y="110" width="64" height="40" rx="1" fill="#f0ede6" />
      <rect x="18" y="128" width="40" height="4" rx="1" fill="#44403c" />
      <rect x="18" y="136" width="28" height="3" rx="1" fill="#a8a29e" />
      <rect x="94" y="128" width="40" height="4" rx="1" fill="#44403c" />
      <rect x="94" y="136" width="28" height="3" rx="1" fill="#a8a29e" />
      <rect x="170" y="128" width="40" height="4" rx="1" fill="#44403c" />
      <rect x="170" y="136" width="28" height="3" rx="1" fill="#a8a29e" />
      {/* gold accent line top */}
      <rect x="0" y="0" width="240" height="3" fill="#b8960c" />
    </svg>
  );
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Clean · Serif · Timeless',
    description: 'Medium / The Atlantic style. Focused reading experience, featured hero, elegant 3-column grid.',
    accent: '#18181b',
    preview: <EditorialPreview />,
  },
  {
    id: 'magazine',
    name: 'Magazine',
    tagline: 'Bold · Dense · Dynamic',
    description: 'The Verge / Wired style. Dark header, layered grid, category sections, newsletter sidebar.',
    accent: '#e11d48',
    preview: <MagazinePreview />,
  },
  {
    id: 'creative',
    name: 'Creative',
    tagline: 'Dark · Visual · Immersive',
    description: 'Cargo Collective style. Full-bleed dark mode, masonry image grid, visual-first layout.',
    accent: '#7c3aed',
    preview: <CreativePreview />,
  },
  {
    id: 'luminary',
    name: 'Luminary',
    tagline: 'Prestige · Serif · Literary',
    description: 'The New Yorker / GQ style. Cream ivory, gold accents, drop caps, premium editorial feel.',
    accent: '#b8960c',
    preview: <LuminaryPreview />,
  },
];

// ── Color presets ─────────────────────────────────────────────────────────────

const COLORS = [
  { hex: '#2563eb', label: 'Blue'   },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#db2777', label: 'Pink'   },
  { hex: '#dc2626', label: 'Red'    },
  { hex: '#ea580c', label: 'Orange' },
  { hex: '#16a34a', label: 'Green'  },
  { hex: '#0891b2', label: 'Cyan'   },
  { hex: '#334155', label: 'Slate'  },
  { hex: '#b8960c', label: 'Gold'   },
  { hex: '#18181b', label: 'Black'  },
];

type CoverTab = 'upload' | 'url';

// ── Page component ────────────────────────────────────────────────────────────

export default function CreateBlogPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user, addTenant, setCurrentTenant } = useAuthStore();
  const t = useTranslations('onboarding');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [slugError, setSlugError] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('editorial');

  const [coverTab, setCoverTab] = useState<CoverTab>('upload');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverFilePreview, setCoverFilePreview] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [coverPreviewError, setCoverPreviewError] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlugManual(true);
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    setSlugError('');
  };

  function applyFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (coverFilePreview) URL.revokeObjectURL(coverFilePreview);
    setCoverFile(file);
    setCoverFilePreview(URL.createObjectURL(file));
    setCoverUrl('');
    setCoverPreviewError(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  }

  function handleUrlConfirm() {
    const url = coverUrlInput.trim();
    if (!url) return;
    setCoverUrl(url);
    setCoverFile(null);
    setCoverFilePreview('');
    setCoverUrlInput('');
    setCoverPreviewError(false);
  }

  function clearCover() {
    if (coverFilePreview) URL.revokeObjectURL(coverFilePreview);
    setCoverFile(null);
    setCoverFilePreview('');
    setCoverUrl('');
    setCoverPreviewError(false);
  }

  const previewSrc = coverFilePreview || coverUrl;
  const hasCover = Boolean(previewSrc) && !coverPreviewError;

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await tenantsApi.create({
        name: name.trim(),
        slug: slug.trim(),
        primary_color: color,
        description: description.trim() || undefined,
        cover_image_url: coverUrl || undefined,
        theme: selectedTheme,
        language: 'en',
        template_config: {},
      } as any);

      if (coverFile) {
        try {
          const upload = await mediaApi.upload(data.id, coverFile);
          await tenantsApi.update(data.id, { cover_image_url: upload.data.cloudinary_secure_url });
        } catch {}
      }

      return data;
    },
    onSuccess: (data) => {
      const tenant: TenantInfo = { id: data.id, name: data.name, slug: data.slug, plan: data.plan, role: 'tenant_admin' };
      addTenant(tenant);
      setCurrentTenant(data.id);
      router.push(`/${locale}/blogs/${data.id}/general`);
    },
    onError: (err: any) => {
      if (err?.response?.data?.detail?.includes('slug')) {
        setSlugError(t('quickSlugTaken'));
      }
    },
  });

  const canSubmit = name.trim().length >= 2 && slug.length >= 3 && !mutation.isPending;
  const activeTemplate = TEMPLATE_OPTIONS.find(t => t.id === selectedTheme)!;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">

            {/* Page header */}
            <div className="mb-8">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('backToDashboard')}
              </Link>
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100">{t('quickTitle')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                {t('quickGreeting', { name: user?.display_name?.split(' ')[0] ?? '' })}
              </p>
            </div>

            {/* ── STEP 1: Template selector ──────────────────────────────────── */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Step 1 — Choose your template
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">Your template is permanent and defines your blog's visual identity.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_OPTIONS.map(tpl => {
                  const isSelected = selectedTheme === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTheme(tpl.id)}
                      className={`relative flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-all focus:outline-none ${
                        isSelected
                          ? 'border-slate-900 dark:border-slate-100 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Preview area */}
                      <div className="relative w-full aspect-[3/2] bg-white overflow-hidden border-b border-slate-100 dark:border-slate-700">
                        {tpl.preview}

                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center shadow">
                            <Check className="h-3.5 w-3.5 text-white dark:text-slate-900" />
                          </div>
                        )}

                        {/* Preview link */}
                        <a
                          href={`/en/preview/${tpl.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-2.5 py-1 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          Preview <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      {/* Info */}
                      <div className="px-3.5 py-3 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tpl.accent }} />
                          <span className="text-[13px] font-black text-slate-900 dark:text-slate-100">{tpl.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium ml-auto">{tpl.tagline}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{tpl.description}</p>
                      </div>

                      {/* Selected top bar */}
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: tpl.accent }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── STEP 2: Blog details ───────────────────────────────────────── */}
            <section>
              <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
                Step 2 — Blog details
              </p>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Color preview banner */}
                <div className="h-1.5 w-full transition-colors" style={{ backgroundColor: color }} />

                <div className="p-8 space-y-6">

                  {/* Blog name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      {t('quickNameLabel')} <span className="text-red-500 normal-case">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder={t('quickNamePlaceholder')}
                      autoFocus
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> {t('quickUrlLabel')} <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                      <span className="flex items-center px-3 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 shrink-0 select-none font-mono">
                        nexusblog.io/
                      </span>
                      <input
                        value={slug}
                        onChange={e => handleSlugChange(e.target.value)}
                        placeholder="my-blog"
                        className="flex-1 h-11 px-3 text-[13px] font-mono bg-transparent outline-none text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    {slugError && <p className="text-[11px] text-red-500 mt-1.5">{slugError}</p>}
                    {slug && !slugError && (
                      <p className="text-[11px] text-slate-400 mt-1.5 font-mono">nexusblog.io/{slug}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      {t('quickDescriptionLabel')} <span className="font-normal normal-case text-slate-400">{t('quickCoverOptional')}</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t('quickDescriptionPlaceholder')}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
                    />
                  </div>

                  {/* Cover image */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" />
                      {t('quickCoverLabel')}
                      <span className="font-normal normal-case text-slate-400">{t('quickCoverOptional')}</span>
                    </label>

                    {hasCover ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group" style={{ paddingBottom: '36%' }}>
                        <img
                          src={previewSrc}
                          alt="Cover"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={() => setCoverPreviewError(true)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <button
                          type="button"
                          onClick={clearCover}
                          className="absolute top-2 right-2 h-7 w-7 rounded-lg bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-3">
                          <button
                            type="button"
                            onClick={() => setCoverTab('upload')}
                            className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors ${
                              coverTab === 'upload'
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Upload className="h-3 w-3" /> Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoverTab('url')}
                            className={`flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-700 ${
                              coverTab === 'url'
                                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Link2 className="h-3 w-3" /> URL
                          </button>
                        </div>

                        {coverTab === 'upload' && (
                          <div>
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} className="sr-only" />
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              onDragOver={e => { e.preventDefault(); setDragging(true); }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={handleDrop}
                              className={`w-full rounded-xl border-2 border-dashed transition-all ${
                                dragging
                                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[0.99]'
                                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              style={{ paddingBottom: '28%', position: 'relative' }}
                            >
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-white dark:bg-slate-700 shadow-sm'}`}>
                                  {dragging
                                    ? <ImageIcon className="h-5 w-5 text-blue-500" />
                                    : <Upload className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                  }
                                </div>
                                <div className="text-center">
                                  <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                                    {dragging ? 'Drop here' : 'Click or drag an image'}
                                  </p>
                                  <p className="text-[10.5px] text-slate-400 mt-0.5">JPG, PNG, WebP — max 10 MB</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        )}

                        {coverTab === 'url' && (
                          <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden px-3">
                              <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <input
                                type="url"
                                value={coverUrlInput}
                                onChange={e => setCoverUrlInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleUrlConfirm(); } }}
                                placeholder={t('quickCoverPlaceholder')}
                                className="flex-1 h-10 text-[12px] font-mono bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleUrlConfirm}
                              disabled={!coverUrlInput.trim()}
                              className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-[11px] font-bold disabled:opacity-40 transition-colors shrink-0"
                            >
                              OK
                            </button>
                          </div>
                        )}

                        {coverPreviewError && (
                          <p className="text-[11px] text-red-500 mt-1.5">{t('quickCoverError')}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Accent color */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Palette className="h-3 w-3" /> {t('quickColorLabel')}
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.label}
                          onClick={() => setColor(c.hex)}
                          className="h-8 w-8 rounded-xl transition-all hover:scale-110 shrink-0"
                          style={{
                            backgroundColor: c.hex,
                            outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent',
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                      <label className="h-8 w-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors shrink-0" title="Custom color">
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
                        <span className="text-slate-400 text-xs font-bold">+</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800" />

                  {/* Summary + Submit */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={!canSubmit}
                      className="flex items-center gap-2 h-11 px-6 rounded-xl text-white font-bold text-[14px] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {mutation.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                        : <>{t('quickCreate')} <ArrowRight className="h-4 w-4" /></>
                      }
                    </button>

                    {/* Template badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: activeTemplate.accent }} />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{activeTemplate.name}</span>
                    </div>

                    <Link
                      href={`/${locale}/dashboard`}
                      className="h-11 px-5 rounded-xl text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center transition-colors"
                    >
                      Cancel
                    </Link>
                  </div>

                  {mutation.isSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" /> {t('quickSuccess')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Info note */}
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl px-4 py-3 flex gap-3">
              <span className="text-amber-500 text-sm shrink-0 mt-px">⚠</span>
              <p className="text-[11.5px] text-amber-700 dark:text-amber-400 leading-relaxed">
                <strong>Template is permanent.</strong> Your template defines the visual structure of your blog and cannot be changed after creation. You can customize colors, fonts, content and all settings in the Studio.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
