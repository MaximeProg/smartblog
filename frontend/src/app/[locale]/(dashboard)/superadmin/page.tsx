'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Users, TrendingUp, Activity, DollarSign, Zap, ShieldCheck } from 'lucide-react';
import { superadminApi, type SuperAdminStats } from '@/lib/api';

const PLAN_BAR: Record<string, string> = {
  free:     'bg-slate-500',
  starter:  'bg-indigo-500',
  pro:      'bg-blue-500',
  business: 'bg-amber-500',
};
const PLAN_BADGE: Record<string, string> = {
  free:     'bg-slate-800 text-slate-400 border border-slate-700',
  starter:  'bg-indigo-900/40 text-indigo-400 border border-indigo-800/60',
  pro:      'bg-blue-900/40 text-blue-400 border border-blue-800/60',
  business: 'bg-amber-900/40 text-amber-400 border border-amber-800/60',
};

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-start gap-4 hover:border-slate-700 transition-colors`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-[26px] font-black text-white leading-none mt-1 font-mono">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery<SuperAdminStats>({
    queryKey: ['superadmin-stats'],
    queryFn: async () => { const { data } = await superadminApi.stats(); return data; },
    refetchInterval: 30_000,
  });

  const planDist = stats?.plan_distribution ?? {};

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Platform Overview</span>
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-[13px] text-slate-500 mt-1">Métriques en temps réel — NexusBlog SaaS Platform</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider">Actualisation</p>
          <p className="text-[12px] font-mono text-slate-400">toutes les 30s</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <StatCard icon={Building2} label="Blogs total" value={stats?.total_tenants ?? 0}
              sub={`+${stats?.new_tenants_24h ?? 0} dernières 24h`}
              accent="bg-blue-900/50 text-blue-400" />
            <StatCard icon={Activity} label="Blogs actifs" value={stats?.active_tenants ?? 0}
              sub={`${stats?.total_tenants ? Math.round((stats.active_tenants / stats.total_tenants) * 100) : 0}% du total`}
              accent="bg-emerald-900/50 text-emerald-400" />
            <StatCard icon={Users} label="Utilisateurs" value={stats?.total_users ?? 0}
              accent="bg-violet-900/50 text-violet-400" />
            <StatCard icon={DollarSign} label="Revenu cumulé"
              value={`$${((stats?.total_revenue ?? 0) / 100).toFixed(2)}`}
              accent="bg-amber-900/50 text-amber-400" />
            <StatCard icon={TrendingUp} label="Nouveaux 24h" value={stats?.new_tenants_24h ?? 0}
              accent="bg-rose-900/50 text-rose-400" />
            <StatCard icon={Zap} label="Plans payants"
              value={(planDist.starter ?? 0) + (planDist.pro ?? 0) + (planDist.business ?? 0)}
              sub="starter + pro + business"
              accent="bg-orange-900/50 text-orange-400" />
          </div>

          {/* Plan distribution */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-[13px] font-bold text-slate-300 mb-5 uppercase tracking-widest">Distribution des plans</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(['free', 'starter', 'pro', 'business'] as const).map(plan => {
                const count = planDist[plan] ?? 0;
                const total = stats?.total_tenants ?? 1;
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={plan} className="text-center">
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase mb-3 ${PLAN_BADGE[plan]}`}>
                      {plan}
                    </div>
                    <p className="text-[32px] font-black text-white leading-none font-mono">{count}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{pct}% du total</p>
                    <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${PLAN_BAR[plan]} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
