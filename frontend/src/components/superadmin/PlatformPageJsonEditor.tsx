'use client';

import { Plus, Trash2 } from 'lucide-react';
import { deepSet, getPath } from '@/templates/utils';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

const inputCls = "w-full h-9 px-3 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30";
const inputStyle = { borderColor: 'var(--sa-border)', color: 'var(--sa-text)' } as React.CSSProperties;

// Même heuristique que backend/app/services/ai_service.py::_is_image_key —
// une clé qui matche est traitée comme un champ image (ImagePicker) plutôt
// qu'un champ texte, et jamais générée/modifiée par le remplissage IA.
const IMAGE_KEY_RE = /url|image|photo|logo|avatar|cover|background/i;

function humanLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

interface Props {
  content: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

/** Formulaire structuré générique — se génère dynamiquement depuis n'importe
 * quelle forme de JSON (utilisé pour les 3 pages CMS pilotes : home/about/
 * contact), sans schéma dédié par page. */
export function PlatformPageJsonEditor({ content, onChange }: Props) {
  const set = (path: string, value: unknown) => onChange(deepSet(content, path, value) as Record<string, unknown>);

  return (
    <div className="space-y-4">
      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="rounded-xl border p-4" style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}>
          <h3 className="text-[13px] font-bold mb-3" style={{ color: 'var(--sa-text)' }}>{humanLabel(key)}</h3>
          <NodeEditor path={key} value={value} onSet={set} />
        </div>
      ))}
    </div>
  );
}

function NodeEditor({ path, value, onSet }: { path: string; value: unknown; onSet: (path: string, value: unknown) => void }) {
  if (typeof value === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onSet(path, !value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-[#6366f1]' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onSet(path, Number(e.target.value))}
        className={inputCls}
        style={inputStyle}
      />
    );
  }

  if (typeof value === 'string') {
    const key = path.split('.').pop() ?? '';
    if (IMAGE_KEY_RE.test(key)) {
      const platformTenantId = process.env.NEXT_PUBLIC_PLATFORM_TENANT_ID ?? '';
      return (
        <ImagePicker
          value={value}
          onChange={(url) => onSet(path, url)}
          tenantId={platformTenantId}
          ratio="16/9"
        />
      );
    }
    if (value.length > 80) {
      return (
        <textarea
          value={value}
          rows={3}
          onChange={(e) => onSet(path, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none"
          style={inputStyle}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onSet(path, e.target.value)}
        className={inputCls}
        style={inputStyle}
      />
    );
  }

  if (Array.isArray(value)) {
    const isPrimitiveArray = value.every((v) => typeof v === 'string');

    if (isPrimitiveArray) {
      return (
        <div className="space-y-2">
          {(value as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = e.target.value;
                  onSet(path, next);
                }}
                className={inputCls}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => onSet(path, value.filter((_, idx) => idx !== i))}
                className="p-1.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onSet(path, [...value, ''])}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#6366f1] hover:opacity-80 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </button>
        </div>
      );
    }

    // Array of objects (team members, channels, features, response times, ...)
    return (
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'var(--sa-border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--sa-text-3)' }}>
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => onSet(path, value.filter((_, idx) => idx !== i))}
                className="p-1 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {typeof item === 'object' && item !== null
              ? Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="space-y-1">
                    <label className="block text-[11px] font-semibold" style={{ color: 'var(--sa-text-2)' }}>{humanLabel(k)}</label>
                    <NodeEditor path={`${path}.${i}.${k}`} value={v} onSet={onSet} />
                  </div>
                ))
              : (
                <NodeEditor path={`${path}.${i}`} value={item} onSet={onSet} />
              )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const template = value.length > 0 ? value[0] : {};
            const blank = typeof template === 'object' && template !== null
              ? Object.fromEntries(Object.keys(template).map((k) => [k, typeof (template as Record<string, unknown>)[k] === 'string' ? '' : (template as Record<string, unknown>)[k]]))
              : '';
            onSet(path, [...value, blank]);
          }}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#6366f1] hover:opacity-80 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un élément
        </button>
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-3 pl-3 border-l-2" style={{ borderColor: 'var(--sa-border)' }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="space-y-1">
            <label className="block text-[11px] font-semibold" style={{ color: 'var(--sa-text-2)' }}>{humanLabel(k)}</label>
            <NodeEditor path={`${path}.${k}`} value={v} onSet={onSet} />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// re-exported for convenience if a page needs raw path lookups
export { getPath };
