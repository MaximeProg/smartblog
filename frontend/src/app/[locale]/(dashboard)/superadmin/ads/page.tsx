'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Check, X, Clock, ExternalLink, Shield, AlertTriangle,
  ChevronDown, ChevronUp, DollarSign, Mail, Building2, Globe,
  Eye, MousePointer, CreditCard, RefreshCw,
} from 'lucide-react';
import { superadminApi, type SuperAdminAdView } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ── Helpers ───────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtBudget(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ── Badge components ──────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:         'bg-amber-500/15 text-amber-400 border-amber-500/20',
  approved:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  rejected:        'bg-red-500/15 text-red-400 border-red-500/20',
  payment_pending: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  paid:            'bg-violet-500/15 text-violet-400 border-violet-500/20',
  expired:         'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
  payment_pending: 'Paiement en attente', paid: 'Payée', expired: 'Expirée',
};

const SAFETY_COLOR: Record<string, string> = {
  safe:      'text-emerald-400',
  dangerous: 'text-red-400',
  unknown:   'text-slate-400',
  unchecked: 'text-slate-500',
  scanning:  'text-amber-400',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[status] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SafetyIcon({ status }: { status: string }) {
  const cls = `h-3.5 w-3.5 ${SAFETY_COLOR[status] ?? 'text-slate-400'}`;
  if (status === 'dangerous') return <AlertTriangle className={cls} />;
  if (status === 'safe') return <Shield className={cls} />;
  return <Shield className={cls} />;
}

// ── Ad row (expandable) ───────────────────────────────────────────

function AdRow({
  ad,
  onApprove,
  onReject,
  isPending,
}: {
  ad: SuperAdminAdView;
  onApprove: (id: string, tenantId: string) => void;
  onReject:  (id: string, tenantId: string, reason: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded]       = useState(false);
  const [rejecting, setRejecting]     = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isPendingAd = ad.submission_status === 'pending';
  const isDangerous = ad.link_safety_status === 'dangerous';

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-900 cursor-pointer hover:bg-slate-800/60 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Blog badge */}
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-rose-600/15 text-rose-400 border border-rose-600/20">
          {ad.tenant_name}
        </span>

        {/* Ad title */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-100 truncate">{ad.title}</p>
          <p className="text-[11px] text-slate-500 truncate">{ad.advertiser_name} · {ad.advertiser_email}</p>
        </div>

        {/* Budget */}
        {ad.total_budget && (
          <span className="shrink-0 text-[12px] font-bold text-emerald-400">{fmtBudget(ad.total_budget)}</span>
        )}

        {/* Safety */}
        <SafetyIcon status={ad.link_safety_status} />

        {/* Status */}
        <StatusBadge status={ad.submission_status} />

        {/* Date */}
        <span className="shrink-0 text-[11px] text-slate-500">{fmtDate(ad.created_at)}</span>

        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-slate-950 px-4 py-4 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[12px]">
            <DetailItem icon={Building2} label="Entreprise" value={ad.advertiser_company ?? '—'} />
            <DetailItem icon={Globe}    label="URL cible"
              value={
                <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1 truncate">
                  {ad.click_url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              }
            />
            <DetailItem icon={DollarSign} label="Budget total"    value={fmtBudget(ad.total_budget)} />
            <DetailItem icon={DollarSign} label="Prix / jour"     value={fmtBudget(ad.price_per_day)} />
            <DetailItem icon={Eye}        label="Impressions"      value={ad.impressions_count.toLocaleString()} />
            <DetailItem icon={MousePointer} label="Clics"          value={ad.clicks_count.toLocaleString()} />
            {ad.placement && <DetailItem icon={Megaphone} label="Placement" value={ad.placement} />}
            {ad.starts_at && <DetailItem icon={Clock} label="Début"   value={fmtDate(ad.starts_at)} />}
            {ad.ends_at   && <DetailItem icon={Clock} label="Fin"     value={fmtDate(ad.ends_at)} />}
          </div>

          {ad.description && (
            <p className="text-[12px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">{ad.description}</p>
          )}

          {ad.image_url && (
            <div className="border-t border-slate-800 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Visuel</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.image_url} alt="Ad visual" className="h-32 rounded-lg object-cover border border-slate-800" />
            </div>
          )}

          {isDangerous && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800 text-[12px] text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Le lien de cet annonceur a été signalé comme <strong>dangereux</strong>. Approbation bloquée.
            </div>
          )}

          {ad.payment_link_url && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-800">
              <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-blue-300 mb-0.5">Lien de paiement généré</p>
                <p className="text-[11px] text-blue-400 truncate">{ad.payment_link_url}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(ad.payment_link_url!)}
                className="shrink-0 text-[11px] font-bold text-blue-400 hover:text-blue-300 border border-blue-700 rounded-lg px-2 py-1 hover:border-blue-500 transition-colors"
              >
                Copier
              </button>
            </div>
          )}

          {/* Actions */}
          {isPendingAd && (
            <div className="border-t border-slate-800 pt-3 space-y-3">
              {rejecting ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Motif de rejet (obligatoire)…"
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!rejectReason.trim() || isPending}
                      onClick={() => onReject(ad.id, ad.tenant_id, rejectReason)}
                      className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40"
                    >
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => setRejecting(false)}
                      className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[13px] font-bold transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    disabled={isDangerous || isPending}
                    onClick={() => onApprove(ad.id, ad.tenant_id)}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-40"
                  >
                    <Check className="h-3.5 w-3.5" /> Approuver
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => setRejecting(true)}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/30 text-[13px] font-bold transition-colors disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" /> Rejeter
                  </button>
                </div>
              )}
            </div>
          )}

          {ad.rejection_reason && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[12px] text-red-400">
              <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span><strong>Motif :</strong> {ad.rejection_reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 leading-none mb-0.5">{label}</p>
        <p className="text-slate-300 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

const TABS = [
  { key: 'pending',  label: 'En attente' },
  { key: '',         label: 'Toutes' },
  { key: 'approved', label: 'Approuvées' },
  { key: 'rejected', label: 'Rejetées' },
];

export default function SuperAdminAdsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ['superadmin-ads', activeTab],
    queryFn: () => superadminApi.listAllAds({ status: activeTab || undefined, limit: 100 }).then(r => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, tenantId, decision, reason }: { id: string; tenantId: string; decision: 'approved' | 'rejected'; reason?: string }) =>
      superadminApi.reviewAd(tenantId, id, decision, reason),
    onSuccess: (_, vars) => {
      toast({ title: vars.decision === 'approved' ? 'Publicité approuvée' : 'Publicité rejetée' });
      qc.invalidateQueries({ queryKey: ['superadmin-ads'] });
    },
    onError: (e: any) => {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.response?.data?.detail ?? 'Une erreur est survenue.' });
    },
  });

  const pendingCount = ads.filter(a => a.submission_status === 'pending').length;

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-600/15 border border-amber-600/20 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-slate-100 leading-none">Publicités</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">Validation des demandes annonceurs de tous les blogs</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[12px] font-semibold transition-colors border border-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'En attente', value: ads.filter(a => a.submission_status === 'pending').length, color: 'text-amber-400' },
          { label: 'Approuvées', value: ads.filter(a => a.submission_status === 'approved').length, color: 'text-emerald-400' },
          { label: 'Rejetées',   value: ads.filter(a => a.submission_status === 'rejected').length, color: 'text-red-400' },
          { label: 'Total',      value: ads.length, color: 'text-slate-300' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-3">
            <p className={`text-[22px] font-black ${s.color} leading-none`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-800 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[13px] font-bold transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-black px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="h-6 w-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-500">Chargement…</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="py-24 text-center">
          <Megaphone className="h-12 w-12 text-slate-800 mx-auto mb-4" />
          <p className="text-[14px] font-bold text-slate-500">
            {activeTab === 'pending' ? 'Aucune publicité en attente de validation.' : 'Aucune publicité trouvée.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ads.map(ad => (
            <AdRow
              key={ad.id}
              ad={ad}
              isPending={reviewMutation.isPending}
              onApprove={(id, tenantId) =>
                reviewMutation.mutate({ id, tenantId, decision: 'approved' })
              }
              onReject={(id, tenantId, reason) =>
                reviewMutation.mutate({ id, tenantId, decision: 'rejected', reason })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
