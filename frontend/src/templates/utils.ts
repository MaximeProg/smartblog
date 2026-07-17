import type { TemplateSchema, SectionDef, PageDef } from './types';

export function deepSet<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const existing = cur[k];
    cur[k] = Array.isArray(existing)
      ? [...existing]
      : existing != null
      ? { ...(existing as object) }
      : /^\d+$/.test(keys[i + 1]) ? [] : {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return result as T;
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function findSection(schema: TemplateSchema, id: string): SectionDef | null {
  for (const s of schema.global) if (s.id === id) return s;
  for (const p of schema.pages) for (const s of p.sections) if (s.id === id) return s;
  return null;
}

export function findPageBySection(schema: TemplateSchema, sectionId: string): PageDef | null {
  for (const p of schema.pages) {
    for (const s of p.sections) {
      if (s.id === sectionId) return p;
    }
  }
  return null;
}
