'use client';

import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editor.store';
import { findSection, getPath } from '@/templates/utils';
import { FieldRenderer } from './fields/FieldRenderer';

export function PropertiesPanel() {
  const params   = useParams();
  const locale   = params.locale as string;
  const blogId   = params.blogId as string;
  const pathname = usePathname();
  const ts = useTranslations('studio');

  const { schema, selectedSectionId, selectSection, liveConfig, updateField } = useEditorStore();

  const isStudioRoot = pathname === `/${locale}/blogs/${blogId}`;
  if (!isStudioRoot || !selectedSectionId) return null;

  const section = schema ? findSection(schema, selectedSectionId) : null;
  if (!section) return null;

  return (
    <div className="w-[300px] shrink-0 h-full flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
          {section.labelKey ? ts(section.labelKey as any) : section.label}
        </h3>
        <button
          type="button"
          onClick={() => selectSection(null)}
          className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {section.fields.filter((field) => !field.inplace).map((field) => {
          const value = getPath(liveConfig, field.key);
          return (
            <FieldRenderer
              key={field.key}
              field={field}
              value={value}
              onChange={(v) => updateField(field.key, v)}
            />
          );
        })}
      </div>
    </div>
  );
}
