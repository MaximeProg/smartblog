'use client';

import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function SelectField({ field, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>
      <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[13px] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
      >
        {!value && <option value="">— Sélectionner —</option>}
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
