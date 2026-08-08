'use client';

import { useState, type ElementType } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Users, DollarSign, TrendingUp, Clock, Copy, Check,
  Share2, Wallet, Gift,
  CheckCircle2, XCircle, Download, GitBranch, Send, Mail,
} from 'lucide-react';
import { affiliateApi, type AffiliateDashboard, type AffiliateCommission, type CashoutRequest, type AffiliateReferral } from '@/lib/api';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { KycStatusBanner } from '@/components/dashboard/KycStatusBanner';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

const STATUS_BADGE: Record<string, { cls: string; icon: ElementType }> = {
  pending:    { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  ready:      { cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  paid:       { cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  cancelled:  { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  requested:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  processing: { cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Clock },
  failed:     { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  rejected:   { cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('affiliate');
  const cfg = STATUS_BADGE[status] ?? { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock };
  const Icon = cfg.icon;
  const label = STATUS_BADGE[status] ? t(status as any) : status;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function AffiliatePage() {
  const t = useTranslations('affiliate');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'commissions' | 'cashouts' | 'referrals' | 'tree'>('referrals');
  const [commissionFilter, setCommissionFilter] = useState<string>('all');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendLanguage, setFriendLanguage] = useState('en');
  const [friendMessage, setFriendMessage] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  const { data: dashboard, isLoading } = useQuery<AffiliateDashboard>({
    queryKey: ['affiliate-dashboard'],
    queryFn: async () => { const { data } = await affiliateApi.getDashboard(); return data; },
  });

  const { data: commissions = [] } = useQuery<AffiliateCommission[]>({
    queryKey: ['affiliate-commissions', commissionFilter],
    queryFn: async () => {
      const { data } = await affiliateApi.listCommissions({
        status: commissionFilter !== 'all' ? commissionFilter : undefined,
        limit: 100,
      });
      return data;
    },
  });

  const { data: cashouts = [] } = useQuery<CashoutRequest[]>({
    queryKey: ['affiliate-cashouts'],
    queryFn: async () => { const { data } = await affiliateApi.listCashouts(); return data; },
  });

  const { data: referralsData } = useQuery<{ referrals: AffiliateReferral[]; total: number }>({
    queryKey: ['affiliate-referrals'],
    queryFn: async () => { const { data } = await affiliateApi.listReferrals({ limit: 100 }); return data; },
  });
  const referrals = referralsData?.referrals ?? [];

  const { data: treeData } = useQuery<{ nodes: { user_id: string; name: string; plan: string; level: number }[] }>({
    queryKey: ['affiliate-tree'],
    queryFn: async () => { const { data } = await affiliateApi.getTree(); return data; },
    enabled: activeTab === 'tree',
  });
  const treeNodes = treeData?.nodes ?? [];

  async function handleExportCSV() {
    try {
      const { data } = await affiliateApi.exportCommissions();
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
      const { data } = await affiliateApi.inviteFriend({
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
    onError: (err: any) => {
      toast({ variant: 'destructive', title: t('error'), description: getErrorMessage(err, t('inviteError')) });
    },
  });

  const copyLink = async () => {
    if (!dashboard?.referral_url) return;
    try {
      await navigator.clipboard.writeText(dashboard.referral_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const balance = dashboard?.balance ?? 0;
  const threshold = dashboard?.cashout_threshold ?? 0;

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
            ) : (
              <>
                {/* KYC (revirement PDG 2026-08-05) : la page n'est plus verrouillée
                    pour un compte non vérifié — l'utilisateur peut déjà partager son
                    lien de parrainage, seul le versement réel des commissions reste
                    conditionné à la vérification (voir _accrue_commission côté
                    backend). Simple bannière de statut, jamais bloquante. */}
                {!dashboard?.can_access_affiliate && (
                  <KycStatusBanner variant="banner" />
                )}

                {/* Wallet required banner */}
                {!dashboard?.has_wallet && (
                  <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative h-11 w-11 shrink-0">
                      <span className="absolute inset-0 rounded-xl bg-amber-500 animate-ping opacity-30" />
                      <div className="relative h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-900 dark:text-amber-200 text-[14px]">{t('walletRequiredTitle')}</p>
                      <p className="text-[12.5px] text-amber-700 dark:text-amber-400 mt-0.5">{t('walletRequiredDesc')}</p>
                    </div>
                    <Link
                      href={`/${locale}/profile`}
                      className="shrink-0 flex items-center justify-center px-4 py-2.5 rounded-xl bg-amber-600 text-white text-[12.5px] font-semibold hover:bg-amber-700 transition-colors"
                    >
                      {t('walletRequiredCta')}
                    </Link>
                  </div>
                )}

                {/* Waiting for auto-payout threshold banner */}
                {dashboard?.has_wallet && balance > 0 && balance < threshold && (
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="relative h-11 w-11 shrink-0">
                      <span className="absolute inset-0 rounded-xl bg-blue-500 animate-ping opacity-30" />
                      <div className="relative h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900 dark:text-blue-200 text-[14px]">{t('waitingThresholdTitle')}</p>
                      <p className="text-[12.5px] text-blue-700 dark:text-blue-400 mt-0.5">
                        {t('waitingThresholdDesc', { min: fmtCurrency(threshold) })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats */}
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

                {/* Referral link — la carte cashout manuel a été retirée (paiement
                    désormais 100% automatique dès le seuil atteint, décision PDG
                    2026-08-06) : ce lien n'a donc plus besoin de partager la
                    largeur avec un bouton d'action devenu inutile. */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-6">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-blue-600" />
                    {t('yourLink')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">{t('yourCode')}</label>
                      <span className="font-mono text-3xl font-black text-slate-900 dark:text-slate-100 tracking-widest">
                        {dashboard?.affiliate_code ?? '—'}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">{t('yourLink')}</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-sm text-slate-600 dark:text-slate-400 truncate">
                          {dashboard?.referral_url ?? '—'}
                        </div>
                        <button
                          onClick={copyLink}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? t('copied') : t('copyLink')}
                        </button>
                      </div>
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
                                {[t('refName'), t('refPlan'), t('refJoined'), t('refCommissions')].map(h => (
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
                                return (
                                  <tr key={r.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                      <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{r.email}</p>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${planColors[r.plan] ?? planColors.free}`}>
                                        {r.plan}
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
                                    <div key={node.user_id}
                                      className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5"
                                      style={{ marginLeft: `${(level - 1) * 16}px` }}
                                    >
                                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${level === 1 ? 'bg-blue-600' : level === 2 ? 'bg-violet-600' : 'bg-slate-500'}`}>
                                        L{level}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</p>
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
                            {f === 'all' ? t('filterAll') : t(f as any)}
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
                                {[t('member'), t('source'), t('level'), t('amount'), t('status'), t('date')].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {commissions.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                    {c.source_user_name ?? '—'}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 capitalize">
                                    {c.source_type === 'subscription' ? t('subscription') : t('ad_slot')}
                                  </td>
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
                                {[t('cashoutGross'), t('cashoutFee'), t('cashoutNet'), t('status'), t('cashoutRequestedCol'), t('cashoutProcessedCol')].map(h => (
                                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cashouts.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
