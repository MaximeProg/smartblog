'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Users, RefreshCw, Crown, Loader2 } from 'lucide-react';
import { superadminApi, type SARoleItem } from '@/lib/api';

const ROLE_COLORS: Record<string, string> = {
  TENANT_ADMIN: '#ef4444',
  EDITOR:       '#f59e0b',
  AUTHOR:       '#3b82f6',
  VIEWER:       '#64748b',
};

export default function RolesPage() {
  const t  = useTranslations('superAdmin');
  const tr = useTranslations('superAdmin.roles');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-roles'],
    queryFn: () => superadminApi.listRoles().then(r => r.data),
  });

  const roles       = data?.roles ?? [];
  const superAdmins = data?.super_admins ?? 0;
  const totalUsers  = roles.reduce((s: number, r: SARoleItem) => s + r.user_count, 0);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tr('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tr('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{tr('subtitle', { count: roles.length })}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-5 bg-amber-500/10 border border-amber-500/20">
            <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-amber-500">{tr('superAdmins', { count: superAdmins })}</p>
              <p className="text-[11px] text-amber-500/70">{tr('superAdminDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {roles.map((role: SARoleItem) => {
              const color = ROLE_COLORS[role.id] ?? '#64748b';
              const pct   = totalUsers > 0 ? Math.round((role.user_count / totalUsers) * 100) : 0;
              return (
                <div key={role.id} className="rounded-xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-[13px] font-bold" style={{ color: 'var(--sa-text)' }}>{role.label}</span>
                    </div>
                    <Users className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
                  </div>
                  <p className="text-[28px] font-black tabular-nums mb-1" style={{ color: 'var(--sa-text)' }}>{role.user_count}</p>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--sa-text-3)' }}>{role.description}</p>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sa-surface)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--sa-text-3)' }}>{pct}% {tr('ofUsers')}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sa-border)' }}>
              <h3 className="text-[12px] font-bold" style={{ color: 'var(--sa-text)' }}>{tr('permissions')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sa-border)' }}>
                    <th className="px-4 py-2.5 text-left font-semibold" style={{ color: 'var(--sa-text-3)' }}>{tr('permission')}</th>
                    {roles.map((r: SARoleItem) => (
                      <th key={r.id} className="px-4 py-2.5 text-center font-semibold" style={{ color: ROLE_COLORS[r.id] ?? '#64748b' }}>{r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([
                    { perm: tr('perm.publish'),     allow: ['TENANT_ADMIN', 'EDITOR'] },
                    { perm: tr('perm.manageUsers'), allow: ['TENANT_ADMIN'] },
                    { perm: tr('perm.viewStats'),   allow: ['TENANT_ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER'] },
                    { perm: tr('perm.editContent'), allow: ['TENANT_ADMIN', 'EDITOR', 'AUTHOR'] },
                    { perm: tr('perm.settings'),    allow: ['TENANT_ADMIN'] },
                    { perm: tr('perm.billing'),     allow: ['TENANT_ADMIN'] },
                  ] as { perm: string; allow: string[] }[]).map(row => (
                    <tr key={row.perm} style={{ borderBottom: '1px solid var(--sa-border)' }}>
                      <td className="px-4 py-2 font-medium" style={{ color: 'var(--sa-text-2)' }}>{row.perm}</td>
                      {roles.map((r: SARoleItem) => (
                        <td key={r.id} className="px-4 py-2 text-center">
                          {row.allow.includes(r.id) ? <span className="text-emerald-500">✓</span> : <span style={{ color: 'var(--sa-text-3)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}