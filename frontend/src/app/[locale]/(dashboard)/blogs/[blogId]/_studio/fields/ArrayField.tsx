'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDef } from '@/templates/types';
import { FieldRenderer } from './FieldRenderer';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function ArrayField({ field, value, onChange }: Props) {
  const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const updateItem = (index: number, key: string, val: unknown) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: val } : item,
    );
    onChange(next);
  };

  const addItem = () => {
    const empty: Record<string, unknown> = {};
    field.itemFields?.forEach((f) => { empty[f.key] = ''; });
    onChange([...items, empty]);
    setExpanded((s) => new Set([...s, items.length]));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setExpanded((s) => {
      const next = new Set<number>();
      s.forEach((v) => { if (v < index) next.add(v); else if (v > index) next.add(v - 1); });
      return next;
    });
  };

  const toggle = (index: number) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });

  const getItemLabel = (item: Record<string, unknown>, index: number): string => {
    const first = field.itemFields?.[0]?.key;
    return (first && (item[first] as string)) || `Élément ${index + 1}`;
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>

      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div
              className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none"
              onClick={() => toggle(i)}
            >
              {expanded.has(i)
                ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              }
              <span className="flex-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 truncate">
                {getItemLabel(item, i)}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                className="p-0.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            <div className={cn(
              'overflow-hidden transition-all',
              expanded.has(i) ? 'max-h-[1000px]' : 'max-h-0',
            )}>
              <div className="p-2.5 space-y-2.5 border-t border-slate-200 dark:border-slate-700">
                {field.itemFields?.map((subField) => (
                  <FieldRenderer
                    key={subField.key}
                    field={subField}
                    value={item[subField.key]}
                    onChange={(v) => updateItem(i, subField.key, v)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter
      </button>
    </div>
  );
}
