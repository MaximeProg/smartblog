'use client';

import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function NumberField({ field, value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>
      <input
        type="number"
        value={(value as number) ?? field.min ?? 0}
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-[13px] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
      />
      {(field.min !== undefined || field.max !== undefined) && (
        <p className="text-[11px] text-slate-400">
          {field.min !== undefined && `Min: ${field.min}`}
          {field.min !== undefined && field.max !== undefined && ' · '}
          {field.max !== undefined && `Max: ${field.max}`}
        </p>
      )}
    </div>
  );
}
