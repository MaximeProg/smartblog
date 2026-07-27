'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Globe, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  Clock, Copy, Check, Loader2, ExternalLink, ChevronDown, ChevronUp,
  Search, ShoppingCart, Star, Shield, Link2, AlertTriangle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { domainsApi, paymentsApi, type CustomDomainInfo, type DomainSearchResult, type CryptoPaymentResponse, type DomainOrderStatusInfo } from '@/lib/api';
import { FullPageShell } from '@/components/dashboard/BlogStudioShell';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { getErrorMessage } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants/countries';

const STATUS_CONFIG = {
  pending:  { icon: Clock,        cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',       labelKey: 'status_pending'  },
  verified: { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', labelKey: 'status_verified' },
  failed:   { icon: XCircle,      cls: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',                 labelKey: 'status_failed'   },
};

const PLATFORM_CNAME = 'cname.vercel-dns.com';

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('domains');
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      title={t('copyLabel')}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function DnsRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-400 w-12 shrink-0">{label}</span>
      <span className="text-[12px] font-mono text-slate-700 dark:text-slate-300 flex-1 break-all">{value}</span>
      {copyable && <CopyButton text={value} />}
    </div>
  );
}

export default function DomainsPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('domains');
  const { user } = useAuthStore();
  const [newDomain, setNewDomain] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  const [tab, setTab] = useState<'connect' | 'buy'>('connect');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [purchaseTarget, setPurchaseTarget] = useState<DomainSearchResult | null>(null);
  const [payment, setPayment] = useState<CryptoPaymentResponse | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    name: user?.display_name ?? '', email: user?.email ?? '', phone: user?.phone ?? '',
    address: '', city: '', country: '', zipcode: '', years: 1, autoRenew: false,
  });

  const { data: pendingOrders = [] } = useQuery({
    queryKey: ['domain-pending-orders', blogId],
    queryFn: async () => { const { data } = await domainsApi.pendingOrders(blogId); return data; },
    refetchInterval: (query) => {
      const orders = query.state.data ?? [];
      const stillActive = orders.some((o) => o.status === 'paid' || o.status === 'registering');
      return stillActive ? 4000 : false;
    },
  });
  const hasActiveOrder = pendingOrders.some((o) => o.status === 'paid' || o.status === 'registering');

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domains', blogId],
    queryFn: async () => { const { data } = await domainsApi.list(blogId); return data; },
    refetchInterval: hasActiveOrder ? 4000 : false,
  });

  const addMut = useMutation({
    mutationFn: () => domainsApi.add(blogId, newDomain.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      setNewDomain('');
      setShowAdd(false);
      toast({ title: t('addSuccess') });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: getErrorMessage(err, t('addError')) }),
  });

  const verifyMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.verify(blogId, domainId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      const status = res.data.verification_status;
      if (status === 'verified') toast({ title: t('verifySuccess') });
      else toast({ variant: 'destructive', title: t('verifyFailed') });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: t('verifyError'), description: getErrorMessage(err, '') }),
  });

  const deleteMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.remove(blogId, domainId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['domains', blogId] });
      toast({ title: t('deleteSuccess') });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: t('deleteError'), description: getErrorMessage(err, '') }),
  });

  const setPrimaryMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.setPrimary(blogId, domainId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domains', blogId] }),
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['domain-search', blogId, searchSubmitted],
    queryFn: async () => { const { data } = await domainsApi.search(blogId, searchSubmitted); return data; },
    enabled: !!searchSubmitted,
  });

  const purchaseMut = useMutation({
    mutationFn: () => paymentsApi.createDomainCheckout(blogId, {
      domain_name: purchaseTarget!.domain,
      years: purchaseForm.years,
      auto_renew: purchaseForm.autoRenew,
      registrant: {
        name: purchaseForm.name, email: purchaseForm.email, phone: purchaseForm.phone,
        address: purchaseForm.address, city: purchaseForm.city,
        country: purchaseForm.country, zipcode: purchaseForm.zipcode,
      },
    }).then((r) => r.data),
    onSuccess: (data) => setPayment(data),
    onError: (err: any) => toast({ variant: 'destructive', title: getErrorMessage(err, t('purchaseError')) }),
  });

  const renewMut = useMutation({
    mutationFn: (domainId: string) => domainsApi.renew(blogId, domainId).then((r) => r.data),
    onSuccess: (data) => setPayment(data),
    onError: (err: any) => toast({ variant: 'destructive', title: getErrorMessage(err, t('renewError')) }),
  });

  function handlePaymentConfirmed() {
    setPayment(null);
    setPurchaseTarget(null);
    qc.invalidateQueries({ queryKey: ['domains', blogId] });
    qc.invalidateQueries({ queryKey: ['domain-pending-orders', blogId] });
    toast({ title: t('purchaseSuccess') });
  }

  return (
    <FullPageShell
      title={t('pageTitle')}
      description={t('pageDesc')}
      action={
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> {t('addDomain')}
        </button>
      }
    >
      <div className="px-6 py-6 space-y-5">

        {/* ── Tab switcher ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('connect')}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12.5px] font-bold transition-colors ${
              tab === 'connect' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" /> {t('tabConnect')}
          </button>
          <button
            onClick={() => setTab('buy')}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12.5px] font-bold transition-colors ${
              tab === 'buy' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> {t('tabBuy')}
          </button>
        </div>

        {/* ── Buy a domain ─────────────────────────────────────────── */}
        {tab === 'buy' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3">{t('searchTitle')}</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) setSearchSubmitted(searchQuery.trim()); }}
                    placeholder={t('searchPlaceholder')}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={() => searchQuery.trim() && setSearchSubmitted(searchQuery.trim())}
                  disabled={!searchQuery.trim() || searching}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
                >
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  {t('searchButton')}
                </button>
              </div>
            </div>

            {searchSubmitted && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {searching ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 text-slate-300 animate-spin" /></div>
                ) : searchResults.length === 0 ? (
                  <p className="text-center py-10 text-[12.5px] text-slate-400">{t('searchEmpty')}</p>
                ) : (
                  searchResults.map((r) => (
                    <div key={r.domain} className="px-5 py-3.5 flex items-center gap-3">
                      <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200">{r.domain}</p>
                        {r.available && r.price != null && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('priceFirstYear', { price: r.price.toFixed(2) })}
                            {r.renewal_price != null && ` · ${t('priceRenewal', { price: r.renewal_price.toFixed(2) })}`}
                          </p>
                        )}
                      </div>
                      {r.is_premium && (
                        <span className="h-6 px-2 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center">
                          {t('premium')}
                        </span>
                      )}
                      {r.available ? (
                        <button
                          onClick={() => {
                            setPurchaseTarget(r);
                            setPurchaseForm((f) => ({ ...f, years: 1 }));
                          }}
                          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold transition-colors"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> {t('buyButton')}
                        </button>
                      ) : (
                        <span className="h-6 px-2.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center">
                          {t('taken')}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'connect' && (<>
        {/* ── Step-by-step guide ──────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <button
            onClick={() => setGuideOpen(v => !v)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('setupTitle')}</span>
            </div>
            {guideOpen
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {guideOpen && (
            <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">

              {/* Step 1 */}
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('step1Title')}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{t('step1Desc')}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('step2Title')}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 mb-3">{t('step2Desc')}</p>

                  {/* CNAME record — root */}
                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden mb-2">
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('recordCname')}</p>
                    </div>
                    <div className="p-3 space-y-1.5 bg-white dark:bg-slate-900">
                      <DnsRow label={t('dnsType')}  value="CNAME" />
                      <DnsRow label={t('dnsName')}  value="@" />
                      <DnsRow label={t('dnsValue')} value={PLATFORM_CNAME} copyable />
                    </div>
                  </div>

                  {/* CNAME record — www */}
                  <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden mb-2">
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('recordCnameWww')}</p>
                    </div>
                    <div className="p-3 space-y-1.5 bg-white dark:bg-slate-900">
                      <DnsRow label={t('dnsType')}  value="CNAME" />
                      <DnsRow label={t('dnsName')}  value="www" />
                      <DnsRow label={t('dnsValue')} value={PLATFORM_CNAME} copyable />
                    </div>
                  </div>

                  {/* TXT record placeholder */}
                  <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 overflow-hidden">
                    <div className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20">
                      <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">{t('recordTxt')}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('step2TxtNote')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="px-5 py-4 flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('step3Title')}</p>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{t('step3Desc')}</p>
                </div>
              </div>

              {/* Cloudflare tip */}
              <div className="px-5 py-3 bg-orange-50 dark:bg-orange-950/30 flex items-start gap-2">
                <span className="text-[15px] shrink-0 mt-0.5">🟠</span>
                <p className="text-[11.5px] text-orange-700 dark:text-orange-400 leading-relaxed">{t('cloudflareTip')}</p>
              </div>

              {/* Hostinger tip */}
              <div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/30 flex items-start gap-2">
                <span className="text-[15px] shrink-0 mt-0.5">🔵</span>
                <p className="text-[11.5px] text-blue-700 dark:text-blue-400 leading-relaxed">{t('hostingerTip')}</p>
              </div>

            </div>
          )}
        </div>

        {/* ── Add domain form ────────────────────────────────────── */}
        {showAdd && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-3">{t('addTitle')}</h3>
            <div className="flex items-center gap-2">
              <input
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newDomain.trim()) addMut.mutate(); }}
                placeholder={t('placeholderCustomDomainExample')}
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button
                onClick={() => addMut.mutate()}
                disabled={!newDomain.trim() || addMut.isPending}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {addMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t('addButton')}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{t('addHint')}</p>
          </div>
        )}
        </>)}

        {/* ── Pending/failed domain orders (toujours visible) ─────────── */}
        {pendingOrders.length > 0 && (
          <div className="space-y-2.5">
            {pendingOrders.map((o: DomainOrderStatusInfo) => {
              if (o.status === 'paid' || o.status === 'registering') {
                return (
                  <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-blue-700 dark:text-blue-400">{t('orderRegisteringTitle', { domain: o.domain_name })}</p>
                      <p className="text-[12px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">{t('orderRegisteringDesc')}</p>
                    </div>
                  </div>
                );
              }
              if (o.status === 'registration_failed') {
                return (
                  <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-red-700 dark:text-red-400">{t('orderFailedTitle', { domain: o.domain_name })}</p>
                      <p className="text-[12px] text-red-600/80 dark:text-red-400/80 mt-0.5">{t('orderFailedDesc', { error: o.error_message ?? '—' })}</p>
                      <p className="text-[11.5px] text-red-500/70 dark:text-red-400/70 mt-1">{t('orderFailedSupport')}</p>
                    </div>
                  </div>
                );
              }
              if (o.status === 'refund_pending') {
                return (
                  <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-bold text-amber-700 dark:text-amber-400">{t('orderRefundPendingTitle', { domain: o.domain_name })}</p>
                      <p className="text-[12px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">{t('orderRefundPendingDesc')}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                  <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{t('orderRefundedTitle', { domain: o.domain_name })}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{t('orderRefundedDesc')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Domain list (toujours visible, indépendamment de l'onglet) ── */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
          </div>
        ) : domains.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mb-4">
              <Globe className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('emptyTitle')}</p>
            <p className="text-[12px] text-slate-400 max-w-xs">{t('emptyDesc')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {domains.map((d: CustomDomainInfo) => {
              const cfg = STATUS_CONFIG[d.verification_status];
              const StatusIcon = cfg.icon;
              return (
                <div key={d.id} className="px-5 py-4">

                  {/* Domain header row */}
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {d.verification_status === 'verified' ? (
                          <a
                            href={`https://${d.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[14px] font-bold text-blue-600 dark:text-blue-400 hover:underline w-fit"
                          >
                            {d.domain}
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate">{d.domain}</p>
                        )}
                        {d.is_primary && (
                          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                            <Star className="h-2.5 w-2.5" /> {t('primaryBadge')}
                          </span>
                        )}
                        {d.source === 'purchased' && (
                          <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            <ShoppingCart className="h-2.5 w-2.5" /> {t('purchasedBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('addedOn', { date: new Date(d.created_at).toLocaleDateString() })}
                        {d.ssl_enabled && <span className="ml-2 text-emerald-500 font-semibold">· {t('sslActive')} ✓</span>}
                        {d.source === 'purchased' && d.registrar && <span className="ml-2">· {d.registrar}</span>}
                        {d.source === 'purchased' && d.expires_at && (
                          <span className="ml-2">· {t('expiresOn', { date: new Date(d.expires_at).toLocaleDateString() })}</span>
                        )}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
                      <StatusIcon className="h-3 w-3" />
                      {t(cfg.labelKey as any)}
                    </span>
                    {d.source === 'external' && (
                      <button
                        onClick={() => verifyMut.mutate(d.id)}
                        disabled={verifyMut.isPending}
                        title={t('verifyButton')}
                        className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50"
                      >
                        {verifyMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {d.source === 'purchased' && (
                      <button
                        onClick={() => renewMut.mutate(d.id)}
                        disabled={renewMut.isPending}
                        title={t('renewButton')}
                        className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors disabled:opacity-50"
                      >
                        {renewMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {!d.is_primary && (
                      <button
                        onClick={() => setPrimaryMut.mutate(d.id)}
                        disabled={setPrimaryMut.isPending}
                        title={t('setPrimaryButton')}
                        className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-300 transition-colors disabled:opacity-50"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm(t('deleteConfirm'))) deleteMut.mutate(d.id); }}
                      disabled={deleteMut.isPending}
                      className="h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* DNS records (only for unverified) */}
                  {d.verification_status !== 'verified' && (
                    <div className="mt-4 space-y-2">

                      {/* CNAME root */}
                      <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('recordCname')}</p>
                        </div>
                        <div className="p-3 space-y-1.5 bg-white dark:bg-slate-900">
                          <DnsRow label={t('dnsType')}  value="CNAME" />
                          <DnsRow label={t('dnsName')}  value="@" />
                          <DnsRow label={t('dnsValue')} value={PLATFORM_CNAME} copyable />
                        </div>
                      </div>

                      {/* CNAME www */}
                      <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20">
                          <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('recordCnameWww')}</p>
                        </div>
                        <div className="p-3 space-y-1.5 bg-white dark:bg-slate-900">
                          <DnsRow label={t('dnsType')}  value="CNAME" />
                          <DnsRow label={t('dnsName')}  value="www" />
                          <DnsRow label={t('dnsValue')} value={PLATFORM_CNAME} copyable />
                        </div>
                      </div>

                      {/* TXT verification */}
                      <div className="rounded-xl border border-violet-100 dark:border-violet-900/50 overflow-hidden">
                        <div className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20">
                          <p className="text-[10px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">{t('recordTxt')}</p>
                        </div>
                        <div className="p-3 space-y-1.5 bg-white dark:bg-slate-900">
                          <DnsRow label={t('dnsType')}  value="TXT" />
                          <DnsRow label={t('dnsName')}  value="@" />
                          <DnsRow label={t('dnsValue')} value={d.verification_token} copyable />
                        </div>
                      </div>

                      {d.verification_status === 'failed' && (
                        <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1.5 mt-1">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          {t('verifyFailed')}
                        </p>
                      )}

                    </div>
                  )}

                  {/* Verified success state */}
                  {d.verification_status === 'verified' && (
                    <div className="mt-3 flex items-center gap-2 text-[11.5px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {t('verifiedDesc')}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Purchase modal (coordonnées registrant) ─────────────────── */}
      {purchaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPurchaseTarget(null)}>
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-1">{t('purchaseTitle', { domain: purchaseTarget.domain })}</h3>
            <p className="text-[11.5px] text-slate-400 mb-4">{t('purchaseSubtitle')}</p>

            <div className="grid grid-cols-2 gap-2.5">
              <input value={purchaseForm.name} onChange={(e) => setPurchaseForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('fieldName')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={purchaseForm.email} onChange={(e) => setPurchaseForm(f => ({ ...f, email: e.target.value }))}
                placeholder={t('fieldEmail')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={purchaseForm.phone} onChange={(e) => setPurchaseForm(f => ({ ...f, phone: e.target.value }))}
                placeholder={t('fieldPhone')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={purchaseForm.address} onChange={(e) => setPurchaseForm(f => ({ ...f, address: e.target.value }))}
                placeholder={t('fieldAddress')} className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={purchaseForm.city} onChange={(e) => setPurchaseForm(f => ({ ...f, city: e.target.value }))}
                placeholder={t('fieldCity')} className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={purchaseForm.zipcode} onChange={(e) => setPurchaseForm(f => ({ ...f, zipcode: e.target.value }))}
                placeholder={t('fieldZip')} className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <select value={purchaseForm.country} onChange={(e) => setPurchaseForm(f => ({ ...f, country: e.target.value }))}
                className="col-span-2 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">{t('fieldCountry')}</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between mt-3.5">
              <label className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={purchaseForm.autoRenew} onChange={(e) => setPurchaseForm(f => ({ ...f, autoRenew: e.target.checked }))} className="rounded" />
                {t('autoRenewLabel')}
              </label>
              <select value={purchaseForm.years} onChange={(e) => setPurchaseForm(f => ({ ...f, years: Number(e.target.value) }))}
                className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px]">
                {[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} {t('years')}</option>)}
              </select>
            </div>

            {purchaseTarget.price != null && (
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-3">
                {t('totalPrice', { price: (purchaseTarget.price * purchaseForm.years).toFixed(2) })}
              </p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => setPurchaseTarget(null)} className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-[12.5px] font-bold text-slate-600 dark:text-slate-300">
                {t('cancel')}
              </button>
              <button
                onClick={() => purchaseMut.mutate()}
                disabled={purchaseMut.isPending || !purchaseForm.name || !purchaseForm.email || !purchaseForm.address || !purchaseForm.city || !purchaseForm.country || !purchaseForm.zipcode}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold disabled:opacity-50"
              >
                {purchaseMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                {t('proceedToPayment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {payment && (
        <CryptoPaymentPanel
          open={!!payment}
          onOpenChange={(o) => { if (!o) setPayment(null); }}
          tenantId={blogId}
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
    </FullPageShell>
  );
}
