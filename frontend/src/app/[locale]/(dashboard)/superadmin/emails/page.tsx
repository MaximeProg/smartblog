'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { superadminApi } from '@/lib/api';

export default function EmailsPage() {
  const t  = useTranslations('superAdmin');
  const te = useTranslations('superAdmin.emails');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-email-templates'],
    queryFn: () => superadminApi.listEmailTemplates().then(r => r.data),
  });

  const templates = (data?.templates ?? []) as { id: string; name: string; active: boolean }[];

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{te('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{te('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{te('subtitle', { count: templates.length })}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : (
          <div>
            {templates.map((tpl, i) => (
              <div key={tpl.id} className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < templates.length - 1 ? '1px solid var(--sa-border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--sa-surface)' }}>
                    <Mail className="h-4 w-4" style={{ color: '#6366f1' }} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--sa-text)' }}>{tpl.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{tpl.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tpl.active
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-500"><CheckCircle className="h-3 w-3" /> {te('active')}</span>
                    : <span className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{te('inactive')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}