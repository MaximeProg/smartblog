'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Server, Database, Activity, Cloud, Mail, RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { superadminApi, type SASystemService, type SASystemResponse } from '@/lib/api';

const STATUS_META: Record<string, { icon: typeof CheckCircle; cls: string }> = {
  operational: { icon: CheckCircle,   cls: 'text-emerald-500 bg-emerald-500/10' },
  degraded:    { icon: AlertTriangle, cls: 'text-amber-500 bg-amber-500/10' },
  outage:      { icon: XCircle,       cls: 'text-red-500 bg-red-500/10' },
};

const SERVICE_ICONS: Record<string, typeof Server> = {
  'API Server': Server, 'Database': Database, 'Workers (ARQ)': Activity,
  'Redis': Cloud, 'Email (SendGrid)': Mail, 'Storage (CDN)': Cloud,
};

export default function SystemPage() {
  const t  = useTranslations('superAdmin');
  const ts = useTranslations('superAdmin.system');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-system'],
    queryFn: () => superadminApi.getSystem().then(r => r.data as SASystemResponse),
    refetchInterval: 30_000,
  });

  const services    = data?.services ?? [];
  const degraded    = services.filter((s: SASystemService) => s.status === 'degraded').length;
  const outages     = services.filter((s: SASystemService) => s.status === 'outage').length;
  const globalStatus = outages > 0 ? 'outage' : degraded > 0 ? 'degraded' : 'operational';
  const GlobalIcon   = STATUS_META[globalStatus].icon;
  const db           = data?.database;
  const uptime       = data?.uptime;

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ts('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ts('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ts('subtitle')}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" /> {t('common.refresh')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <>
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl mb-5 ${STATUS_META[globalStatus].cls}`}>
            <GlobalIcon className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold">{ts(`globalStatus.${globalStatus}`)}</p>
              <p className="text-[11px] opacity-80">{ts('lastCheck', { time: new Date().toLocaleTimeString() })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
              <h3 className="text-[12px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{ts('services')}</h3>
              <div className="space-y-2">
                {services.map((svc: SASystemService) => {
                  const meta = STATUS_META[svc.status] ?? STATUS_META.operational;
                  const Icon = SERVICE_ICONS[svc.name] ?? Server;
                  const SIcon = meta.icon;
                  return (
                    <div key={svc.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--sa-border)' }}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
                        <span className="text-[12px]" style={{ color: 'var(--sa-text)' }}>{svc.name}</span>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.cls}`}>
                        <SIcon className="h-3 w-3" /> {ts(`status.${svc.status}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
                <h3 className="text-[12px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{ts('database')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: ts('db.size'),     value: db?.size ?? '—' },
                    { label: ts('db.tenants'),  value: String(db?.tenants ?? 0) },
                    { label: ts('db.users'),    value: String(db?.users ?? 0) },
                    { label: ts('db.articles'), value: String(db?.articles ?? 0) },
                  ].map(s => (
                    <div key={s.label} className="px-3 py-2 rounded-lg" style={{ background: 'var(--sa-surface)' }}>
                      <p className="text-[16px] font-black" style={{ color: 'var(--sa-text)' }}>{s.value}</p>
                      <p className="text-[9px]" style={{ color: 'var(--sa-text-3)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
                <h3 className="text-[12px] font-bold mb-2" style={{ color: 'var(--sa-text)' }}>{ts('uptime')}</h3>
                <p className="text-[24px] font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>
                  {uptime ? `${uptime.hours}h ${uptime.minutes}m` : '—'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{ts('uptimeDesc')}</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
                <p className="text-[10px] mb-1" style={{ color: 'var(--sa-text-3)' }}>{ts('env')}</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400">
                  {data?.env ?? 'development'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}