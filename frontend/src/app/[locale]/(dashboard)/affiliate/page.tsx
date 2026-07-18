'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Users, DollarSign, TrendingUp, Clock, Copy, Check,
  ArrowDownToLine, Share2, Wallet, Gift, AlertCircle,
  CheckCircle2, XCircle, Download, GitBranch, Send, Mail,
} from 'lucide-react';
import { affiliateApi, type UserAffiliateDashboard, type AffiliateCommission, type CashoutRequest, type AffiliateReferral } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { useToast } from '@/hooks/use-toast';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: ElementType }> = {
  pending:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  ready:      { label: 'Ready',      cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  paid:       { label: 'Paid',       cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  requested:  { label: 'Requested',  cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  processing: { label: 'Processing', cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Clock },
  failed:     { label: 'Failed',     cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  rejected:   { label: 'Rejected',   cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function AffiliatePage() {
  const t = useTranslations('affiliate');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'commissions' | 'cashouts' | 'referrals' | 'tree'>('referrals');
  const [commissionFilter, setCommissionFilter] = useState<string>('all');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendLanguage, setFriendLanguage] = useState('en');
  const [friendMessage, setFriendMessage] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  // Blog utilisé pour les ACTIONS (retrait, invitation, export) — les listes
  // et totaux ci-dessous restent, eux, agrégés sur tous les blogs possédés.
  const [actionBlogId, setActionBlogId] = useState('');

  const { data: dashboard, isLoading } = useQuery<UserAffiliateDashboard>({
    queryKey: ['affiliate-dashboard-user'],
    queryFn: async () => { const { data } = await affiliateApi.getUserDashboard(); return data; },
  });
  const blogs = dashboard?.blogs ?? [];

  useEffect(() => {
    if (!actionBlogId && blogs.length > 0) {
      setActionBlogId(blogs.find(b => b.can_cashout)?.tenant_id ?? blogs[0].tenant_id);
    }
  }, [blogs, actionBlogId]);

  const { data: commissions = [] } = useQuery<(AffiliateCommission & { blog_name: string })[]>({
    queryKey: ['affiliate-commissions-user', commissionFilter],
    queryFn: async () => {
      const { data } = await affiliateApi.listUserCommissions({
        status: commissionFilter !== 'all' ? commissionFilter : undefined,
        limit: 100,
      });
      return data;
    },
  });

  const { data: cashouts = [] } = useQuery<(CashoutRequest & { blog_name: string })[]>({
    queryKey: ['affiliate-cashouts-user'],
    queryFn: async () => { const { data } = await affiliateApi.listUserCashouts(); return data; },
  });

  const { data: referralsData } = useQuery<{ referrals: AffiliateReferral[]; total: number }>({
    queryKey: ['affiliate-referrals-user'],
    queryFn: async () => { const { data } = await affiliateApi.listUserReferrals({ limit: 100 }); return data; },
  });
  const referrals = referralsData?.referrals ?? [];

  const { data: treeData } = useQuery<{ nodes: { tenant_id: string; name: string; slug: string; plan: string; level: number; via_blog_name?: string }[] }>({
    queryKey: ['affiliate-tree-user'],
    queryFn: async () => { const { data } = await affiliateApi.getUserTree(); return data; },
    enabled: activeTab === 'tree',
  });
  const treeNodes = treeData?.nodes ?? [];

  async function handleExportCSV() {
    if (!actionBlogId) return;
    try {
      const { data } = await affiliateApi.exportCommissions(actionBlogId);
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'commissions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: t('exportError') });
    }
  }

  const inviteFriendMutation = useMutation({
    mutationFn: async () => {
      const { data } = await affiliateApi.inviteFriend(actionBlogId, {
        email: friendEmail.trim(),
        language: friendLanguage,
        message: friendMessage.trim(),
      });
      return data;
    },
    onSuccess: () => {
      setInviteSent(true);
      setFriendEmail('');
      setFriendMessage('');
      setTimeout(() => setInviteSent(false), 4000);
      toast({ title: t('inviteSentTitle'), description: t('inviteSentDesc', { email: friendEmail.trim() }) });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('inviteError') });
    },
  });

  const cashoutMutation = useMutation({
    mutationFn: async () => { const { data } = await affiliateApi.requestCashout(actionBlogId, 'nowpayments_crypto'); return data; },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affiliate-dashboard-user'] });
      qc.invalidateQueries({ queryKey: ['affiliate-cashouts-user'] });
      qc.invalidateQueries({ queryKey: ['affiliate-commissions-user'] });
      toast({ title: t('cashoutRequested') });
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: t('error'), description: err?.response?.data?.detail ?? t('cashoutError') });
    },
  });

  const copyLink = async (url: string, code: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const balance = dashboard?.balance ?? 0;
  const threshold = dashboard?.cashout_threshold ?? 0;
  const progressPct = threshold > 0 ? Math.min((balance / threshold) * 100, 100) : 0;
  const actionBlog = blogs.find(b => b.tenant_id === actionBlogId) ?? blogs[0];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-tight">{t('title')}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Gift className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noBlog')}</p>
              </div>
            ) : (
              <>
                {/* Stats — agrégés sur tous les blogs possédés */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t('balance'),        value: fmtCurrency(balance),                        icon: Wallet,     color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-100 dark:border-blue-800' },
                    { label: t('totalEarned'),    value: fmtCurrency(dashboard?.total_earned ?? 0),   icon: TrendingUp, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-800' },
                    { label: t('totalReferrals'), value: String(dashboard?.total_referrals ?? 0),     icon: Users,      color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800' },
                    { label: t('totalPaidOut'),   value: fmtCurrency(dashboard?.total_paid_out ?? 0), icon: DollarSign, color: 'text-slate-600',  bg: 'bg-slate-100 dark:bg-slate-800',   border: 'border-slate-200 dark:border-slate-700' },
                  ].map(({ label, value, icon: Icon, color, bg, border }) => (
                    <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm px-5 py-5">
                      <div className={`h-9 w-9 rounded-xl border ${border} ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <p className="text-[26px] font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Referral links — un par blog possédé */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-blue-600" />
                      {t('yourLink')}
                    </h2>
                    <div className="space-y-3">
                      {blogs.map(b => (
                        <div key={b.tenant_id}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{b.name}</label>
                            <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest">{b.affiliate_code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-400 truncate">
                              {b.referral_url}
                            </div>
                            <button
                              onClick={() => copyLink(b.referral_url, b.affiliate_code)}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
                            >
                              {copiedCode === b.affiliate_code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copiedCode === b.affiliate_code ? t('copied') : t('copyLink')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cashout */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      {t('requestCashout')}
                    </h2>
                    <div className="space-y-4">
                      {blogs.length > 1 && (
                        <select
                          value={actionBlogId}
                          onChange={e => setActionBlogId(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300"
                        >
                          {blogs.map(b => (
                            <option key={b.tenant_id} value={b.tenant_id}>
                              {b.name} — {fmtCurrency(b.balance)}
                            </option>
                          ))}
                        </select>
                      )}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtCurrency(actionBlog?.balance ?? 0)}</span>
                          <span>{t('threshold')}: {fmtCurrency(actionBlog?.cashout_threshold ?? 0)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${actionBlog ? Math.min((actionBlog.balance / (actionBlog.cashout_threshold || 1)) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => cashoutMutation.mutate()}
                        disabled={!actionBlog?.can_cashout || cashoutMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        {cashoutMutation.isPending ? '…' : t('requestCashout')}
                      </button>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {t('cashoutFee')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-blue-600" />
                    {t('howItWorks')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[t('step1'), t('step2'), t('step3'), t('step4')].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite a friend */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-600" />
                    {t('inviteFriendTitle')}
                  </h2>
                  <p className="text-[12px] text-slate-400 dark:text-slate-500 mb-5">{t('inviteFriendDesc')}</p>

                  {inviteSent ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-[13px] font-medium text-green-700 dark:text-green-400">{t('inviteSentTitle')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {blogs.length > 1 && (
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            {t('yourLink')}
                          </label>
                          <select
                            value={actionBlogId}
                            onChange={e => setActionBlogId(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-300"
                          >
                            {blogs.map(b => (
                              <option key={b.tenant_id} value={b.tenant_id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                          {t('inviteFriendEmail')}
                        </label>
                        <input
                          type="email"
                          value={friendEmail}
                          onChange={e => setFriendEmail(e.target.value)}
                          placeholder="friend@example.com"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                          {t('inviteFriendLanguage')}
                        </label>
                        <select
                          value={friendLanguage}
                          onChange={e => setFriendLanguage(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                        >
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                          <option value="pt">Português</option>
                          <option value="it">Italiano</option>
                          <option value="nl">Nederlands</option>
                          <option value="pl">Polski</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                          {t('inviteFriendMessage')}
                        </label>
                        <textarea
                          value={friendMessage}
                          onChange={e => setFriendMessage(e.target.value)}
                          placeholder={t('inviteFriendMessagePlaceholder')}
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{t('inviteFriendTranslationNote')}</p>
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          onClick={() => inviteFriendMutation.mutate()}
                          disabled={!friendEmail.trim() || !friendMessage.trim() || inviteFriendMutation.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold disabled:opacity-50 transition-colors"
                        >
                          <Send className="h-4 w-4" />
                          {inviteFriendMutation.isPending ? '…' : t('inviteFriendSend')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs — affiliés, commissions & cashouts */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="flex border-b border-slate-200 dark:border-slate-700">
                    {([
                      { id: 'referrals',    label: t('referralsTab') },
                      { id: 'tree',         label: t('treeTab') },
                      { id: 'commissions',  label: t('commissionsTitle') },
                      { id: 'cashouts',     label: t('cashoutsTitle') },
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                        {tab.id === 'referrals' && referrals.length > 0 && (
                          <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-[10px] font-bold">
                            {referrals.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'referrals' && (
                    <div>
                      {referrals.length === 0 ? (
                        <div className="py-14 text-center">
                          <Users className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 dark:text-slate-500 text-sm">{t('noReferrals')}</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                {[t('refBlog'), t('refVia'), t('refPlan'), t('refStatus'), t('refJoined'), t('refCommissions')].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {referrals.map(r => {
                                const planColors: Record<string, string> = {
                                  free:     'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                                  starter:  'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
                                  pro:      'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
                                  business: 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
                                };
                                const statusColors: Record<string, string> = {
                                  active:    'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400',
                                  trial:     'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
                                  suspended: 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400',
                                  deleted:   'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                                };
                                const statusLabels: Record<string, string> = {
                                  active:    t('statusActive'),
                                  trial:     t('statusTrial'),
                                  suspended: t('statusSuspended'),
                                  deleted:   t('statusDeleted'),
                                };
                                return (
                                  <tr key={r.tenant_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                      <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{r.slug}</p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
                                      {r.via_blog_name ?? '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${planColors[r.plan] ?? planColors.free}`}>
                                        {r.plan}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[r.status] ?? statusColors.active}`}>
                                        {statusLabels[r.status] ?? r.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
                                      {r.joined_at ? fmtDate(r.joined_at) : '—'}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">
                                      {fmtCurrency(r.total_commission)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'tree' && (
                    <div className="p-5">
                      {treeNodes.length === 0 ? (
                        <div className="py-14 text-center">
                          <GitBranch className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 dark:text-slate-500 text-sm">{t('noReferrals')}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {[1, 2, 3].map(level => {
                            const levelNodes = treeNodes.filter(n => n.level === level);
                            if (!levelNodes.length) return null;
                            return (
                              <div key={level} className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 mt-3">
                                  {t('level')} {level}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {levelNodes.map(node => (
                                    <div key={node.tenant_id}
                                      className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5"
                                      style={{ marginLeft: `${(level - 1) * 16}px` }}
                                    >
                                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${level === 1 ? 'bg-blue-600' : level === 2 ? 'bg-violet-600' : 'bg-slate-500'}`}>
                                        L{level}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono truncate">{node.slug}</p>
                                      </div>
                                      <span className="ml-auto text-[10px] font-semibold text-slate-500 capitalize shrink-0">{node.plan}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'commissions' && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
                        {['all', 'pending', 'ready', 'paid', 'cancelled'].map(f => (
                          <button
                            key={f}
                            onClick={() => setCommissionFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              commissionFilter === f
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                        <div className="flex-1" />
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          {t('exportCSV')}
                        </button>
                      </div>
                      {commissions.length === 0 ? (
                        <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-sm">{t('noCommissions')}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                {[t('source'), t('refBlog'), t('level'), t('amount'), t('status'), t('date')].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {commissions.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 capitalize">
                                    {c.source_type === 'subscription' ? t('subscription') : t('ad_slot')}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.blog_name}</td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">L{c.level}</td>
                                  <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">{fmtCurrency(c.commission_amount)}</td>
                                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{fmtDate(c.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'cashouts' && (
                    <div>
                      {cashouts.length === 0 ? (
                        <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-sm">{t('noCashouts')}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                {[t('refBlog'), 'Gross', 'Fee', 'Net', t('status'), 'Requested', 'Processed'].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cashouts.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{c.blog_name}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{fmtCurrency(c.gross_amount)}</td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fmtCurrency(c.fee)}</td>
                                  <td className="px-4 py-3 font-semibold text-green-700 dark:text-green-400">{fmtCurrency(c.net_amount)}</td>
                                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{fmtDate(c.requested_at)}</td>
                                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{fmtDate(c.processed_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
