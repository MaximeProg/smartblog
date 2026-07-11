'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Loader2, ChevronDown, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { accountingApi, type ChartAccount, type JournalEntry } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// ── Helpers ─────────────────────────────────────────────────────────

const STATUS_CLS: Record<string, string> = {
  pending:  'bg-amber-900/40 text-amber-400 border border-amber-800/60',
  approved: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/60',
  reversed: 'bg-slate-700 text-slate-400 border border-slate-600',
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending:  Clock,
  approved: CheckCircle2,
  reversed: RotateCcw,
};

const JOURNAL_TYPE_LABELS: Record<string, string> = {
  general:   'Opérations diverses',
  sales:     'Ventes',
  purchases: 'Achats',
  cash:      'Caisse',
  bank:      'Banque',
};

const CLASS_LABELS: Record<number, string> = {
  1: 'Classe 1 — Actifs',
  2: 'Classe 2 — Passifs',
  3: 'Classe 3 — Capitaux propres',
  4: 'Classe 4 — Produits',
  5: 'Classe 5 — Charges',
};

const CLASS_COLOR: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-violet-400',
  3: 'text-emerald-400',
  4: 'text-amber-400',
  5: 'text-rose-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Chart of Accounts tab ────────────────────────────────────────────

function ChartOfAccountsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [classFilter, setClassFilter] = useState<number | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ code: '', name: '', account_class: 1, account_type: 'asset', parent_code: '', description: '' });

  const { data: accounts = [], isLoading } = useQuery<ChartAccount[]>({
    queryKey: ['chart-of-accounts', classFilter],
    queryFn: async () => {
      const { data } = await accountingApi.listAccounts({ account_class: classFilter, active_only: false });
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: () => accountingApi.createAccount({
      code: form.code.trim(),
      name: form.name.trim(),
      account_class: form.account_class,
      account_type: form.account_type,
      parent_code: form.parent_code.trim() || undefined,
      description: form.description.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({ title: 'Compte créé.' });
      setShowCreate(false);
      setForm({ code: '', name: '', account_class: 1, account_type: 'asset', parent_code: '', description: '' });
    },
    onError: (e: any) => toast({ variant: 'destructive', title: e?.response?.data?.detail ?? 'Erreur lors de la création.' }),
  });

  const toggleMut = useMutation({
    mutationFn: (code: string) => accountingApi.toggleAccount(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  const byClass = [1, 2, 3, 4, 5].map(cls => ({
    cls,
    items: accounts.filter(a => a.account_class === cls),
  })).filter(g => g.items.length > 0 || !classFilter);

  const inputCls = 'w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
          {[undefined, 1, 2, 3, 4, 5].map(c => (
            <button
              key={c ?? 'all'}
              onClick={() => setClassFilter(c)}
              className={`h-7 px-3 rounded-lg text-[11px] font-semibold transition-all ${classFilter === c ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {c == null ? 'Tous' : `Cl. ${c}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Nouveau compte
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3">
          <h3 className="text-[13px] font-bold text-white">Créer un compte</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Code</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex: 1030" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Classe</label>
              <select value={form.account_class} onChange={e => setForm(f => ({ ...f, account_class: +e.target.value }))}
                className={inputCls}>
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{CLASS_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Nom du compte</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ex: Dépôt bancaire - DBS" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Type</label>
              <select value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}
                className={inputCls}>
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Compte parent (optionnel)</label>
              <input value={form.parent_code} onChange={e => setForm(f => ({ ...f, parent_code: e.target.value }))} placeholder="Code du parent" className={inputCls} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowCreate(false)} className="h-8 px-4 rounded-xl border border-slate-700 text-[12px] text-slate-400 hover:bg-slate-700 transition-colors">
              Annuler
            </button>
            <button onClick={() => createMut.mutate()} disabled={!form.code.trim() || !form.name.trim() || createMut.isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors">
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Créer
            </button>
          </div>
        </div>
      )}

      {/* Account list grouped by class */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {byClass.map(({ cls, items }) => {
            const open = expanded.has(String(cls));
            return (
              <div key={cls} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setExpanded(prev => {
                    const next = new Set(prev);
                    next.has(String(cls)) ? next.delete(String(cls)) : next.add(String(cls));
                    return next;
                  })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors"
                >
                  {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                  <span className={`text-[12px] font-bold ${CLASS_COLOR[cls]}`}>{CLASS_LABELS[cls]}</span>
                  <span className="ml-auto text-[11px] text-slate-600 font-mono">{items.length} comptes</span>
                </button>
                {open && items.length > 0 && (
                  <div className="border-t border-slate-800">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-slate-800/60">
                          {['Code', 'Nom', 'Type', 'Parent', 'Statut', ''].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {items.map(a => (
                          <tr key={a.code} className={`transition-colors ${a.is_active ? 'hover:bg-slate-800/40' : 'opacity-40 hover:bg-slate-800/40'}`}>
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-300">{a.code}</td>
                            <td className="px-4 py-2.5 text-slate-300">{a.name}</td>
                            <td className="px-4 py-2.5 text-slate-500">{a.account_type}</td>
                            <td className="px-4 py-2.5 text-slate-600 font-mono text-[11px]">{a.parent_code ?? '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.is_active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {a.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {!a.is_system && (
                                <button
                                  onClick={() => toggleMut.mutate(a.code)}
                                  disabled={toggleMut.isPending}
                                  className="text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors"
                                >
                                  {a.is_active ? 'Désactiver' : 'Activer'}
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

// ── Journal Entries tab ──────────────────────────────────────────────

function JournalEntriesTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reverseId, setReverseId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries', statusFilter, typeFilter],
    queryFn: async () => {
      const { data } = await accountingApi.listEntries({
        status: statusFilter || undefined,
        journal_type: typeFilter || undefined,
        limit: 100,
      });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal-entries'] }); toast({ title: 'Écriture approuvée.' }); },
    onError: (e: any) => toast({ variant: 'destructive', title: e?.response?.data?.detail ?? 'Erreur.' }),
  });

  const reverseMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => accountingApi.reverseEntry(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Extourne créée.' });
      setReverseId(null);
      setReverseReason('');
    },
    onError: (e: any) => toast({ variant: 'destructive', title: e?.response?.data?.detail ?? 'Erreur.' }),
  });

  const selectCls = 'h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-300 focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="reversed">Extournées</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          <option value="">Tous les journaux</option>
          {Object.entries(JOURNAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="ml-auto text-[11px] text-slate-600">{entries.length} écriture(s)</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center py-20">
          <BookOpen className="h-8 w-8 text-slate-700 mb-3" />
          <p className="text-[14px] font-bold text-slate-500">Aucune écriture</p>
          <p className="text-[12px] text-slate-600 mt-1">Les écritures comptables apparaîtront ici.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-800">
                  {['N°', 'Journal', 'Description', 'Date', 'Débit', 'Crédit', 'Statut', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {entries.map(e => {
                  const StatusIcon = STATUS_ICON[e.status] ?? Clock;
                  const isExpanded = expanded === e.id;
                  return (
                    <>
                      <tr
                        key={e.id}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : e.id)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-400">#{e.entry_number}</td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">{JOURNAL_TYPE_LABELS[e.journal_type] ?? e.journal_type}</td>
                        <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate">{e.description}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">{e.entry_date}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 whitespace-nowrap text-right">{fmt(e.total_debit)}</td>
                        <td className="px-4 py-3 font-mono text-rose-400 whitespace-nowrap text-right">{fmt(e.total_credit)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_CLS[e.status] ?? STATUS_CLS.pending}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {e.status === 'pending' ? 'Attente' : e.status === 'approved' ? 'Approuvé' : 'Extourné'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5" onClick={ev => ev.stopPropagation()}>
                            {e.status === 'pending' && (
                              <button
                                onClick={() => approveMut.mutate(e.id)}
                                disabled={approveMut.isPending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900/40 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold hover:bg-emerald-900/70 disabled:opacity-50 transition-colors"
                                title="Approuver"
                              >
                                <ShieldCheck className="h-3 w-3" /> Approuver
                              </button>
                            )}
                            {e.status === 'approved' && (
                              <button
                                onClick={() => setReverseId(e.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold hover:bg-slate-700 transition-colors"
                                title="Extourner"
                              >
                                <RotateCcw className="h-3 w-3" /> Extourne
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Entry detail expansion */}
                      {isExpanded && (
                        <tr key={`${e.id}-detail`}>
                          <td colSpan={8} className="bg-slate-800/60 px-8 py-4">
                            {!entryDetail || entryDetail.id !== e.id ? (
                              <div className="flex items-center gap-2 text-slate-500 text-[12px]">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement…
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {e.reference && (
                                  <p className="text-[11px] text-slate-500">Réf: <span className="font-mono text-slate-400">{e.reference}</span></p>
                                )}
                                <table className="w-full text-[12px] max-w-xl">
                                  <thead>
                                    <tr className="border-b border-slate-700">
                                      <th className="text-left py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide pr-4">Compte</th>
                                      <th className="text-left py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide pr-4">Libellé</th>
                                      <th className="text-right py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide pr-4">Débit</th>
                                      <th className="text-right py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">Crédit</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-700/50">
                                    {entryDetail.lines?.map(ln => (
                                      <tr key={ln.id}>
                                        <td className="py-1.5 font-mono text-slate-400 pr-4">{ln.account_code}</td>
                                        <td className="py-1.5 text-slate-400 pr-4 text-[11px]">{ln.account_name}</td>
                                        <td className="py-1.5 text-right font-mono text-emerald-400 pr-4">{ln.debit > 0 ? fmt(ln.debit) : ''}</td>
                                        <td className="py-1.5 text-right font-mono text-rose-400">{ln.credit > 0 ? fmt(ln.credit) : ''}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t border-slate-700">
                                      <td colSpan={2} className="py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</td>
                                      <td className="py-1.5 text-right font-mono font-bold text-emerald-400 pr-4">{fmt(entryDetail.total_debit)}</td>
                                      <td className="py-1.5 text-right font-mono font-bold text-rose-400">{fmt(entryDetail.total_credit)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                                {Math.abs(entryDetail.total_debit - entryDetail.total_credit) > 0.01 && (
                                  <div className="flex items-center gap-2 text-amber-400 text-[11px]">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Écriture déséquilibrée — vérifier les lignes
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="h-5 w-5 text-amber-400" />
              <h2 className="text-[14px] font-black text-white">Créer une extourne</h2>
            </div>
            <p className="text-[12px] text-slate-400 mb-4">
              Cette action créera une écriture inverse (débit↔crédit) en statut "En attente".
            </p>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Motif de l'extourne</label>
            <input
              value={reverseReason}
              onChange={e => setReverseReason(e.target.value)}
              placeholder="Ex: Erreur de saisie"
              className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setReverseId(null); setReverseReason(''); }}
                className="h-8 px-4 rounded-xl border border-slate-700 text-[12px] text-slate-400 hover:bg-slate-800 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => reverseMut.mutate({ id: reverseId, reason: reverseReason })}
                disabled={reverseReason.trim().length < 5 || reverseMut.isPending}
                className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold disabled:opacity-50 transition-colors"
              >
                {reverseMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Extourner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────

type Tab = 'accounts' | 'entries';

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>('entries');

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">M24 — SFRS</p>
        <h1 className="text-[22px] font-black text-white">Comptabilité</h1>
        <p className="text-[13px] text-slate-500 mt-1">Plan comptable (Singapore SFRS) — double entrée</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 w-fit mb-6">
        {([
          { key: 'entries',  label: 'Écritures comptables', icon: BookOpen },
          { key: 'accounts', label: 'Plan comptable',       icon: BookOpen },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-8 px-4 rounded-lg text-[12px] font-semibold transition-all ${tab === t.key ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' ? <ChartOfAccountsTab /> : <JournalEntriesTab />}
    </div>
  );
}
