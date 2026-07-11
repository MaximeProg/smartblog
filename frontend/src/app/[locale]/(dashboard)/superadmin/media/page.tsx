'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Image, Film, Music, FileText, HardDrive, RefreshCw, Search, Loader2 } from 'lucide-react';
import { superadminApi, type SAMediaItem } from '@/lib/api';
import SAPagination from '@/components/superadmin/SAPagination';

const PAGE_SIZE = 15;

const TYPE_META: Record<string, { icon: typeof Image; color: string }> = {
  image:    { icon: Image,    color: '#3b82f6' },
  video:    { icon: Film,     color: '#8b5cf6' },
  audio:    { icon: Music,    color: '#f59e0b' },
  document: { icon: FileText, color: '#10b981' },
};

function fmtSize(b: number | null) {
  if (!b) return '—';
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MediaPage() {
  const t  = useTranslations('superAdmin');
  const tm = useTranslations('superAdmin.media');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-media', typeFilter, page],
    queryFn: () => superadminApi.listMedia({
      media_type: typeFilter || undefined,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then(r => r.data),
  });

  const stats = data?.stats;
  const total = data?.total ?? 0;
  const all   = data?.media ?? [];
  const items = search
    ? all.filter((m: SAMediaItem) =>
        (m.filename ?? '').toLowerCase().includes(search.toLowerCase()) ||
        m.tenant_name.toLowerCase().includes(search.toLowerCase())
      )
    : all;

  const TYPES = ['', 'image', 'video', 'audio', 'document'];

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Image className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>{tm('breadcrumb')}</span>
          </div>
          <h1 className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{tm('title')}</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            {tm('subtitle', { count: stats?.total ?? 0, size: fmtSize(stats?.total_size_bytes ?? null) })}
          </p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 h-9 px-3 rounded-xl border text-[11px]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl border px-4 py-3" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <HardDrive className="h-4 w-4 mb-2" style={{ color: '#3b82f6' }} />
          <p className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{stats?.total ?? 0}</p>
          <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{tm('kpi.files')}</p>
        </div>
        <div className="rounded-xl border px-4 py-3" style={{ background: 'var(--sa-card)', borderColor: 'var(--sa-border)' }}>
          <HardDrive className="h-4 w-4 mb-2" style={{ color: '#10b981' }} />
          <p className="text-[20px] font-black" style={{ color: 'var(--sa-text)' }}>{fmtSize(stats?.total_size_bytes ?? null)}</p>
          <p className="text-[10px]" style={{ color: 'var(--sa-text-3)' }}>{tm('kpi.storage')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--sa-text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')}
            className="w-full h-9 pl-8 pr-3 rounded-xl border bg-transparent text-[12px] focus:outline-none"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }} />
        </div>
        <div className="flex gap-1">
          {TYPES.map(tp2 => (
            <button key={tp2 || 'all'} onClick={() => { setTypeFilter(tp2); setPage(1); }}
              className="px-3 h-9 rounded-xl border text-[11px] font-semibold transition-colors"
              style={{
                borderColor: typeFilter === tp2 ? '#6366f1' : 'var(--sa-border)',
                background: typeFilter === tp2 ? '#6366f1' : 'transparent',
                color: typeFilter === tp2 ? '#fff' : 'var(--sa-text-3)',
              }}>
              {tp2 ? tm(`type.${tp2}`) : t('common.all')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
        {isLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--sa-text-3)' }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Image className="h-8 w-8" style={{ color: 'var(--sa-text-3)' }} />
            <p className="text-[12px]" style={{ color: 'var(--sa-text-3)' }}>{tm('empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sa-border)' }}>
                  {[tm('table.file'), tm('table.tenant'), tm('table.type'), tm('table.size'), tm('table.dimensions'), tm('table.date')].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--sa-text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m: SAMediaItem) => {
                  const meta = TYPE_META[m.type] ?? TYPE_META.document;
                  const Icon = meta.icon;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--sa-border)' }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {m.type === 'image' && m.url ? (
                            <img src={m.url} alt="" className="h-8 w-10 object-cover rounded" />
                          ) : (
                            <div className="h-8 w-10 rounded flex items-center justify-center" style={{ background: 'var(--sa-surface)' }}>
                              <Icon className="h-4 w-4" style={{ color: meta.color }} />
                            </div>
                          )}
                          <span className="truncate max-w-[140px]" style={{ color: 'var(--sa-text)' }}>{m.filename ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--sa-text-3)' }}>{m.tenant_name}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--sa-surface)', color: 'var(--sa-text-3)' }}>
                          <Icon className="h-2.5 w-2.5" style={{ color: meta.color }} /> {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--sa-text-3)' }}>{fmtSize(m.size_bytes)}</td>
                      <td className="px-4 py-2.5 tabular-nums" style={{ color: 'var(--sa-text-3)' }}>
                        {m.width && m.height ? `${m.width}×${m.height}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: 'var(--sa-text-3)' }}>{fmtDate(m.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <SAPagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} loading={isLoading} />
      </div>
    </div>
  );
}