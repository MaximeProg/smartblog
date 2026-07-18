'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch, TrendingUp, Users, DollarSign, Link2, AlertCircle,
  RefreshCw, CheckCircle, XCircle, Clock, ChevronRight, X, Loader2,
} from 'lucide-react';
import { superadminApi, type CashoutAdminView, type SAAffiliateItem } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

// ── Cashout action modal ───────────────────────────────────────────────────

function CashoutModal({ cashout, action, onConfirm, onCancel, isPending, t }: {
  cashout: CashoutAdminView; action: 'approve' | 'reject';
  onConfirm: (ref: string, notes: string) => void; onCancel: () => void;
  isPending?: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const ta = useTranslations('superAdmin.affiliate');
  const [ref, setRef]     = useState('');
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl border p-5 shadow-2xl" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <h3 className="text-[13px] font-black mb-1" style={{ color: 'var(--sa-text)' }}>
          {action === 'approve' ? ta('confirmApprove') : ta('confirmReject')}
        </h3>
        <p className="text-[11px] mb-4" style={{ color: 'var(--sa-text-3)' }}>
          {cashout.user_display_name ?? cashout.user_email} — {ta('cashoutTable.net')} ${cashout.net_amount.toFixed(2)}
          {' '}({ta('cashoutTable.gross')} ${cashout.amount.toFixed(2)})
        </p>
        <div className="space-y-3 mb-5">
          {action === 'approve' && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('payoutRef')}</label>
              <input value={ref} onChange={e => setRef(e.target.value)} placeholder="TXN-001..."
                className="h-9 w-full px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30"
                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
            </div>
          )}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-[#6366f1]/30 resize-none"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={isPending}
            className="flex-1 h-9 rounded-xl border text-[12px] font-semibold hover:bg-[var(--sa-surface)] disabled:opacity-50"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
            {t('common.cancel')}
          </button>
          <button onClick={() => onConfirm(ref, notes)} disabled={isPending}
            className={`flex-1 h-9 rounded-xl text-white text-[12px] font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Affiliate detail modal ─────────────────────────────────────────────────

function AffiliateDetailModal({ aff, onClose, t }: {
  aff: SAAffiliateItem; onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const ta = useTranslations('superAdmin.affiliate');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border shadow-2xl" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--sa-border)' }}>
          <h3 className="text-[13px] font-black" style={{ color: 'var(--sa-text)' }}>{aff.name}</h3>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-[var(--sa-surface)]" style={{ color: 'var(--sa-text-3)' }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label: ta('detail.code'), value: <span className="font-mono font-bold" style={{ color: 'var(--sa-text)' }}>{aff.affiliate_code}</span> },
            { label: ta('detail.email'), value: <span className="font-mono" style={{ color: 'var(--sa-text-2)' }}>{aff.email}</span> },
            { label: ta('detail.plan'), value: <span className="capitalize font-semibold" style={{ color: 'var(--sa-text-2)' }}>{aff.plan}</span> },
          ].map(row => (
            <div key={row.label as string} className="flex justify-between text-[12px]">
              <span style={{ color: 'var(--sa-text-3)' }}>{row.label}</span>
              {row.value}
            </div>
          ))}
          <div className="h-px" style={{ background: 'var(--sa-border)' }} />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: ta('detail.referrals'),  value: String(aff.referral_count),                color: '#3b82f6' },
              { label: ta('detail.balance'),     value: `$${aff.affiliate_balance.toFixed(2)}`,   color: '#10b981' },
              { label: ta('detail.totalEarned'), value: `$${aff.total_earned.toFixed(2)}`,        color: '#6366f1' },
              { label: ta('detail.totalPaid'),   value: `$${aff.total_paid_out.toFixed(2)}`,      color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--sa-surface)' }}>
                <p className="text-[18px] font-black tabular-nums" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[9px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>{item.label}</p>
              </div>
            ))}
          </div>
          {aff.cashout_pending && (
            <div className="flex items-center gap-2 text-amber-500 text-[11px] bg-amber-500/10 px-3 py-2 rounded-lg">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {ta('detail.cashoutPending')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function AffiliatePage() {
  const t  = useTranslations('superAdmin');
  const ta = useTranslations('superAdmin.affiliate');
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [tab, setTab]     = useState<'affiliates' | 'cashouts'>('affiliates');
  const [affPage, setAffPage]   = useState(1);
  const [cashPage, setCashPage] = useState(1);
  const [modal, setModal]       = useState<{ cashout: CashoutAdminView; action: 'approve' | 'reject' } | null>(null);
  const [detailAff, setDetailAff] = useState<SAAffiliateItem | null>(null);

  const { data: affData, isLoading: affLoading, isError: affError, refetch: affRefetch } = useQuery({
    queryKey: ['superadmin-affiliates', affPage],
    queryFn:  () => superadminApi.listAffiliates({ limit: PAGE_SIZE, offset: (affPage - 1) * PAGE_SIZE }).then(r => r.data),
    enabled:  tab === 'affiliates',
  });
  const affiliates  = affData?.affiliates ?? [];
  const affTotal    = affData?.total ?? 0;

  const { data: cashData, isLoading: cashLoading, isError: cashError, refetch: cashRefetch } = useQuery({
    queryKey: ['superadmin-cashouts', cashPage],
    queryFn:  () => superadminApi.listCashouts({ limit: PAGE_SIZE, offset: (cashPage - 1) * PAGE_SIZE }).then(r => r.data),
    enabled:  tab === 'cashouts',
  });
  const cashouts  = cashData?.cashouts ?? [];
  const cashTotal = cashData?.total ?? 0;

  const mutProcess = useMutation({
    mutationFn: ({ id, action, ref, notes }: { id: string; action: 'approve' | 'reject'; ref?: string; notes?: string }) =>
      superadminApi.processCashout(id, action, notes, ref),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['superadmin-cashouts'] });
      setModal(null);
      toast({ title: '✓', description: vars.action === 'approve' ? 'Cashout approved.' : 'Cashout rejected.' });
    },
    onError: () => toast({ title: 'Error', description: t('common.error'), variant: 'destructive' }),
  });

  const CASHOUT_STATUS: Record<string, { icon: typeof CheckCircle; cls: string; label: string }> = {
    requested:  { icon: Clock,       cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20',      label: ta('status.requested') },
    processing: { icon: RefreshCw,   cls: 'text-blue-500  bg-blue-500/10  border-blue-500/20',       label: ta('status.processing') },
    paid:       { icon: CheckCircle, cls: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', label: ta('status.paid') },
    failed:     { icon: XCircle,     cls: 'text-red-500   bg-red-500/10   border-red-500/20',        label: ta('status.failed') },
    rejected:   { icon: XCircle,     cls: 'text-slate-500 bg-slate-500/10 border-slate-500/20',      label: ta('status.rejected') },
  };

  function fmtDate(s: string) { return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ta('breadcrumb')}</span>
        </div>
        <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ta('title')}</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ta('subtitle', { count: affTotal })}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--sa-border)' }}>
        {[['affiliates', ta('tabAffiliates')], ['cashouts', ta('tabCashouts')]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as 'affiliates' | 'cashouts')}
            className="h-10 px-4 text-[12px] font-semibold transition-colors border-b-2"
            style={tab === v
              ? { borderColor: '#6366f1', color: '#6366f1' }
              : { borderColor: 'transparent', color: 'var(--sa-text-3)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Affiliates tab */}
      {tab === 'affiliates' && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          {affLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} /></div>
          ) : affError ? (
            <div className="py-10 flex items-center justify-center gap-2 text-red-500 text-[12px]">
              <AlertCircle className="h-4 w-4" /> {t('common.error')}
              <button onClick={() => affRefetch()} className="underline ml-2">{t('common.retry')}</button>
            </div>
          ) : affiliates.length === 0 ? (
            <div className="py-16 text-center text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{ta('noAffiliates')}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                      {[ta('table.affiliate'), ta('table.code'), ta('table.referrals'), ta('table.revenue'), ta('table.balance'), t('common.actions')].map(h => (
                        <th key={h} className="text-left px-5 py-2.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--sa-divider)]">
                    {affiliates.map((a: SAAffiliateItem) => (
                      <tr key={a.id} className="hover:bg-[var(--sa-surface)] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold" style={{ color: 'var(--sa-text)' }}>{a.name}</p>
                          <p className="text-[9px] font-mono" style={{ color: 'var(--sa-text-3)' }}>{a.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold" style={{ color: 'var(--sa-text-3)' }}>{a.affiliate_code}</td>
                        <td className="px-5 py-3.5 font-bold tabular-nums" style={{ color: 'var(--sa-text-2)' }}>{a.referral_count}</td>
                        <td className="px-5 py-3.5 font-black text-emerald-500 font-mono tabular-nums">${a.total_earned.toFixed(2)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold font-mono tabular-nums ${a.cashout_pending ? 'text-amber-500' : ''}`}
                            style={!a.cashout_pending ? { color: 'var(--sa-text-2)' } : {}}>
                            ${a.affiliate_balance.toFixed(2)}
                          </span>
                          {a.cashout_pending && <span className="ml-1.5 text-[8px] text-amber-500">{ta('pending')}</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setDetailAff(a)}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] border font-semibold hover:bg-[var(--sa-surface)] transition-colors"
                            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
                            {t('common.viewDetails')} <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SAPagination page={affPage} total={affTotal} pageSize={PAGE_SIZE} onChange={setAffPage} loading={affLoading} />
            </>
          )}
        </div>
      )}

      {/* Cashouts tab */}
      {tab === 'cashouts' && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          {cashLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} /></div>
          ) : cashError ? (
            <div className="py-10 flex items-center justify-center gap-2 text-red-500 text-[12px]">
              <AlertCircle className="h-4 w-4" /> {t('common.error')}
              <button onClick={() => cashRefetch()} className="underline ml-2">{t('common.retry')}</button>
            </div>
          ) : cashouts.length === 0 ? (
            <div className="py-20 text-center text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{t('common.noResults')}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                      {[ta('cashoutTable.affiliate'), ta('cashoutTable.amount'), ta('cashoutTable.requested'), ta('cashoutTable.status'), t('common.actions')].map(h => (
                        <th key={h} className="text-left px-5 py-2.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--sa-divider)]">
                    {cashouts.map(c => {
                      const sc = CASHOUT_STATUS[c.status] ?? CASHOUT_STATUS.requested;
                      return (
                        <tr key={c.id} className="hover:bg-[var(--sa-surface)] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold" style={{ color: 'var(--sa-text)' }}>{c.user_display_name ?? c.user_email}</p>
                            <p className="text-[9px] font-mono" style={{ color: 'var(--sa-text-3)' }}>{c.user_email}</p>
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            <p className="font-black text-emerald-500">${c.net_amount.toFixed(2)}</p>
                            <p className="text-[9px]" style={{ color: 'var(--sa-text-3)' }}>
                              {ta('cashoutTable.gross')} ${c.amount.toFixed(2)} · {ta('cashoutTable.fee')} ${c.fee.toFixed(2)}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 font-mono" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(c.requested_at)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            {c.status === 'requested' && (
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={mutProcess.isPending}
                                  onClick={() => setModal({ cashout: c, action: 'approve' })}
                                  className="h-7 px-2.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 flex items-center gap-1"
                                  style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', borderColor: 'rgba(16,185,129,0.2)' }}>
                                  {ta('approve')}
                                </button>
                                <button
                                  disabled={mutProcess.isPending}
                                  onClick={() => setModal({ cashout: c, action: 'reject' })}
                                  className="h-7 px-2.5 rounded-lg text-[10px] font-semibold border transition-colors disabled:opacity-50 flex items-center gap-1"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderColor: 'rgba(239,68,68,0.2)' }}>
                                  {ta('reject')}
                                </button>
                              </div>
                            )}
                            {c.payout_reference && (
                              <p className="text-[9px] font-mono" style={{ color: 'var(--sa-text-3)' }}>{c.payout_reference}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <SAPagination page={cashPage} total={cashTotal} pageSize={PAGE_SIZE} onChange={setCashPage} loading={cashLoading} />
            </>
          )}
        </div>
      )}

      {/* Cashout action modal */}
      {modal && (
        <CashoutModal
          cashout={modal.cashout}
          action={modal.action}
          isPending={mutProcess.isPending}
          onConfirm={(ref, notes) => mutProcess.mutate({ id: modal.cashout.id, action: modal.action, ref, notes })}
          onCancel={() => { if (!mutProcess.isPending) setModal(null); }}
          t={t}
        />
      )}

      {detailAff && <AffiliateDetailModal aff={detailAff} onClose={() => setDetailAff(null)} t={t} />}
    </div>
  );
}
