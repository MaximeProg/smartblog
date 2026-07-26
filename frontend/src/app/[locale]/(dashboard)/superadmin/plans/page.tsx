'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  CreditCard, Users, DollarSign, TrendingUp, RefreshCw,
  Plus, Pencil, X, Check, AlertTriangle, Layers, Loader2,
} from 'lucide-react';
import { superadminApi, type SAPlanStat, type SAPlanConfig, type SAPlanCreateBody } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', starter: '#3b82f6', pro: '#8b5cf6', business: '#f59e0b', enterprise: '#ef4444',
};

// Hardcoded plan limits — comparison table always shows these regardless of API status
// (la clé "analytics" est une clé de traduction, résolue au rendu — pas les autres,
// qui sont déjà des valeurs affichables telles quelles : nombres, tailles, "∞".)
const PLAN_LIMITS: Record<string, Record<string, string>> = {
  free:       { articles: '10',  storage: '500 MB', members: '1',  ai: '10/mo',   domain: '—',  analytics: 'analyticsBasic' },
  starter:    { articles: '100', storage: '2 GB',   members: '3',  ai: '100/mo',  domain: '1',  analytics: 'analyticsStandard' },
  pro:        { articles: '∞',   storage: '10 GB',  members: '10', ai: '500/mo',  domain: '5',  analytics: 'analyticsAdvanced' },
  business:   { articles: '∞',   storage: '50 GB',  members: '∞',  ai: '2000/mo', domain: '∞',  analytics: 'analyticsFull' },
  enterprise: { articles: '∞',   storage: '∞',      members: '∞',  ai: '∞',       domain: '∞',  analytics: 'analyticsFullApi' },
};

const PLAN_ORDER = ['free', 'starter', 'pro', 'business', 'enterprise'] as const;
const FEATURE_KEYS = ['articles', 'storage', 'members', 'ai', 'domain', 'analytics'] as const;
const FEATURE_LABEL_KEYS: Record<string, string> = {
  articles: 'featureArticles', storage: 'featureStorage', members: 'featureMembers',
  ai: 'featureAi', domain: 'featureDomain', analytics: 'featureAnalytics',
};

type ModalMode = 'create' | 'edit' | null;

function fmtLimit(v: number) { return v === -1 ? '∞' : String(v); }
function fmtStorage(mb: number) {
  if (mb === -1) return '∞';
  if (mb >= 1024) return `${mb / 1024} GB`;
  return `${mb} MB`;
}

// ── Field wrapper — defined OUTSIDE PlanModal so it never remounts on re-render
function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold" style={{ color: 'var(--sa-text-2)' }}>{label}</label>
      {hint && <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30";
const inputStyle = { borderColor: 'var(--sa-border)', color: 'var(--sa-text)' } as React.CSSProperties;

// ── Plan Modal ──────────────────────────────────────────────────────
function PlanModal({
  mode, plan, onClose, onSave, isPending,
}: {
  mode: ModalMode;
  plan?: SAPlanConfig;
  onClose: () => void;
  onSave: (body: SAPlanCreateBody & { id?: string }, id?: string) => void;
  isPending?: boolean;
}) {
  const tp = useTranslations('superAdmin.plans');
  const [form, setForm] = useState({
    id:                 plan?.id ?? '',
    name:               plan?.name ?? '',
    description:        plan?.description ?? '',
    price_monthly:      plan?.price_monthly ?? 0,
    price_yearly:       plan?.price_yearly ?? 0,
    max_articles:       plan?.max_articles ?? 10,
    max_storage_mb:     plan?.max_storage_mb ?? 512,
    max_members:        plan?.max_members ?? 1,
    max_ai_requests:    plan?.max_ai_requests ?? 10,
    max_custom_domains: plan?.max_custom_domains ?? 0,
    features:           plan?.features.join('\n') ?? '',
    sort_order:         plan?.sort_order ?? 0,
    is_active:          plan?.is_active ?? true,
  });

  function handleSubmit() {
    onSave({
      id:                 form.id,
      name:               form.name,
      description:        form.description,
      price_monthly:      Number(form.price_monthly),
      price_yearly:       Number(form.price_yearly),
      max_articles:       Number(form.max_articles),
      max_storage_mb:     Number(form.max_storage_mb),
      max_members:        Number(form.max_members),
      max_ai_requests:    Number(form.max_ai_requests),
      max_custom_domains: Number(form.max_custom_domains),
      features:           form.features.split('\n').map(f => f.trim()).filter(Boolean),
      sort_order:         Number(form.sort_order),
      is_active:          form.is_active,
    }, plan?.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
          <h2 className="text-[15px] font-black" style={{ color: 'var(--sa-text)' }}>
            {mode === 'create' ? tp('createTitle') : tp('editTitle')}
          </h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--sa-surface)]" style={{ color: 'var(--sa-text-3)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label={tp('planId')} hint={mode === 'edit' ? undefined : tp('planIdHint')}>
              <input
                value={form.id}
                disabled={mode === 'edit'}
                onChange={e => setForm(s => ({ ...s, id: e.target.value }))}
                className={inputCls + (mode === 'edit' ? ' opacity-50' : '')}
                style={inputStyle}
              />
            </F>
            <F label={tp('planName')}>
              <input
                value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                className={inputCls}
                style={inputStyle}
              />
            </F>
          </div>

          <F label={tp('description')}>
            <input
              value={form.description}
              onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
              className={inputCls}
              style={inputStyle}
            />
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label={tp('priceMonthly')}>
              <input
                type="number" value={form.price_monthly} min={0}
                onChange={e => setForm(s => ({ ...s, price_monthly: Number(e.target.value) }))}
                className={inputCls} style={inputStyle}
              />
            </F>
            <F label={tp('priceYearly')}>
              <input
                type="number" value={form.price_yearly} min={0}
                onChange={e => setForm(s => ({ ...s, price_yearly: Number(e.target.value) }))}
                className={inputCls} style={inputStyle}
              />
            </F>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'max_articles',      label: tp('maxArticles') },
              { key: 'max_storage_mb',    label: tp('maxStorageMb') },
              { key: 'max_members',       label: tp('maxMembers') },
              { key: 'max_ai_requests',   label: tp('maxAiRequests') },
              { key: 'max_custom_domains', label: tp('maxDomains') },
              { key: 'sort_order',        label: tp('sortOrder') },
            ] as const).map(({ key, label }) => (
              <F key={key} label={label}>
                <input
                  type="number"
                  value={(form as Record<string, number | string | boolean>)[key] as number}
                  onChange={e => setForm(s => ({ ...s, [key]: Number(e.target.value) }))}
                  className={inputCls} style={inputStyle}
                />
              </F>
            ))}
          </div>

          <F label={tp('features')} hint={tp('featuresHint')}>
            <textarea
              value={form.features}
              rows={4}
              onChange={e => setForm(s => ({ ...s, features: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
            />
          </F>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm(s => ({ ...s, is_active: !s.is_active }))}
              className={`relative h-5 w-9 rounded-full transition-colors ${form.is_active ? 'bg-[#6366f1]' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-[12px] font-medium" style={{ color: 'var(--sa-text-2)' }}>{tp('isActive')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: 'var(--sa-border)' }}>
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border text-[13px] font-medium hover:bg-[var(--sa-surface)] transition-colors"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}
          >
            {tp('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="h-9 px-5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-70 flex items-center gap-1.5"
            style={{ background: '#6366f1' }}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {tp('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export default function PlansPage() {
  const t  = useTranslations('superAdmin');
  const tp = useTranslations('superAdmin.plans');
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'stats' | 'manage'>('stats');
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingPlan, setEditingPlan] = useState<SAPlanConfig | undefined>();

  // Stats query — fetches tenant counts per plan + MRR
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['sa-plans-stats'],
    queryFn: () => superadminApi.plansStats().then(r => r.data),
  });

  // Plans list query — reads from subscription_plans table (only needed on manage tab)
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['sa-plans-list'],
    queryFn: () => superadminApi.listPlans().then(r => r.data),
    enabled: tab === 'manage',
  });

  const { mutate: savePlan, isPending: savingPlan } = useMutation({
    mutationFn: async ({ body, planId }: { body: SAPlanCreateBody & { id?: string }; planId?: string }) => {
      if (planId) {
        await superadminApi.updatePlan(planId, body);
        return 'updated';
      } else {
        await superadminApi.createPlan(body as SAPlanCreateBody & { id: string });
        return 'created';
      }
    },
    onSuccess: (result) => {
      toast({ title: result === 'created' ? tp('created') : tp('updated') });
      qc.invalidateQueries({ queryKey: ['sa-plans-list'] });
      qc.invalidateQueries({ queryKey: ['sa-plans-stats'] });
      setModal(null);
    },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  const { mutate: deactivate, isPending: deactivating } = useMutation({
    mutationFn: (planId: string) => superadminApi.deactivatePlan(planId),
    onSuccess: () => {
      toast({ title: tp('deactivated') });
      qc.invalidateQueries({ queryKey: ['sa-plans-list'] });
    },
    onError: (err: any) => toast({ title: t('common.error'), variant: 'destructive', description: getErrorMessage(err, '') }),
  });

  // Build stats lookup map (planId → {count, mrr}) for overlay on comparison table
  const statsMap: Record<string, SAPlanStat> = {};
  for (const p of statsData?.plans ?? []) statsMap[p.id] = p;

  const totalMrr   = statsData?.total_mrr ?? 0;
  const totalUsers = statsData?.total_tenants ?? 0;
  const arpu       = statsData?.arpu ?? 0;
  const dbPlans    = plansData?.plans ?? [];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tp('breadcrumb')}</span>
          </div>
          <h1 className="text-[22px] font-black" style={{ color: 'var(--sa-text)' }}>{tp('title')}</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tp('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'manage' && (
            <button
              onClick={() => { setEditingPlan(undefined); setModal('create'); }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: '#6366f1' }}
            >
              <Plus className="h-4 w-4" /> {tp('createPlan')}
            </button>
          )}
          <button
            onClick={() => tab === 'manage' ? refetchPlans() : undefined}
            className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: 'var(--sa-border)' }}>
        {(['stats', 'manage'] as const).map(id => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold transition-colors"
            style={{
              color: tab === id ? 'var(--sa-text)' : 'var(--sa-text-3)',
              borderBottom: tab === id ? '2px solid #6366f1' : '2px solid transparent',
            }}>
            {id === 'stats' ? <TrendingUp className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
            {tp(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {/* ── STATISTICS TAB ── */}
      {tab === 'stats' && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: tp('revenue.mrr'),  value: statsLoading ? '…' : `$${totalMrr.toLocaleString()}`,  icon: DollarSign, color: '#10b981' },
              { label: tp('revenue.arpu'), value: statsLoading ? '…' : `$${arpu.toFixed(2)}`,            icon: TrendingUp, color: '#6366f1' },
              { label: t('stats.tenants'), value: statsLoading ? '…' : String(totalUsers),               icon: Users,      color: '#f59e0b' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border px-5 py-4" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
                <k.icon className="h-5 w-5 mb-2" style={{ color: k.color }} />
                <p className="text-[24px] font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>{k.value}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Per-plan tenant count cards — only when stats are loaded */}
          {!statsLoading && Object.keys(statsMap).length > 0 && (
            <div className="grid grid-cols-5 gap-3 mb-6">
              {PLAN_ORDER.map(planId => {
                const p = statsMap[planId];
                if (!p) return null;
                const maxCount = Math.max(...Object.values(statsMap).map(x => x.count), 1);
                return (
                  <div key={planId} className="rounded-xl border p-4" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLAN_COLORS[planId] ?? '#64748b' }} />
                      <span className="text-[13px] font-bold capitalize" style={{ color: 'var(--sa-text)' }}>
                        {tp(planId as Parameters<typeof tp>[0])}
                      </span>
                    </div>
                    <p className="text-[28px] font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>{p.count}</p>
                    <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{t('stats.tenants')}</p>
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sa-surface)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round((p.count / maxCount) * 100)}%`, background: PLAN_COLORS[planId] }} />
                    </div>
                    <p className="text-[12px] font-semibold mt-2" style={{ color: PLAN_COLORS[planId] }}>
                      ${p.mrr.toLocaleString()} MRR
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison table — always rendered from PLAN_LIMITS (hardcoded), not from API */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--sa-border)' }}>
              <h3 className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{tp('viewTable')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sa-border)' }}>
                    <th className="px-5 py-3 text-left font-semibold" style={{ color: 'var(--sa-text-3)', minWidth: '110px' }}>{tp('featureHeader')}</th>
                    {PLAN_ORDER.map(planId => (
                      <th key={planId} className="px-5 py-3 text-center font-semibold capitalize" style={{ color: PLAN_COLORS[planId] }}>
                        {tp(planId as Parameters<typeof tp>[0])}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_KEYS.map(feat => (
                    <tr key={feat} style={{ borderBottom: '1px solid var(--sa-border)' }}>
                      <td className="px-5 py-2.5 font-medium capitalize" style={{ color: 'var(--sa-text-2)' }}>{tp(FEATURE_LABEL_KEYS[feat] as any)}</td>
                      {PLAN_ORDER.map(planId => (
                        <td key={planId} className="px-5 py-2.5 text-center tabular-nums" style={{ color: 'var(--sa-text-3)' }}>
                          {feat === 'analytics'
                            ? tp((PLAN_LIMITS[planId]?.[feat] ?? 'analyticsBasic') as any)
                            : PLAN_LIMITS[planId]?.[feat] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MANAGE TAB ── */}
      {tab === 'manage' && (
        plansLoading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : dbPlans.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <Layers className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tp('noPlansFound')}</p>
            <p className="text-[12px] mt-1 mb-4" style={{ color: 'var(--sa-text-3)' }}>{tp('noPlansFoundDesc')}</p>
            <button
              onClick={() => { setEditingPlan(undefined); setModal('create'); }}
              className="h-9 px-5 rounded-xl text-[13px] font-bold text-white"
              style={{ background: '#6366f1' }}
            >
              <Plus className="h-3.5 w-3.5 inline mr-1.5" /> {tp('createPlan')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {dbPlans.map((plan: SAPlanConfig) => (
              <div key={plan.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Color badge */}
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-[13px] font-black"
                    style={{ background: PLAN_COLORS[plan.id] ?? '#6366f1' }}
                  >
                    {plan.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-black" style={{ color: 'var(--sa-text)' }}>{plan.name}</span>
                      {plan.is_default && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#6366f1]/10 text-[#6366f1]">{tp('defaultBadge')}</span>
                      )}
                      {!plan.is_active && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500">{tp('inactiveBadge')}</span>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--sa-text-3)' }}>
                      {plan.description} · <span style={{ color: 'var(--sa-text-2)' }}>${plan.price_monthly}/mo</span>
                    </p>
                  </div>

                  {/* Limits summary */}
                  <div className="hidden lg:flex items-center gap-5 text-[11px]">
                    {[
                      { label: tp('featureArticles'), v: fmtLimit(plan.max_articles) },
                      { label: tp('featureStorage'),  v: fmtStorage(plan.max_storage_mb) },
                      { label: tp('featureMembers'),  v: fmtLimit(plan.max_members) },
                      { label: tp('featureAi'),       v: fmtLimit(plan.max_ai_requests) + '/mo' },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className="font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>{item.v}</p>
                        <p style={{ color: 'var(--sa-text-3)' }}>{item.label}</p>
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>{plan.subscriber_count}</p>
                      <p style={{ color: 'var(--sa-text-3)' }}>{tp('subscribersLabel')}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setEditingPlan(plan); setModal('edit'); }}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-semibold hover:bg-[var(--sa-surface)] transition-colors"
                      style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> {tp('editPlan')}
                    </button>
                    {!plan.is_default && plan.is_active && (
                      <button
                        disabled={deactivating}
                        onClick={() => deactivate(plan.id)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-amber-500/10 disabled:opacity-50"
                        style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}
                      >
                        {deactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        {tp('deactivate')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Feature pills */}
                {plan.features.length > 0 && (
                  <div className="px-5 pb-4 flex flex-wrap gap-2">
                    {plan.features.map((f: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: 'var(--sa-surface)', color: 'var(--sa-text-2)' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal */}
      {modal && (
        <PlanModal
          mode={modal}
          plan={editingPlan}
          isPending={savingPlan}
          onClose={() => { if (!savingPlan) setModal(null); }}
          onSave={(body, planId) => savePlan({ body, planId })}
        />
      )}
    </div>
  );
}
