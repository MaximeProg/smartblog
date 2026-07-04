'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStudioPreview } from '@/contexts/studio-preview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogStudioShellProps {
  title: string;
  description?: string;
  previewPath?: string;
  blogSlug?: string;
  saving?: boolean;
  onSave?: () => void;
  children: ReactNode;
}

// ─── Accordion section ────────────────────────────────────────────────────────

interface StudioSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function StudioSection({ id, title, icon, badge, defaultOpen = true, children }: StudioSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 dark:border-slate-700 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-slate-500 dark:text-slate-400">{icon}</span>}
          <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          {badge && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

interface StudioFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function StudioField({ label, hint, children }: StudioFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 leading-snug">{hint}</p>}
      {children}
    </div>
  );
}

// ─── Toggle / switch ──────────────────────────────────────────────────────────

interface StudioSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function StudioSwitch({ label, description, checked, onChange }: StudioSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="flex-1">
        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-snug">{label}</p>
        {description && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────

interface StudioInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function StudioInput({ value, onChange, placeholder, multiline, rows = 3 }: StudioInputProps) {
  const cls = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none';
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cls} />;
  }
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

// ─── Color picker ─────────────────────────────────────────────────────────────

const QUICK_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#d97706', '#16a34a', '#0891b2',
  '#334155', '#1c1917',
];

interface StudioColorPickerProps {
  value: string;
  onChange: (v: string) => void;
}

export function StudioColorPicker({ value, onChange }: StudioColorPickerProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl border-2 border-white dark:border-slate-700 shadow-md shrink-0" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-mono"
          placeholder="#2563eb"
        />
        <label className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0">
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="sr-only" />
          <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </label>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_COLORS.map(c => (
          <button
            key={c} type="button" onClick={() => onChange(c)}
            className={`h-6 w-6 rounded-lg shadow-sm transition-transform hover:scale-110 ${value === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main shell — settings panel only (preview is in the layout) ──────────────

export function BlogStudioShell({
  title, description,
  previewPath = '',
  blogSlug,
  saving, onSave,
  children,
}: BlogStudioShellProps) {
  const { setPreview, refresh, setFullWidth } = useStudioPreview();
  const ts = useTranslations('studio');

  // Normal studio page: restore narrow panel mode
  useEffect(() => {
    setFullWidth(false);
  }, [setFullWidth]);

  // Sync preview config into the persistent panel in the layout
  useEffect(() => {
    setPreview({ path: previewPath, blogSlug });
  }, [previewPath, blogSlug, setPreview]);

  // Auto-refresh preview 400 ms after save completes
  const prevSavingRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevSavingRef.current === true && !saving) {
      setTimeout(() => refresh(), 400);
    }
    prevSavingRef.current = !!saving;
  }, [saving, refresh]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Panel header */}
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-700 px-5 py-4 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h1>
            {description && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{description}</p>}
          </div>
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="shrink-0 flex items-center gap-1.5 h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
            >
              {saving
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {ts('saving')}</>
                : <><Save className="h-3.5 w-3.5" /> {ts('save')}</>
              }
            </button>
          )}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
        {children}
      </div>
    </div>
  );
}
