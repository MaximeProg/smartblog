'use client';

import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { FieldDef } from '@/templates/types';

interface NavLink { label: string; url: string }

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function NavLinksField({ field, value, onChange }: Props) {
  const links: NavLink[] = Array.isArray(value) ? (value as NavLink[]) : [];

  const update = (index: number, key: keyof NavLink, val: string) => {
    const next = links.map((l, i) => i === index ? { ...l, [key]: val } : l);
    onChange(next);
  };

  const add = () => onChange([...links, { label: '', url: '' }]);

  const remove = (index: number) => onChange(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {field.label}
      </label>

      <div className="space-y-1.5">
        {links.map((link, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <GripVertical className="h-4 w-4 text-slate-300 dark:text-slate-600 mt-[7px] shrink-0 cursor-grab" />
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={link.label}
                onChange={(e) => update(i, 'label', e.target.value)}
                placeholder="Libellé"
                className="w-full text-[12px] px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => update(i, 'url', e.target.value)}
                placeholder="/page ou https://..."
                className="w-full text-[12px] px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-[7px] p-1 text-slate-400 hover:text-red-500 transition shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
      >
        <Plus className="h-3.5 w-3.5" />
        Ajouter un lien
      </button>
    </div>
  );
}
