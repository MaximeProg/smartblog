'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, ChevronDown, ShieldOff, ShieldCheck, Trash2, Zap } from 'lucide-react';
import { superadminApi, type TenantAdminView } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'business'];
const STATUS_OPTIONS = ['active', 'suspended', 'trial', 'grace_period'];

const STATUS_CLS: Record<string, string> = {
  active:       'bg-emerald-100 text-emerald-700',
  suspended:    'bg-red-100 text-red-700',
  trial:        'bg-blue-100 text-blue-700',
  grace_period: 'bg-amber-100 text-amber-700',
  cancelled:    'bg-slate-100 text-slate-500',
};

const PLAN_CLS: Record<string, string> = {
  free:     'bg-slate-100 text-slate-600',
  starter:  'bg-indigo-100 text-indigo-700',
  pro:      'bg-blue-100 text-blue-700',
  business: 'bg-amber-100 text-amber-700',
};

function PlanSelector({ tenantId, current, onDone }: { tenantId: string; current: string; onDone: () => void }) {
  const [plan, setPlan] = useState(current);
  const { toast } = useToast();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => superadminApi.changePlan(tenantId, plan),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); toast({ title: 'Plan modifié.' }); onDone(); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors du changement de plan.' }),
  });
  return (
    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
      <select
        value={plan}
        onChange={e => setPlan(e.target.value)}
        className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300 focus:outline-none"
      >
        {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <button
        onClick={() => mut.mutate()}
        disabled={mut.isPending || plan === current}
        className="h-7 px-2 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        {mut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OK'}
      </button>
    </div>
  );
}

export default function SuperAdminTenants() {
  const [q, setQ]               = useState('');
  const [statusFilter, setStatus] = useState('');
  const [planFilter, setPlan]   = useState('');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery<TenantAdminView[]>({
    queryKey: ['superadmin-tenants', q, statusFilter, planFilter],
    queryFn: async () => {
      const { data } = await superadminApi.listTenants({
        q: q || undefined,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
        limit: 100,
      });
      return data;
    },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => superadminApi.suspendTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); toast({ title: 'Blog suspendu.' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => superadminApi.activateTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); toast({ title: 'Blog activé.' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => superadminApi.deleteTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-tenants'] }); setConfirmDelete(null); toast({ title: 'Blog supprimé.' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Gestion</p>
        <h1 className="text-[22px] font-black text-white">Blogs / Tenants</h1>
        <p className="text-[13px] text-slate-500 mt-1">{tenants.length} blog(s) trouvé(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Nom, slug, email…"
            className="h-9 pl-9 pr-4 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 w-56"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-300 focus:outline-none">
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={planFilter} onChange={e => setPlan(e.target.value)}
          className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-300 focus:outline-none">
          <option value="">Tous les plans</option>
          {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Blog', 'Slug', 'Plan', 'Statut', 'Articles', 'Abonnés', 'Créé le', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">{t.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{t.slug}</td>
                    <td className="px-4 py-3">
                      {editingPlan === t.id ? (
                        <PlanSelector tenantId={t.id} current={t.plan} onDone={() => setEditingPlan(null)} />
                      ) : (
                        <button onClick={() => setEditingPlan(t.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${PLAN_CLS[t.plan] ?? PLAN_CLS.free}`}>
                          {t.plan}<ChevronDown className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_CLS[t.status] ?? STATUS_CLS.active}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{t.articles_count}</td>
                    <td className="px-4 py-3 text-slate-400">{t.subscribers_count}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">{new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      {confirmDelete === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-red-600 font-semibold">Confirmer ?</span>
                          <button onClick={() => deleteMut.mutate(t.id)} disabled={deleteMut.isPending}
                            className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 disabled:opacity-50">
                            {deleteMut.isPending ? '…' : 'Oui'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="px-2 py-0.5 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-500 hover:bg-slate-50">
                            Non
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {t.status === 'suspended' ? (
                            <button onClick={() => activateMut.mutate(t.id)} disabled={activateMut.isPending}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Réactiver">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button onClick={() => suspendMut.mutate(t.id)} disabled={suspendMut.isPending}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Suspendre">
                              <ShieldOff className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(t.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Supprimer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingPlan(t.id)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Changer plan">
                            <Zap className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-[13px]">Aucun blog trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
