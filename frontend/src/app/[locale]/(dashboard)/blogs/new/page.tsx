'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Loader2, ArrowRight, CheckCircle2, Globe, Palette,
  ArrowLeft, ImageIcon, Link2, X, Upload, ExternalLink, Check,
  Search, ShoppingCart, SkipForward,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import {
  tenantsApi, mediaApi, domainsApi, paymentsApi,
  type DomainSearchResult, type CryptoPaymentResponse,
} from '@/lib/api';
import { slugify, getErrorMessage } from '@/lib/utils';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { useToast } from '@/hooks/use-toast';
import type { TenantInfo } from '@/types';

// ── Template definitions ─────────────────────────────────────────────────────

interface TemplateOption {
  id: string;
  name: string; // Nom propre du thème — jamais traduit (comme "Studio")
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
  { id: 'editorial', name: 'Editorial', accent: '#18181b', preview: <EditorialPreview /> },
  { id: 'magazine',  name: 'Magazine',  accent: '#e11d48', preview: <MagazinePreview /> },
  { id: 'creative',  name: 'Creative',  accent: '#7c3aed', preview: <CreativePreview /> },
  { id: 'luminary',  name: 'Luminary',  accent: '#b8960c', preview: <LuminaryPreview /> },
];

// ── Color presets ─────────────────────────────────────────────────────────────
// `key` résout le nom traduit via t(`colors.${key}`) — voir usage plus bas.

const COLORS = [
  { hex: '#2563eb', key: 'blue'   },
  { hex: '#7c3aed', key: 'violet' },
  { hex: '#db2777', key: 'pink'   },
  { hex: '#dc2626', key: 'red'    },
  { hex: '#ea580c', key: 'orange' },
  { hex: '#16a34a', key: 'green'  },
  { hex: '#0891b2', key: 'cyan'   },
  { hex: '#334155', key: 'slate'  },
  { hex: '#b8960c', key: 'gold'   },
  { hex: '#18181b', key: 'black'  },
];

type CoverTab = 'upload' | 'url';

// ── Page component ────────────────────────────────────────────────────────────

export default function CreateBlogPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user, addTenant, setCurrentTenant } = useAuthStore();
  const t = useTranslations('onboarding');
  const td = useTranslations('domains');
  const ts = useTranslations('studio');
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [slugError, setSlugError] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('editorial');

  // ── Domain step (shown after the blog itself is created) ──────────────────
  const [step, setStep] = useState<'form' | 'domain'>('form');
  const [createdTenant, setCreatedTenant] = useState<TenantInfo | null>(null);
  const [domainChoice, setDomainChoice] = useState<'buy' | 'connect' | null>(null);
  const [domainQuery, setDomainQuery] = useState('');
  const [domainSubmitted, setDomainSubmitted] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [existingDomain, setExistingDomain] = useState('');
  const [payment, setPayment] = useState<CryptoPaymentResponse | null>(null);
  const [registrant, setRegistrant] = useState({
    name: '', email: user?.email ?? '', phone: '', address: '', city: '', country: '', zipcode: '',
  });
  const [registrantYears, setRegistrantYears] = useState(1);
  const [registrantAutoRenew, setRegistrantAutoRenew] = useState(false);

  const { data: domainSearchResults = [], isFetching: searchingDomains } = useQuery({
    queryKey: ['new-blog-domain-search', createdTenant?.id, domainSubmitted],
    queryFn: async () => { const { data } = await domainsApi.search(createdTenant!.id, domainSubmitted); return data; },
    enabled: !!createdTenant && !!domainSubmitted,
  });

  const purchaseMut = useMutation({
    mutationFn: () => paymentsApi.createDomainCheckout(createdTenant!.id, {
      domain_name: selectedDomain!.domain,
      years: registrantYears,
      auto_renew: registrantAutoRenew,
      registrant,
    }).then(r => r.data),
    onSuccess: (data) => setPayment(data),
  });

  const connectMut = useMutation({
    mutationFn: () => domainsApi.add(createdTenant!.id, existingDomain.trim()),
    onSuccess: () => goToStudio(),
  });

  function goToStudio() {
    if (!createdTenant) return;
    router.push(`/${locale}/blogs/${createdTenant.id}/general`);
  }

  function handlePaymentConfirmed() {
    setPayment(null);
    goToStudio();
  }

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

  const [formError, setFormError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      setSlugError('');
      const { data } = await tenantsApi.create({
        name: name.trim(),
        slug: slug.trim(),
        primary_color: color,
        description: description.trim() || undefined,
        cover_image_url: coverUrl || undefined,
        theme: selectedTheme,
        language: locale,
        template_config: {},
      } as any);

      if (coverFile) {
        try {
          const upload = await mediaApi.upload(data.id, coverFile);
          await tenantsApi.update(data.id, { cover_image_url: upload.data.cloudinary_secure_url });
        } catch {
          toast({ variant: 'destructive', title: t('quickCoverUploadError') });
        }
      }

      return data;
    },
    onSuccess: (data) => {
      const tenant: TenantInfo = { id: data.id, name: data.name, slug: data.slug, plan: data.plan, role: 'TENANT_ADMIN' };
      addTenant(tenant);
      setCurrentTenant(data.id);
      setCreatedTenant(tenant);
      setStep('domain');
    },
    onError: (err: any) => {
      // Les codes d'erreur stables (slug pris, champ invalide) gardent un
      // message dédié affiché sous le bon champ ; pour tout le reste
      // (ex: PLAN_LIMIT_REACHED), on affiche le vrai message backend — les
      // messages backend sont désormais en anglais (plus de raison de s'en
      // méfier comme avant), voir getErrorMessage().
      const errorCode: string | undefined = err?.response?.data?.error;
      const details: any[] = err?.response?.data?.details ?? [];
      const hasFieldError = (field: string) =>
        details.some((d) => Array.isArray(d?.loc) && d.loc.includes(field));

      let slugMsg = '';
      let generalMsg = getErrorMessage(err, t('quickGenericError'));

      if (errorCode === 'SLUG_ALREADY_EXISTS') {
        slugMsg = t('quickSlugTaken');
        generalMsg = slugMsg;
      } else if (hasFieldError('slug')) {
        slugMsg = t('quickSlugHint');
        generalMsg = slugMsg;
      } else if (hasFieldError('name')) {
        generalMsg = t('quickNameTooLong');
      }

      setSlugError(slugMsg);
      setFormError(generalMsg);
      toast({ variant: 'destructive', title: generalMsg });
    },
  });

  const canSubmit = name.trim().length >= 2 && slug.length >= 3 && !mutation.isPending;
  const activeTemplate = TEMPLATE_OPTIONS.find(t => t.id === selectedTheme)!;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto min-h-0">
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
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100">
                {step === 'domain' ? t('domainStepTitle') : t('quickTitle')}
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                {step === 'domain'
                  ? t('domainStepSubtitle', { name: createdTenant?.name ?? '' })
                  : t('quickGreeting', { name: user?.display_name?.split(' ')[0] ?? '' })}
              </p>
            </div>

            {step === 'domain' && createdTenant && (
              <section className="space-y-4">
                {!domainChoice && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDomainChoice('buy')}
                      className="flex flex-col items-start gap-2 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                    >
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                      <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{t('domainOptionBuyTitle')}</span>
                      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('domainOptionBuyDesc')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainChoice('connect')}
                      className="flex flex-col items-start gap-2 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                    >
                      <Link2 className="h-5 w-5 text-blue-500" />
                      <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{t('domainOptionConnectTitle')}</span>
                      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('domainOptionConnectDesc')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={goToStudio}
                      className="flex flex-col items-start gap-2 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
                    >
                      <SkipForward className="h-5 w-5 text-slate-400" />
                      <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{t('domainOptionSkipTitle')}</span>
                      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{t('domainOptionSkipDesc')}</span>
                    </button>
                  </div>
                )}

                {domainChoice === 'connect' && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <button onClick={() => setDomainChoice(null)} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
                      <ArrowLeft className="h-3.5 w-3.5" /> {t('backToChoices')}
                    </button>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      {t('domainConnectLabel')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        value={existingDomain}
                        onChange={e => setExistingDomain(e.target.value)}
                        placeholder="myblog.com"
                        className="flex-1 h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => connectMut.mutate()}
                        disabled={!existingDomain.trim() || connectMut.isPending}
                        className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold disabled:opacity-50 flex items-center gap-2"
                      >
                        {connectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {t('domainConnectButton')}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">{t('domainConnectHint')}</p>
                  </div>
                )}

                {domainChoice === 'buy' && !selectedDomain && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <button onClick={() => setDomainChoice(null)} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
                      <ArrowLeft className="h-3.5 w-3.5" /> {t('backToChoices')}
                    </button>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          value={domainQuery}
                          onChange={e => setDomainQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && domainQuery.trim()) setDomainSubmitted(domainQuery.trim()); }}
                          placeholder={t('domainSearchPlaceholder')}
                          className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <button
                        onClick={() => domainQuery.trim() && setDomainSubmitted(domainQuery.trim())}
                        disabled={!domainQuery.trim() || searchingDomains}
                        className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold disabled:opacity-50"
                      >
                        {searchingDomains ? <Loader2 className="h-4 w-4 animate-spin" /> : t('domainSearchButton')}
                      </button>
                    </div>

                    {domainSubmitted && (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {searchingDomains ? (
                          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 text-slate-300 animate-spin" /></div>
                        ) : domainSearchResults.length === 0 ? (
                          <p className="text-center py-8 text-[12.5px] text-slate-400">{t('domainSearchEmpty')}</p>
                        ) : (
                          domainSearchResults.map(r => (
                            <div key={r.domain} className="px-4 py-3 flex items-center gap-3">
                              <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{r.domain}</p>
                                {r.available && r.price != null && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">${r.price.toFixed(2)}</p>
                                )}
                              </div>
                              {r.available ? (
                                <button
                                  onClick={() => setSelectedDomain(r)}
                                  className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold"
                                >
                                  {t('domainSelectButton')}
                                </button>
                              ) : (
                                <span className="h-6 px-2.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center">
                                  {t('domainTaken')}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {domainChoice === 'buy' && selectedDomain && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <button onClick={() => setSelectedDomain(null)} className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4">
                      <ArrowLeft className="h-3.5 w-3.5" /> {t('backToChoices')}
                    </button>
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-200 mb-4">
                      {td('purchaseTitle', { domain: selectedDomain.domain })}
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input value={registrant.name} onChange={e => setRegistrant(r => ({ ...r, name: e.target.value }))} placeholder={td('fieldName')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.email} onChange={e => setRegistrant(r => ({ ...r, email: e.target.value }))} placeholder={td('fieldEmail')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.phone} onChange={e => setRegistrant(r => ({ ...r, phone: e.target.value }))} placeholder={td('fieldPhone')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.address} onChange={e => setRegistrant(r => ({ ...r, address: e.target.value }))} placeholder={td('fieldAddress')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.city} onChange={e => setRegistrant(r => ({ ...r, city: e.target.value }))} placeholder={td('fieldCity')} className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.zipcode} onChange={e => setRegistrant(r => ({ ...r, zipcode: e.target.value }))} placeholder={td('fieldZip')} className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                      <input value={registrant.country} onChange={e => setRegistrant(r => ({ ...r, country: e.target.value.toUpperCase().slice(0, 2) }))} placeholder={td('fieldCountry')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px]" />
                    </div>
                    <div className="flex items-center justify-between mt-3.5">
                      <label className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                        <input type="checkbox" checked={registrantAutoRenew} onChange={e => setRegistrantAutoRenew(e.target.checked)} className="rounded" />
                        {td('autoRenewLabel')}
                      </label>
                      <select value={registrantYears} onChange={e => setRegistrantYears(Number(e.target.value))} className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px]">
                        {[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} {td('years')}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => purchaseMut.mutate()}
                      disabled={purchaseMut.isPending || !registrant.name || !registrant.email || !registrant.address || !registrant.city || !registrant.country || !registrant.zipcode}
                      className="w-full mt-4 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold disabled:opacity-50"
                    >
                      {purchaseMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                      {td('proceedToPayment')}
                    </button>
                  </div>
                )}
              </section>
            )}

            {step === 'form' && (<>
            {/* ── STEP 1: Template selector ──────────────────────────────────── */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t('templateStep1Title')}
                  </p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{t('templateStep1Desc')}</p>
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
                          href={`/${locale}/preview/${tpl.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full px-2.5 py-1 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          {ts('imagePreviewAlt')} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>

                      {/* Info */}
                      <div className="px-3.5 py-3 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tpl.accent }} />
                          <span className="text-[13px] font-black text-slate-900 dark:text-slate-100">{tpl.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium ml-auto">{t(`templates.${tpl.id}.tagline` as any)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t(`templates.${tpl.id}.description` as any)}</p>
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
                {t('templateStep2Title')}
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
                      maxLength={50}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[14px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">{t('quickNameHint')}</p>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Globe className="h-3 w-3" /> {t('quickUrlLabel')} <span className="text-red-500 normal-case font-normal">*</span>
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                      <span className="flex items-center px-3 text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 shrink-0 select-none font-mono">
                        smarterbloggers.com/
                      </span>
                      <input
                        value={slug}
                        onChange={e => handleSlugChange(e.target.value)}
                        placeholder="my-blog"
                        maxLength={50}
                        className="flex-1 h-11 px-3 text-[13px] font-mono bg-transparent outline-none text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    {slugError ? (
                      <p className="text-[11px] text-red-500 mt-1.5">{slugError}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1.5">{t('quickSlugHint')}</p>
                    )}
                    {slug && !slugError && (
                      <p className="text-[11px] text-slate-400 mt-1.5 font-mono">smarterbloggers.com/{slug}</p>
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
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">{t('quickDescriptionHint')}</p>
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
                          alt={t('coverAlt')}
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
                            <Upload className="h-3 w-3" /> {ts('imageFromComputer')}
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
                            <Link2 className="h-3 w-3" /> {ts('imageDirectUrl')}
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
                                    {dragging ? ts('imageDropHere') : ts('imageClickOrDrag')}
                                  </p>
                                  <p className="text-[10.5px] text-slate-400 mt-0.5">{ts('imageFormats')}</p>
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
                              {t('okButton')}
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
                          title={t(`colors.${c.key}` as any)}
                          onClick={() => setColor(c.hex)}
                          className="h-8 w-8 rounded-xl transition-all hover:scale-110 shrink-0"
                          style={{
                            backgroundColor: c.hex,
                            outline: color === c.hex ? `3px solid ${c.hex}` : '3px solid transparent',
                            outlineOffset: 2,
                          }}
                        />
                      ))}
                      <label className="h-8 w-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors shrink-0" title={t('customColorTitle')}>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="sr-only" />
                        <span className="text-slate-400 text-xs font-bold">+</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800" />

                  {formError && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      {formError}
                    </div>
                  )}

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
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('quickCreating')}</>
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
                      {t('cancel')}
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
                <strong>{t('templatePermanentTitle')}</strong> {t('templatePermanentDesc')}
              </p>
            </div>

            {/* Domain requirement note */}
            <div className="mt-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl px-4 py-3 flex gap-3">
              <Globe className="h-4 w-4 text-blue-500 shrink-0 mt-px" />
              <p className="text-[11.5px] text-blue-700 dark:text-blue-400 leading-relaxed">
                {t('domainRequiredNote')}
              </p>
            </div>
            </>)}

          </div>
        </main>
      </div>

      {payment && createdTenant && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={createdTenant.id}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
}
