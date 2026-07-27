'use client';

import { useState, type ElementType } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Megaphone, ImageIcon, Link2, Calendar, DollarSign, Loader2, AlertCircle,
  Clock, CheckCircle2, XCircle, Eye, MousePointerClick, TrendingUp, BarChart3, ChevronDown, ChevronUp,
  Globe2, X, Search,
} from 'lucide-react';
import { platformAdsApi, type AdResponse, type PlatformAdStats, type PlatformAdSubmitData } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { CryptoCurrencyPicker } from '@/components/payments/CryptoCurrencyPicker';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants/countries';

const PLATFORM_TENANT_ID = process.env.NEXT_PUBLIC_PLATFORM_TENANT_ID || '00000000-0000-0000-0000-000000000001';

const INPUT = 'w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

const STATUS_BADGE: Record<string, { cls: string; icon: ElementType; key: string }> = {
  pending:         { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', icon: Clock, key: 'statusPending' },
  approved:        { cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800', icon: CheckCircle2, key: 'statusApproved' },
  rejected:        { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', icon: XCircle, key: 'statusRejected' },
  payment_pending: { cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: Clock, key: 'statusPaymentPending' },
  paid:            { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800', icon: CheckCircle2, key: 'statusPaid' },
  expired:         { cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700', icon: XCircle, key: 'statusExpired' },
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('advertiser');
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {t(cfg.key as any)}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: {
  label: string; value: string | number; icon: ElementType; color: string; bg: string; border: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm px-5 py-5">
      <div className={`h-9 w-9 rounded-xl border ${border} ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{label}</p>
    </div>
  );
}

function MiniBarChart({ data, unit }: { data: { date: string; impressions: number; clicks: number }[]; unit: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.impressions), 1);
  return (
    <div className="flex items-end gap-0.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-t bg-blue-500/70 hover:bg-blue-600 transition-colors min-h-[2px]"
            style={{ height: `${Math.max(4, (d.impressions / max) * 72)}px` }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
            {d.date.slice(5)}: {d.impressions} {unit}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdStats({ adId }: { adId: string }) {
  const t = useTranslations('advertiser');
  const { data, isLoading } = useQuery<PlatformAdStats>({
    queryKey: ['platform-ad-stats', adId],
    queryFn: async () => { const { data } = await platformAdsApi.stats(adId, 30); return data; },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t('totalImpressions')} value={data.total_impressions} icon={Eye} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" border="border-blue-100 dark:border-blue-800" />
        <StatCard label={t('totalClicks')} value={data.total_clicks} icon={MousePointerClick} color="text-violet-600" bg="bg-violet-50 dark:bg-violet-900/20" border="border-violet-100 dark:border-violet-800" />
        <StatCard label={t('ctr')} value={`${data.ctr_pct}%`} icon={TrendingUp} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" border="border-green-100 dark:border-green-800" />
        <StatCard label={t('spend')} value={`$${data.amount_paid.toFixed(2)}`} icon={DollarSign} color="text-slate-600" bg="bg-slate-100 dark:bg-slate-800" border="border-slate-200 dark:border-slate-700" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> {t('dailyTrend')}
        </p>
        <MiniBarChart data={data.daily} unit={t('impressionsUnit')} />
      </div>
    </div>
  );
}

export default function AdvertiserPage() {
  const t = useTranslations('advertiser');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ ad_id: string; transaction_id: string; order_id: string; pay_address: string; pay_amount: number; pay_currency: string; qr_code_data_uri: string; expires_at: string | null; amount_usd: number } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', image_url: '', click_url: '',
    starts_at: '', ends_at: '', total_budget: '',
  });
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [touched, setTouched] = useState(false);
  const [payCurrency, setPayCurrency] = useState('usdtbsc');
  const [payCurrencyValid, setPayCurrencyValid] = useState(true);

  const { data: ads = [], isLoading } = useQuery<AdResponse[]>({
    queryKey: ['platform-ads-mine'],
    queryFn: async () => { const { data } = await platformAdsApi.mine(); return data; },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const body: PlatformAdSubmitData = {
        title: form.title.trim(),
        click_url: form.click_url.trim(),
        total_budget: parseFloat(form.total_budget),
      };
      if (form.description.trim()) body.description = form.description.trim();
      if (form.image_url.trim()) body.image_url = form.image_url.trim();
      if (form.starts_at) body.starts_at = new Date(form.starts_at).toISOString();
      if (form.ends_at) body.ends_at = new Date(form.ends_at).toISOString();
      if (targetCountries.length) body.target_countries = targetCountries;
      body.pay_currency = payCurrency;
      const { data } = await platformAdsApi.submit(body);
      return data;
    },
    onSuccess: (data) => {
      setPayment(data);
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: t('submitError'), description: getErrorMessage(err, '') });
    },
  });

  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));

  const isValid = () => !!(form.title.trim() && form.click_url.trim() && form.total_budget && parseFloat(form.total_budget) > 0 && payCurrencyValid);

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid()) return;
    submitMutation.mutate();
  };

  const resetForm = () => {
    setForm({ title: '', description: '', image_url: '', click_url: '', starts_at: '', ends_at: '', total_budget: '' });
    setTargetCountries([]);
    setCountrySearch('');
    setTouched(false);
    setPayCurrency('usdtbsc');
  };

  const toggleCountry = (code: string) =>
    setTargetCountries(cs => cs.includes(code) ? cs.filter(c => c !== code) : [...cs, code]);

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.trim().toLowerCase()))
    : COUNTRIES;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-8 py-8 space-y-6 max-w-5xl mx-auto">

            <div>
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-600" />
                {t('title')}
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-5">{t('howItWorksTitle')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[t('howItWorksStep1'), t('howItWorksStep2'), t('howItWorksStep3'), t('howItWorksStep4')].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New ad form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-600" />
                {t('newAdTitle')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('adTitle')} *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} maxLength={80}
                    placeholder={t('adTitlePlaceholder')} className={INPUT} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">{t('adDescription')}</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} maxLength={200} rows={3}
                    placeholder={t('adDescriptionPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> {t('imageUrl')}
                    </label>
                    <input type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)}
                      placeholder="https://…/banner.jpg" className={INPUT} />
                    <p className="text-[11px] text-slate-400 mt-1">{t('imageUrlHint')}</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <Link2 className="h-3 w-3" /> {t('clickUrl')} *
                    </label>
                    <input type="url" value={form.click_url} onChange={e => set('click_url', e.target.value)}
                      placeholder="https://…" className={INPUT} />
                    <p className="text-[11px] text-slate-400 mt-1">{t('clickUrlHint')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {t('startsAt')}
                    </label>
                    <input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> {t('endsAt')}
                    </label>
                    <input type="date" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} min={form.starts_at || undefined} className={INPUT} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> {t('totalBudget')} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                      <input type="number" min={0} step={10} value={form.total_budget} onChange={e => set('total_budget', e.target.value)}
                        placeholder="500" className={`${INPUT} pl-6`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <Globe2 className="h-3 w-3" /> {t('targetCountries')}
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">{t('targetCountriesHint')}</p>

                  {targetCountries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {targetCountries.map(code => {
                        const c = COUNTRIES.find(x => x.code === code);
                        return (
                          <span key={code} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-semibold">
                            {c?.name ?? code}
                            <button type="button" onClick={() => toggleCountry(code)} className="h-4 w-4 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 flex items-center justify-center">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative mb-1.5">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      placeholder={t('targetCountriesSearch')}
                      className={`${INPUT} pl-8`}
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCountries.length === 0 ? (
                      <p className="text-[12px] text-slate-400 px-3 py-3">{t('targetCountriesNoResults')}</p>
                    ) : filteredCountries.map(c => (
                      <label key={c.code} className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetCountries.includes(c.code)}
                          onChange={() => toggleCountry(c.code)}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>

                <CryptoCurrencyPicker
                  tenantId={PLATFORM_TENANT_ID}
                  amountUsd={parseFloat(form.total_budget) || 0}
                  value={payCurrency}
                  onChange={setPayCurrency}
                  onValidityChange={setPayCurrencyValid}
                />

                {touched && !isValid() && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {!form.total_budget || parseFloat(form.total_budget) <= 0 ? t('budgetRequired') : t('requiredFields')}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || !payCurrencyValid}
                    className="flex items-center gap-2 px-6 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60 transition-colors"
                  >
                    {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                    {submitMutation.isPending ? t('submitting') : t('submit')}
                  </button>
                </div>
              </div>
            </div>

            {/* My ads */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('myAds')}</h2>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : ads.length === 0 ? (
                <div className="py-14 text-center">
                  <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{t('noAds')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ads.map(ad => {
                    const expanded = expandedId === ad.id;
                    const canViewStats = ad.submission_status === 'approved';
                    return (
                      <div key={ad.id}>
                        <div className="px-6 py-4 flex items-center gap-4">
                          {ad.image_url && (
                            <img src={ad.image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{ad.title}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{ad.click_url}</p>
                          </div>
                          <StatusBadge status={ad.submission_status} />
                          {canViewStats && (
                            <button
                              onClick={() => setExpandedId(expanded ? null : ad.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 shrink-0"
                            >
                              {expanded ? t('hideStats') : t('viewStats')}
                              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                        {expanded && canViewStats && <AdStats adId={ad.id} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {payment && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={PLATFORM_TENANT_ID}
          transactionId={payment.transaction_id}
          orderId={payment.order_id}
          payAddress={payment.pay_address}
          payAmount={payment.pay_amount}
          payCurrency={payment.pay_currency}
          qrCodeDataUri={payment.qr_code_data_uri}
          expiresAt={payment.expires_at}
          amountUsd={payment.amount_usd}
          onConfirmed={() => {
            setPayment(null);
            resetForm();
            qc.invalidateQueries({ queryKey: ['platform-ads-mine'] });
          }}
        />
      )}
    </div>
  );
}
