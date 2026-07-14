'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Search, Globe, Calendar,
  ExternalLink, AlertCircle, RefreshCw, ChevronDown, Loader2, X,
} from 'lucide-react';
import { superadminApi, type TenantAdminView } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import SAPagination from '@/components/superadmin/SAPagination';

type PlanTier = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtBytes(b: number) {
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let v = b;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${units[i]}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_CFG: Record<string, { cls: string }> = {
  active:       { cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  suspended:    { cls: 'text-amber-500  bg-amber-500/10  border-amber-500/20' },
  grace_period: { cls: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  deleted:      { cls: 'text-red-500    bg-red-500/10    border-red-500/20' },
};

// ── Confirm modal ──────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel, isPending, t }: {
  message: string; onConfirm: () => void; onCancel: () => void;
  isPending?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border p-5 shadow-2xl" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--sa-text)' }}>{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 h-9 rounded-xl border text-[12px] font-semibold hover:bg-[var(--sa-surface)] disabled:opacity-50"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan change modal ──────────────────────────────────────────────────────

function PlanModal({ tenant, onConfirm, onCancel, isPending, t }: {
  tenant: TenantAdminView; onConfirm: (plan: string) => void; onCancel: () => void;
  isPending?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const [plan, setPlan] = useState(tenant.plan as string);
  const plans: PlanTier[] = ['free', 'starter', 'pro', 'business', 'enterprise'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border p-5 shadow-2xl" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <h3 className="text-[13px] font-black mb-4" style={{ color: 'var(--sa-text)' }}>
          {t('tenants.actions.changePlan')} — {tenant.name}
        </h3>
        <div className="space-y-1.5 mb-5">
          {plans.map(p => (
            <button key={p} onClick={() => setPlan(p)}
              className={`w-full h-9 rounded-xl border text-[12px] font-semibold capitalize transition-all ${plan === p ? 'text-white' : 'hover:bg-[var(--sa-surface)]'}`}
              style={plan === p
                ? { background: '#6366f1', borderColor: '#6366f1' }
                : { borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}>
              {t(`plans.${p}`)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 h-9 rounded-xl border text-[12px] font-semibold hover:bg-[var(--sa-surface)] disabled:opacity-50"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            {t('common.cancel')}
          </button>
          <button onClick={() => onConfirm(plan)} disabled={isPending}
            className="flex-1 h-9 rounded-xl text-white text-[12px] font-bold flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: '#6366f1' }}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const t  = useTranslations('superAdmin');
  const tt = useTranslations('superAdmin.tenants');
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [q, setQ]       = useState('');
  const [search, setSrch] = useState('');
  const [planF, setPlanF] = useState('all');
  const [page, setPage]   = useState(1);
  const [confirm, setCfm]    = useState<{ msg: string; fn: () => void } | null>(null);
  const [planModal, setPlanModal] = useState<TenantAdminView | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['superadmin-tenants', planF, search, page],
    queryFn:  () => superadminApi.listTenants({
      plan: planF === 'all' ? undefined : planF,
      q: search || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const tenants = data?.items ?? [];
  const total   = data?.total ?? 0;

  const mutSuspend  = useMutation({
    mutationFn: (id: string) => superadminApi.suspendTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); setCfm(null); toast({ title: '✓', description: 'Blog suspended.' }); },
  });
  const mutActivate = useMutation({
    mutationFn: (id: string) => superadminApi.activateTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); setCfm(null); toast({ title: '✓', description: 'Blog activated.' }); },
  });
  const mutDelete   = useMutation({
    mutationFn: (id: string) => superadminApi.deleteTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); setCfm(null); toast({ title: '✓', description: 'Blog deleted.' }); },
  });
  const mutPlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => superadminApi.changePlan(id, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); setPlanModal(null); toast({ title: '✓', description: tt('planChanged') }); },
  });

  const anyMutPending = mutSuspend.isPending || mutActivate.isPending || mutDelete.isPending || mutPlan.isPending;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSrch(q);
    setPage(1);
  }

  const planNames = ['all', 'free', 'starter', 'pro', 'business', 'enterprise'];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tt('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tt('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {isLoading ? t('common.loading') : `${total} blogs`}
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[12px] font-semibold transition-all hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--sa-text-3)' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={tt('searchPlaceholder')}
              className="h-9 pl-9 pr-4 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30 w-56"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)', background: 'var(--sa-surface)' }} />
          </div>
          <button type="submit" className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white" style={{ background: '#6366f1' }}>
            {t('common.search') ?? 'Search'}
          </button>
          {search && (
            <button type="button" onClick={() => { setQ(''); setSrch(''); setPage(1); }}
              className="h-9 w-9 flex items-center justify-center rounded-xl border transition-colors hover:bg-[var(--sa-surface)]"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-1 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
          {planNames.map(p => (
            <button key={p} onClick={() => { setPlanF(p); setPage(1); }}
              className="h-8 px-3 text-[10px] font-semibold transition-colors capitalize"
              style={planF === p
                ? { background: '#6366f1', color: '#fff' }
                : { color: 'var(--sa-text-3)' }}>
              {p === 'all' ? t('common.all') : t(`plans.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-4 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[12px]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {t('common.error')}
          <button onClick={() => refetch()} className="ml-auto underline">{t('common.retry')}</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-20 text-center text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.noResults')}</div>
        ) : (
          <div className="divide-y divide-[var(--sa-divider)]">
            {tenants.map(tenant => {
              const sc = STATUS_CFG[tenant.status] ?? STATUS_CFG.deleted;
              return (
                <div key={tenant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--sa-surface)] transition-colors">
                  {/* Icon */}
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--sa-surface)', border: '1px solid var(--sa-border)' }}>
                    <Building2 className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
                  </div>

                  {/* Name & url */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] font-bold" style={{ color: 'var(--sa-text)' }}>{tenant.name}</p>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border ${sc.cls}`}>
                        {t(`status.${tenant.status}`)}
                      </span>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-md capitalize"
                        style={{ background: 'var(--sa-surface)', border: '1px solid var(--sa-border)', color: 'var(--sa-text-3)' }}>
                        {t(`plans.${tenant.plan}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[9px]" style={{ color: 'var(--sa-text-3)' }}>
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {tenant.slug}.smarterbloggers.com</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 shrink-0">
                    <span className="text-center">
                      <p className="text-[13px] font-black font-mono" style={{ color: 'var(--sa-text-2)' }}>{tenant.articles_count}</p>
                      <p className="text-[8px]" style={{ color: 'var(--sa-text-3)' }}>{tt('articles')}</p>
                    </span>
                    <span className="text-center">
                      <p className="text-[13px] font-black font-mono" style={{ color: 'var(--sa-text-2)' }}>{tenant.subscribers_count}</p>
                      <p className="text-[8px]" style={{ color: 'var(--sa-text-3)' }}>{tt('members')}</p>
                    </span>
                    <span className="text-center">
                      <p className="text-[11px] font-mono" style={{ color: 'var(--sa-text-3)' }}>{fmtBytes(tenant.storage_used_bytes)}</p>
                      <p className="text-[8px]" style={{ color: 'var(--sa-text-3)' }}>{tt('storage')}</p>
                    </span>
                  </div>

                  {/* Date */}
                  <span className="hidden lg:flex text-[9px] font-mono shrink-0 items-center gap-1" style={{ color: 'var(--sa-text-3)' }}>
                    <Calendar className="h-3 w-3" /> {fmtDate(tenant.created_at as unknown as string)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {tenant.status === 'active' ? (
                      <button
                        disabled={anyMutPending}
                        onClick={() => setCfm({ msg: tt('confirmSuspend'), fn: () => mutSuspend.mutate(tenant.id) })}
                        className="h-7 px-2.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 flex items-center gap-1"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', borderColor: 'rgba(245,158,11,0.2)' }}>
                        {mutSuspend.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                        {tt('actions.suspend')}
                      </button>
                    ) : tenant.status === 'suspended' ? (
                      <button
                        disabled={anyMutPending}
                        onClick={() => setCfm({ msg: tt('confirmActivate'), fn: () => mutActivate.mutate(tenant.id) })}
                        className="h-7 px-2.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 flex items-center gap-1"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', borderColor: 'rgba(16,185,129,0.2)' }}>
                        {mutActivate.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : null}
                        {tt('actions.activate')}
                      </button>
                    ) : null}

                    <button
                      disabled={anyMutPending}
                      onClick={() => setPlanModal(tenant)}
                      className="h-7 px-2 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50 hover:bg-[var(--sa-surface)]"
                      style={{ border: '1px solid var(--sa-border)', color: 'var(--sa-text-3)' }}>
                      {mutPlan.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                      {tt('actions.changePlan')}
                    </button>

                    <a href={`https://${tenant.slug}.smarterbloggers.com`} target="_blank" rel="noreferrer"
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--sa-surface)]"
                      style={{ border: '1px solid var(--sa-border)', color: 'var(--sa-text-3)' }}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <button
                      disabled={anyMutPending}
                      onClick={() => setCfm({ msg: tt('confirmDelete'), fn: () => mutDelete.mutate(tenant.id) })}
                      className="h-7 w-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 hover:bg-red-500/20"
                      style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                      {mutDelete.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="text-[14px] font-black leading-none">×</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          isPending={anyMutPending}
          onConfirm={confirm.fn}
          onCancel={() => { if (!anyMutPending) setCfm(null); }}
          t={t}
        />
      )}
      {planModal && (
        <PlanModal
          tenant={planModal}
          isPending={mutPlan.isPending}
          onConfirm={(plan) => mutPlan.mutate({ id: planModal.id, plan })}
          onCancel={() => { if (!mutPlan.isPending) setPlanModal(null); }}
          t={t}
        />
      )}
    </div>
  );
}
