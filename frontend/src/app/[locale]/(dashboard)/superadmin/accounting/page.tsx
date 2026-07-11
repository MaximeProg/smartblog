'use client';

import { useState, type ElementType } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Loader2, ChevronDown, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { accountingApi, type ChartAccount, type JournalEntry } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const STATUS_CLS_MAP: Record<string, string> = {
  pending:  'text-amber-500  bg-amber-500/10  border-amber-500/20',
  approved: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  reversed: 'text-slate-400  bg-slate-500/10  border-slate-500/20',
};

const STATUS_ICON: Record<string, ElementType> = {
  pending:  Clock,
  approved: CheckCircle2,
  reversed: RotateCcw,
};

const CLASS_COLOR: Record<number, string> = {
  1: '#3b82f6',
  2: '#8b5cf6',
  3: '#10b981',
  4: '#f59e0b',
  5: '#ef4444',
};

// ── Chart of Accounts tab ────────────────────────────────────────────────

function ChartOfAccountsTab({ t, ta }: { t: ReturnType<typeof useTranslations>; ta: ReturnType<typeof useTranslations> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classFilter, setClassFilter] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ code:'', name:'', account_class:1, account_type:'asset', parent_code:'', description:'' });

  const { data: accounts = [], isLoading } = useQuery<ChartAccount[]>({
    queryKey: ['chart-of-accounts', classFilter],
    queryFn: async () => { const { data } = await accountingApi.listAccounts({ account_class: classFilter, active_only: false }); return data; },
  });

  const createMut = useMutation({
    mutationFn: () => accountingApi.createAccount({
      code: form.code.trim(), name: form.name.trim(), account_class: form.account_class,
      account_type: form.account_type, parent_code: form.parent_code.trim() || undefined,
      description: form.description.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: ta('accountCreated') as string });
      setShowCreate(false);
      setForm({ code:'', name:'', account_class:1, account_type:'asset', parent_code:'', description:'' });
    },
    onError: (e: any) => toast({ variant:'destructive', title: e?.response?.data?.detail ?? t('common.error') as string }),
  });

  const toggleMut = useMutation({
    mutationFn: (code: string) => accountingApi.toggleAccount(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
    onError: () => toast({ variant:'destructive', title: t('common.error') as string }),
  });

  const byClass = [1,2,3,4,5].map(cls => ({
    cls, items: accounts.filter(a => a.account_class === cls),
  })).filter(g => !classFilter || g.cls === classFilter);

  function Input({ value, onChange, placeholder, type='text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
        className="w-full h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-rose-500/30"
        style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
    );
  }

  function Select({ value, onChange, children }: { value: string|number; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-rose-500/30"
        style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)', background: 'var(--sa-card)' }}>
        {children}
      </select>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-xl p-1 border" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
          <button onClick={() => setClassFilter(undefined)}
            className={`h-7 px-3 rounded-lg text-[11px] font-semibold transition-all ${!classFilter ? 'font-bold' : ''}`}
            style={{ color: !classFilter ? 'var(--sa-text)' : 'var(--sa-text-3)', background: !classFilter ? 'var(--sa-card)' : 'transparent' }}>
            {ta('form.allClasses')}
          </button>
          {[1,2,3,4,5].map(c => (
            <button key={c} onClick={() => setClassFilter(c)}
              className={`h-7 px-3 rounded-lg text-[11px] font-semibold transition-all`}
              style={{ color: classFilter===c ? CLASS_COLOR[c] : 'var(--sa-text-3)', background: classFilter===c ? 'var(--sa-card)' : 'transparent' }}>
              Cl.{c}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(s => !s)}
          className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-colors">
          <Plus className="h-3.5 w-3.5" /> {ta('newAccount')}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <h3 className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{ta('createAccount')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('form.code')}</label>
              <Input value={form.code} onChange={v => setForm(f => ({ ...f, code: v }))} placeholder={ta('form.codePlaceholder') as string} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('form.class')}</label>
              <Select value={form.account_class} onChange={v => setForm(f => ({ ...f, account_class: +v }))}>
                {[1,2,3,4,5].map(c => <option key={c} value={c}>{ta(`classes.${c}`)}</option>)}
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('form.accountName')}</label>
              <Input value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder={ta('form.accountNamePlaceholder') as string} />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('form.type')}</label>
              <Select value={form.account_type} onChange={v => setForm(f => ({ ...f, account_type: v }))}>
                {['asset','liability','equity','revenue','expense'].map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('form.parent')}</label>
              <Input value={form.parent_code} onChange={v => setForm(f => ({ ...f, parent_code: v }))} placeholder={ta('form.parentPlaceholder') as string} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowCreate(false)}
              className="h-8 px-4 rounded-xl border text-[12px] hover:bg-[var(--sa-surface)] transition-colors"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
              {t('common.cancel')}
            </button>
            <button onClick={() => createMut.mutate()} disabled={!form.code.trim() || !form.name.trim() || createMut.isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors">
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t('common.create')}
            </button>
          </div>
        </div>
      )}

      {/* Account list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <div className="space-y-2">
          {byClass.map(({ cls, items }) => {
            const open = expanded.has(String(cls));
            return (
              <div key={cls} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
                <button onClick={() => setExpanded(prev => { const next = new Set(prev); next.has(String(cls)) ? next.delete(String(cls)) : next.add(String(cls)); return next; })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--sa-surface)] transition-colors">
                  {open ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} /> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />}
                  <span className="text-[12px] font-bold" style={{ color: CLASS_COLOR[cls] }}>{ta(`classes.${cls}`)}</span>
                  <span className="ml-auto text-[11px] font-mono" style={{ color: 'var(--sa-text-3)' }}>{ta('accountsCount', { count: items.length })}</span>
                </button>
                {open && items.length > 0 && (
                  <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--sa-border)' }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                          {[ta('table.code'),ta('table.name'),ta('table.type'),ta('table.parent'),ta('table.status'),''].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--sa-divider)]">
                        {items.map(a => (
                          <tr key={a.code} className={`transition-colors hover:bg-[var(--sa-surface)] ${!a.is_active ? 'opacity-40' : ''}`}>
                            <td className="px-4 py-2.5 font-mono font-bold" style={{ color: 'var(--sa-text-2)' }}>{a.code}</td>
                            <td className="px-4 py-2.5" style={{ color: 'var(--sa-text)' }}>{a.name}</td>
                            <td className="px-4 py-2.5 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{a.account_type}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{a.parent_code ?? '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${a.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'bg-slate-500/10 text-slate-400'}`}>
                                {a.is_active ? ta('table.active') : ta('table.inactive')}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {!a.is_system && (
                                <button onClick={() => toggleMut.mutate(a.code)} disabled={toggleMut.isPending}
                                  className="text-[10px] hover:underline transition-colors" style={{ color: 'var(--sa-text-3)' }}>
                                  {a.is_active ? t('common.delete') : t('common.publish')}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Journal Entries tab ──────────────────────────────────────────────────

function JournalEntriesTab({ t, ta }: { t: ReturnType<typeof useTranslations>; ta: ReturnType<typeof useTranslations> }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [reverseId, setReverseId]       = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries', statusFilter, typeFilter],
    queryFn: async () => {
      const { data } = await accountingApi.listEntries({ status: statusFilter || undefined, journal_type: typeFilter || undefined, limit: 100 });
      return data;
    },
  });

  const { data: entryDetail } = useQuery<JournalEntry>({
    queryKey: ['journal-entry', expanded],
    queryFn: async () => { const { data } = await accountingApi.getEntry(expanded!); return data; },
    enabled: !!expanded,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => accountingApi.approveEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal-entries'] }); toast({ title: ta('entryApproved') as string }); },
    onError: (e: any) => toast({ variant:'destructive', title: e?.response?.data?.detail ?? t('common.error') as string }),
  });

  const reverseMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => accountingApi.reverseEntry(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: ta('reversalCreated') as string });
      setReverseId(null); setReverseReason('');
    },
    onError: (e: any) => toast({ variant:'destructive', title: e?.response?.data?.detail ?? t('common.error') as string }),
  });

  const JOURNAL_TYPES = ['general','sales','purchases','cash','bank'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)', background: 'var(--sa-card)' }}>
          <option value="">{ta('filters.allStatus')}</option>
          {['pending','approved','reversed'].map(s => <option key={s} value={s}>{ta(`status.${s}`)}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)', background: 'var(--sa-card)' }}>
          <option value="">{ta('filters.allJournals')}</option>
          {JOURNAL_TYPES.map(k => <option key={k} value={k}>{ta(`journalTypes.${k}`)}</option>)}
        </select>
        <span className="ml-auto text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ta('entriesCount', { count: entries.length })}</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border flex flex-col items-center justify-center py-20" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <BookOpen className="h-8 w-8 mb-3" style={{ color: 'var(--sa-border)' }} />
          <p className="text-[14px] font-bold" style={{ color: 'var(--sa-text-3)' }}>{ta('noEntries')}</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--sa-text-3)' }}>{ta('noEntriesDesc')}</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
                  {[ta('table.number'),ta('table.journal'),ta('table.description'),ta('table.date'),ta('table.debit'),ta('table.credit'),ta('table.status'),''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const StatusIcon = STATUS_ICON[e.status] ?? Clock;
                  const isExpandedRow = expanded === e.id;
                  return (
                    <>
                      <tr key={e.id} className="border-b hover:bg-[var(--sa-surface)] transition-colors cursor-pointer" style={{ borderColor: 'var(--sa-divider)' }}
                        onClick={() => setExpanded(isExpandedRow ? null : e.id)}>
                        <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--sa-text-3)' }}>#{e.entry_number}</td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ta(`journalTypes.${e.journal_type}`) ?? e.journal_type}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--sa-text)' }}>{e.description}</td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap" style={{ color: 'var(--sa-text-3)' }}>{e.entry_date}</td>
                        <td className="px-4 py-3 font-mono text-emerald-500 whitespace-nowrap text-right">{fmt(e.total_debit)}</td>
                        <td className="px-4 py-3 font-mono text-rose-500 whitespace-nowrap text-right">{fmt(e.total_credit)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${STATUS_CLS_MAP[e.status] ?? STATUS_CLS_MAP.pending}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {ta(`status.${e.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5" onClick={ev => ev.stopPropagation()}>
                            {e.status === 'pending' && (
                              <button onClick={() => approveMut.mutate(e.id)} disabled={approveMut.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50">
                                <ShieldCheck className="h-3 w-3" /> {ta('approve')}
                              </button>
                            )}
                            {e.status === 'approved' && (
                              <button onClick={() => setReverseId(e.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold hover:bg-[var(--sa-surface)] transition-colors"
                                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
                                <RotateCcw className="h-3 w-3" /> {ta('reverse')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Detail expansion */}
                      {isExpandedRow && (
                        <tr key={`${e.id}-detail`}>
                          <td colSpan={8} className="px-8 py-4" style={{ background: 'var(--sa-surface)' }}>
                            {!entryDetail || entryDetail.id !== e.id ? (
                              <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--sa-text-3)' }}>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {ta('loading')}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {e.reference && (
                                  <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ta('table.ref')}: <span className="font-mono" style={{ color: 'var(--sa-text-2)' }}>{e.reference}</span></p>
                                )}
                                <table className="w-full text-[12px] max-w-xl">
                                  <thead>
                                    <tr className="border-b" style={{ borderColor: 'var(--sa-border)' }}>
                                      {[ta('table.account'),ta('table.label'),ta('table.debit'),ta('table.credit')].map(h => (
                                        <th key={h} className="text-left py-1.5 text-[9px] font-bold uppercase tracking-wide pr-4" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--sa-divider)]">
                                    {entryDetail.lines?.map(ln => (
                                      <tr key={ln.id}>
                                        <td className="py-1.5 font-mono pr-4" style={{ color: 'var(--sa-text-3)' }}>{ln.account_code}</td>
                                        <td className="py-1.5 pr-4 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ln.account_name}</td>
                                        <td className="py-1.5 text-right font-mono text-emerald-500 pr-4">{ln.debit > 0 ? fmt(ln.debit) : ''}</td>
                                        <td className="py-1.5 text-right font-mono text-rose-500">{ln.credit > 0 ? fmt(ln.credit) : ''}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t" style={{ borderColor: 'var(--sa-border)' }}>
                                      <td colSpan={2} className="py-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>{ta('table.total')}</td>
                                      <td className="py-1.5 text-right font-mono font-bold text-emerald-500 pr-4">{fmt(entryDetail.total_debit)}</td>
                                      <td className="py-1.5 text-right font-mono font-bold text-rose-500">{fmt(entryDetail.total_credit)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                                {Math.abs(entryDetail.total_debit - entryDetail.total_credit) > 0.01 && (
                                  <div className="flex items-center gap-2 text-amber-500 text-[11px]">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {ta('unbalancedWarning')}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reverse modal */}
      {reverseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-2xl border shadow-2xl w-full max-w-sm p-6" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              <h2 className="text-[14px] font-black" style={{ color: 'var(--sa-text)' }}>{ta('reverseTitle')}</h2>
            </div>
            <p className="text-[12px] mb-4" style={{ color: 'var(--sa-text-3)' }}>{ta('reverseDesc')}</p>
            <label className="block text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sa-text-3)' }}>{ta('reverseReason')}</label>
            <input value={reverseReason} onChange={e => setReverseReason(e.target.value)}
              placeholder={ta('reverseReasonPlaceholder') as string}
              className="w-full h-9 px-3 rounded-xl border bg-transparent text-[12px] focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setReverseId(null); setReverseReason(''); }}
                className="h-8 px-4 rounded-xl border text-[12px] hover:bg-[var(--sa-surface)] transition-colors"
                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
                {t('common.cancel')}
              </button>
              <button onClick={() => reverseMut.mutate({ id: reverseId, reason: reverseReason })}
                disabled={reverseReason.trim().length < 5 || reverseMut.isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors">
                {reverseMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {ta('reverse')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

type Tab = 'accounts' | 'entries';

export default function AccountingPage() {
  const t  = useTranslations('superAdmin');
  const ta = useTranslations('superAdmin.accounting');
  const [tab, setTab] = useState<Tab>('entries');

  const TABS: { key: Tab; label: string }[] = [
    { key:'entries',  label: ta('tabEntries')  as string },
    { key:'accounts', label: ta('tabAccounts') as string },
  ];

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ta('breadcrumb')}</span>
        </div>
        <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ta('title')}</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ta('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: 'var(--sa-border)' }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`h-10 px-4 text-[12px] font-semibold border-b-2 transition-colors ${tab===tb.key ? 'border-rose-500 text-rose-500' : 'border-transparent'}`}
            style={tab!==tb.key ? { color: 'var(--sa-text-3)' } : {}}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' ? <ChartOfAccountsTab t={t} ta={ta} /> : <JournalEntriesTab t={t} ta={ta} />}
    </div>
  );
}