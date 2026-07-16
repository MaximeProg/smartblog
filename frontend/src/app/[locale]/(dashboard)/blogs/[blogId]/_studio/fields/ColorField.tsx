'use client';

import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function ColorField({ field, value, onChange }: Props) {
  const hex = (value as string) ?? '#3b82f6';
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded-md cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="flex-1 text-[12px] px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
        />
      </div>
    </div>
  );
}
