'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { superadminApi } from '@/lib/api';
import {
  LayoutDashboard, Building2, Users, TrendingUp,
  CreditCard, ArrowUpRight, RefreshCw, CheckCircle,
  AlertCircle, Wifi, UserPlus, ArrowUp, Ban, AlertTriangle, DollarSign, ServerCrash,
} from 'lucide-react';
import type { SALogEntry } from '@/lib/api';

// ── SVG Sparkline ──────────────────────────────────────────────────────────

function Sparkline({ data, color = '#e11d48' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  const w = 80; const h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polygon points={area} fill={color} fillOpacity="0.12" />
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.length > 0 && (
        <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - (data[data.length - 1] / max) * (h - 4)} r="2.5" fill={color} />
      )}
    </svg>
  );
}

// ── Mini Donut ─────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

function MiniDonut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 18; const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx="22" cy="22" r={r} fill="none"
            stroke={seg.color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset} strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '22px 22px' }} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, change, up, spark, color = '#6366f1', icon: Icon }: {
  label: string; value: string; change?: string; up?: boolean;
  spark?: number[]; color?: string; icon: typeof Building2;
}) {
  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-3" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {spark && <Sparkline data={spark} color={color} />}
      </div>
      <div>
        <p className="text-[22px] font-black font-mono leading-none" style={{ color: 'var(--sa-text)' }}>{value}</p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--sa-text-3)' }}>{label}</p>
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-[9px] font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
          <ArrowUpRight className={`h-3 w-3 ${up ? '' : 'rotate-90'}`} />
          {change}
        </div>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/5 dark:bg-white/5 ${className}`} />;
}

const LEVEL_DOT: Record<string, string> = {
  info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444',
};

// ── Main ───────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const t  = useTranslations('superAdmin');
  const td = useTranslations('superAdmin.dashboard');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn:  () => superadminApi.stats().then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['sa-dashboard-logs'],
    queryFn:  () => superadminApi.listLogs({ limit: 10 }).then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: sysData } = useQuery({
    queryKey: ['sa-dashboard-system'],
    queryFn:  () => superadminApi.getSystem().then(r => r.data),
    refetchInterval: 30_000,
  });

  const tenants   = data?.tenants;
  const users     = data?.users;
  const revenue   = data?.revenue;
  const byPlan    = tenants?.by_plan ?? {};
  const planNames = ['free', 'starter', 'pro', 'business', 'enterprise'];
  const planTotal = Object.values(byPlan).reduce((s, v) => s + v, 0) || 1;
  const paidCount = (byPlan.starter ?? 0) + (byPlan.pro ?? 0) + (byPlan.business ?? 0);
  const convRate  = tenants?.total ? ((paidCount / tenants.total) * 100).toFixed(1) : '0.0';

  const sp7 = [12,18,14,22,19,27,24];

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>
              {t('nav.overview')}
            </span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{td('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{td('subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[12px] font-semibold transition-all hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : isError ? (
        <div className="mb-6 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[12px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t('common.error')}
          <button onClick={() => refetch()} className="ml-auto underline">{t('common.retry')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <KpiCard label={td('kpi.totalBlogs')}  value={String(tenants?.total ?? 0)}     spark={sp7}            color="#6366f1" icon={Building2}  />
          <KpiCard label={td('kpi.activeBlogs')} value={String(tenants?.active ?? 0)}    spark={[10,14,12,18,16,22,20]} color="#10b981" icon={Building2} up change="+4%" />
          <KpiCard label={td('kpi.totalUsers')}  value={String(users?.total ?? 0)}       spark={[8,10,12,15,14,18,22]}  color="#3b82f6" icon={Users}     up change="+12%" />
          <KpiCard label={td('kpi.revenue')}     value={`$${(revenue?.total_usd ?? 0).toLocaleString()}`} spark={[40,55,48,70,65,82,90]} color="#f59e0b" icon={TrendingUp} up change="+18%" />
          <KpiCard label={td('kpi.paidPlans')}   value={String(paidCount)}               spark={[5,7,6,9,8,11,13]}      color="#8b5cf6" icon={CreditCard} up change="+6%" />
          <KpiCard label={td('kpi.conversion')}  value={`${convRate}%`}                  spark={[14,15,13,16,15,17,18]} color="#6366f1" icon={TrendingUp} up change="+1.2%" />
          <KpiCard label={td('kpi.new24h')}      value={String(tenants?.new_today ?? 0)} spark={[1,2,1,3,2,4,3]}        color="#06b6d4" icon={Building2}  up change="+3" />
          <KpiCard label={td('kpi.business')}    value={String(byPlan.business ?? 0)}    spark={[2,3,2,4,3,5,4]}        color="#f97316" icon={CreditCard} up change="+2%" />
        </div>
      )}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Plan distribution */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <h2 className="text-[13px] font-black mb-4" style={{ color: 'var(--sa-text)' }}>{td('planDistribution')}</h2>
          {isLoading ? (
            <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-6" />)}</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center mb-4">
                <MiniDonut segments={planNames.filter(p=>byPlan[p]>0).map((p,i)=>({ value: byPlan[p]??0, color: DONUT_COLORS[i] }))} />
              </div>
              {planNames.map((plan, i) => {
                const count = byPlan[plan] ?? 0;
                const pct   = Math.round((count / planTotal) * 100);
                return (
                  <div key={plan} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                    <span className="text-[10px] capitalize flex-1" style={{ color: 'var(--sa-text-2)' }}>{t(`plans.${plan}`)}</span>
                    <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--sa-text)' }}>{count}</span>
                    <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--sa-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DONUT_COLORS[i] }} />
                    </div>
                    <span className="text-[9px] w-8 text-right" style={{ color: 'var(--sa-text-3)' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-black" style={{ color: 'var(--sa-text)' }}>{td('recentActivity')}</h2>
            <span className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{td('last10Events')}</span>
          </div>
          {logsLoading ? (
            <div className="space-y-2.5">
              {Array.from({length: 6}).map((_,i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (logsData?.logs ?? []).length === 0 ? (
            <p className="text-[12px] py-4 text-center" style={{ color: 'var(--sa-text-3)' }}>{td('noActivity')}</p>
          ) : (
            <div className="space-y-2.5">
              {(logsData?.logs ?? []).map((log: SALogEntry, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: LEVEL_DOT[log.level] ?? '#64748b' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-snug truncate" style={{ color: 'var(--sa-text-2)' }}>
                      <span className="font-semibold" style={{ color: 'var(--sa-text)' }}>{log.action}</span>
                      {log.details ? ` — ${log.details}` : ''}
                    </p>
                    {log.actor && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--sa-text-3)' }}>{log.actor}</p>
                    )}
                  </div>
                  <span className="text-[10px] shrink-0 whitespace-nowrap" style={{ color: 'var(--sa-text-3)' }}>
                    {new Date(log.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System status bar */}
      <div className="rounded-xl border px-5 py-3 flex items-center gap-4 flex-wrap" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{td('systemStatus')}</span>
        {(sysData?.services ?? ['API', 'DB', 'Redis', 'S3', 'Stripe', 'Email'].map(name => ({ name, status: 'operational' as const }))).map((svc: { name: string; status: string }) => (
          <div key={svc.name} className="flex items-center gap-1.5">
            {svc.status === 'operational'
              ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
            <span className="text-[12px]" style={{ color: 'var(--sa-text-2)' }}>{svc.name}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{t('status.operational')}</span>
        </div>
      </div>
    </div>
  );
}