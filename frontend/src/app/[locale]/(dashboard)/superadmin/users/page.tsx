'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { superadminApi, type UserAdminView } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';

const PLAN_CLS: Record<string, string> = {
  free:     'bg-slate-100 text-slate-600',
  starter:  'bg-indigo-100 text-indigo-700',
  pro:      'bg-blue-100 text-blue-700',
  business: 'bg-amber-100 text-amber-700',
};

export default function SuperAdminUsers() {
  const [q, setQ] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user: me } = useAuthStore();

  const { data: users = [], isLoading } = useQuery<UserAdminView[]>({
    queryKey: ['superadmin-users', q],
    queryFn: async () => {
      const { data } = await superadminApi.listUsers({ q: q || undefined, limit: 200 });
      return data;
    },
  });

  const makeAdminMut = useMutation({
    mutationFn: (userId: string) => superadminApi.makeSuperAdmin(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-users'] }); toast({ title: 'Super Admin accordé.' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  const revokeAdminMut = useMutation({
    mutationFn: (userId: string) => superadminApi.revokeSuperAdmin(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-users'] }); toast({ title: 'Super Admin révoqué.' }); },
    onError: () => toast({ variant: 'destructive', title: 'Erreur.' }),
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Gestion</p>
        <h1 className="text-[22px] font-black text-white">Utilisateurs</h1>
        <p className="text-[13px] text-slate-500 mt-1">{users.length} utilisateur(s)</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Email, nom…"
            className="h-9 w-full pl-9 pr-4 rounded-xl border border-slate-700 bg-slate-800 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
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
                  {['Utilisateur', 'Email', 'Plan', 'Blogs', 'Super Admin', 'Inscrit le', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">
                      {u.display_name ?? '—'}
                      {u.id === me?.id && (
                        <span className="ml-2 text-[9px] font-bold bg-rose-900/50 text-rose-400 px-1.5 py-0.5 rounded-full uppercase border border-rose-800/60">Vous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${PLAN_CLS[u.plan] ?? PLAN_CLS.free}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.tenants_count}</td>
                    <td className="px-4 py-3">
                      {u.is_super_admin ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== me?.id && (
                        u.is_super_admin ? (
                          <button
                            onClick={() => revokeAdminMut.mutate(u.id)}
                            disabled={revokeAdminMut.isPending}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[11px] font-semibold hover:bg-rose-100 transition-colors disabled:opacity-50"
                          >
                            <ShieldOff className="h-3 w-3" /> Révoquer
                          </button>
                        ) : (
                          <button
                            onClick={() => makeAdminMut.mutate(u.id)}
                            disabled={makeAdminMut.isPending}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3 w-3" /> Promouvoir
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-600 text-[13px]">Aucun utilisateur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
