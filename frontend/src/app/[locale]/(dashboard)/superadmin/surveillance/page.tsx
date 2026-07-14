'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Eye, Users, LogIn, UserPlus, DollarSign, RefreshCw,
  Loader2, Activity, CreditCard, FileText, Circle,
} from 'lucide-react';
import { superadminApi, type SASurveillanceEvent, type SASurveillanceOnlineUser } from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPE_META: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  login:        { label: 'Sign-in',      color: '#6366f1', icon: LogIn },
  registration: { label: 'Registration', color: '#10b981', icon: UserPlus },
  payment:      { label: 'Payment',      color: '#f59e0b', icon: CreditCard },
  article:      { label: 'Article',      color: '#3b82f6', icon: FileText },
};

const LEVEL_DOT: Record<string, string> = {
  info:    'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
};

function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function timeSince(s: string) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Eye; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border p-4 flex items-start gap-3"
      style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
      <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>{label}</p>
        <p className="text-[22px] font-black leading-tight" style={{ color: 'var(--sa-text)' }}>{value}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{sub}</p>}
      </div>
    </div>
  );
}

function OnlineUserRow({ user }: { user: SASurveillanceOnlineUser }) {
  const initials = (user.display_name ?? user.email).slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: 'var(--sa-divider)' }}>
      <div className="relative shrink-0">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ background: '#6366f1' }}>
          {initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2"
          style={{ borderColor: 'var(--sa-card)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--sa-text)' }}>
          {user.display_name ?? user.email.split('@')[0]}
        </p>
        <p className="text-[10px] truncate" style={{ color: 'var(--sa-text-3)' }}>{user.email}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase"
          style={{ background: 'var(--sa-surface)', color: 'var(--sa-text-3)' }}>
          {user.plan}
        </span>
        <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--sa-text-3)' }}>
          {timeSince(user.last_seen)}
        </p>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: SASurveillanceEvent }) {
  const meta = TYPE_META[event.type] ?? TYPE_META.login;
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: 'var(--sa-divider)' }}>
      <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${meta.color}18` }}>
        <Icon className="h-3 w-3" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', LEVEL_DOT[event.level] ?? 'bg-blue-500')} />
        </div>
        <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--sa-text)' }}>{event.actor}</p>
        <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{event.details}</p>
      </div>
      <span className="text-[10px] font-mono whitespace-nowrap shrink-0 mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
        {fmtTime(event.ts)}
      </span>
    </div>
  );
}

export default function SurveillancePage() {
  const t  = useTranslations('superAdmin');
  const ts = useTranslations('superAdmin.surveillance');
  const [now, setNow] = useState('');

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['sa-surveillance'],
    queryFn: () => superadminApi.getSurveillance().then(r => r.data),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const stats    = data?.stats;
  const online   = data?.online_users ?? [];
  const events   = data?.events ?? [];
  const lastUpd  = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>
              {ts('breadcrumb')}
            </span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ts('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {ts('subtitle', { online: data?.online_count ?? 0 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live clock */}
          <div className="flex items-center gap-1.5 h-8 px-3 rounded-xl border"
            style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-surface)' }}>
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold" style={{ color: 'var(--sa-text)' }}>{now}</span>
          </div>
          {/* Last updated */}
          <span className="text-[10px] hidden sm:block" style={{ color: 'var(--sa-text-3)' }}>
            {ts('lastUpdated', { time: lastUpd })}
          </span>
          <button
            onClick={() => refetch()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Auto-refresh badge */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            {ts('autoRefresh')}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}      label={ts('stats.online')}   value={data?.online_count ?? 0}                                  color="#6366f1" />
        <StatCard icon={LogIn}      label={ts('stats.logins')}   value={stats?.logins_today ?? 0}                                 color="#10b981" />
        <StatCard icon={UserPlus}   label={ts('stats.newUsers')} value={stats?.users_today ?? 0}   sub={`/ ${stats?.total_users ?? 0} total`} color="#f59e0b" />
        <StatCard icon={DollarSign} label={ts('stats.revenue')}  value={`$${(stats?.revenue_today ?? 0).toFixed(2)}`}             color="#3b82f6" />
      </div>

      {/* Main content: 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">

        {/* Online users */}
        <div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--sa-border)' }}>
              <div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{ts('onlineUsers')}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ts('onlineUsersDesc')}</p>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-lg"
                style={{ background: '#6366f118', color: '#6366f1' }}>
                {online.length}
              </span>
            </div>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
              </div>
            ) : online.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--sa-text-3)' }} />
                <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ts('noOnlineUsers')}</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {online.map((u, i) => <OnlineUserRow key={i} user={u} />)}
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--sa-border)' }}>
              <div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{ts('activity')}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ts('activityDesc')}</p>
              </div>
              {/* Type legend */}
              <div className="hidden sm:flex items-center gap-3">
                {Object.entries(TYPE_META).map(([key, m]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                    <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
              </div>
            ) : events.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--sa-text-3)' }} />
                <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>{ts('noActivity')}</p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto">
                {events.map((e, i) => <EventRow key={i} event={e} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
