'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Brain, CheckCircle, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { superadminApi } from '@/lib/api';

export default function AiPage() {
  const t  = useTranslations('superAdmin');
  const ta = useTranslations('superAdmin.ai');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-ai-config'],
    queryFn: () => superadminApi.getAiConfig().then(r => r.data),
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{ta('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{ta('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>{ta('subtitle')}</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status */}
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${data?.configured ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
            {data?.configured
              ? <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />}
            <div>
              <p className={`text-[13px] font-bold ${data?.configured ? 'text-emerald-500' : 'text-amber-500'}`}>
                {data?.configured ? ta('configured') : ta('notConfigured')}
              </p>
              <p className={`text-[11px] opacity-80 ${data?.configured ? 'text-emerald-500' : 'text-amber-500'}`}>
                {data?.configured ? ta('configuredDesc') : ta('notConfiguredDesc')}
              </p>
            </div>
          </div>

          {/* Current model */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
            <h3 className="text-[12px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{ta('currentModel')}</h3>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-400" />
              <span className="text-[14px] font-semibold font-mono" style={{ color: 'var(--sa-text)' }}>{data?.model ?? '—'}</span>
            </div>
          </div>

          {/* Available models */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
            <h3 className="text-[12px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{ta('availableModels')}</h3>
            <div className="space-y-2">
              {(data?.available_models ?? []).map(m => (
                <div key={m} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--sa-border)' }}>
                  <span className="text-[12px] font-mono" style={{ color: 'var(--sa-text-2)' }}>{m}</span>
                  {m === data?.model && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-400">{ta('active')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Usage */}
          <div className="rounded-xl border px-5 py-4" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
            <h3 className="text-[12px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{ta('usage')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[22px] font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>
                  {(data?.usage.tokens_used ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{ta('tokensUsed')}</p>
              </div>
              <div>
                <p className="text-[22px] font-black tabular-nums" style={{ color: 'var(--sa-text)' }}>
                  {(data?.usage.requests ?? 0).toLocaleString()}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{ta('requests')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}