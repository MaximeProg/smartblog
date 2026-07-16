'use client';

import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function TextField({ field, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>
      {field.hint && <p className="text-[11px] text-slate-400 dark:text-slate-500">{field.hint}</p>}
      <input
        type="text"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.hint ?? field.label}
        className="w-full text-[13px] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
      />
    </div>
  );
}

export function TextareaField({ field, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>
      {field.hint && <p className="text-[11px] text-slate-400 dark:text-slate-500">{field.hint}</p>}
      <textarea
        rows={3}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.hint ?? field.label}
        className="w-full text-[13px] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none transition"
      />
    </div>
  );
}
