'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  loading?: boolean;
}

export default function SAPagination({ page, total, pageSize, onChange, loading }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1 && total <= pageSize) return null;

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to   = Math.min(page * pageSize, total);

  // Build page number list with ellipsis
  function pages(): (number | '…')[] {
    if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1);
    const around = new Set([1, 2, page - 1, page, page + 1, lastPage - 1, lastPage].filter(n => n >= 1 && n <= lastPage));
    const sorted = [...around].sort((a, b) => a - b);
    const result: (number | '…')[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - (sorted[i - 1] as number) > 1) result.push('…');
      result.push(n);
    });
    return result;
  }

  const btn = (
    active: boolean,
    disabled: boolean,
    onClick: () => void,
    children: React.ReactNode,
    key?: string | number,
  ) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      className="min-w-[30px] h-7 px-2 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: active ? '#6366f1' : 'transparent',
        color: active ? '#fff' : 'var(--sa-text-3)',
        border: active ? 'none' : '1px solid var(--sa-border)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--sa-border)' }}>
      <span className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>
        {loading ? '…' : `${from}–${to} / ${total}`}
      </span>
      <div className="flex items-center gap-1">
        {btn(false, page <= 1 || !!loading, () => onChange(page - 1),
          <ChevronLeft className="h-3.5 w-3.5" />, 'prev')}
        {pages().map((p, i) =>
          p === '…'
            ? <span key={`gap-${i}`} className="px-1 text-[11px]" style={{ color: 'var(--sa-text-3)' }}>…</span>
            : btn(p === page, !!loading, () => onChange(p as number), p, p)
        )}
        {btn(false, page >= lastPage || !!loading, () => onChange(page + 1),
          <ChevronRight className="h-3.5 w-3.5" />, 'next')}
      </div>
    </div>
  );
}
