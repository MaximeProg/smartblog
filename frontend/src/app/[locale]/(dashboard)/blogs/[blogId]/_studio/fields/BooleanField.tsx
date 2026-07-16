'use client';

import { cn } from '@/lib/utils';
import type { FieldDef } from '@/templates/types';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function BooleanField({ field, value, onChange }: Props) {
  const checked = Boolean(value);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-0.5 group"
    >
      <span className="text-[13px] text-slate-700 dark:text-slate-300 text-left leading-tight">
        {field.label}
      </span>
      <div className={cn(
        'relative w-8 h-[18px] rounded-full transition-colors shrink-0',
        checked ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600',
      )}>
        <div className={cn(
          'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )} />
      </div>
    </button>
  );
}
