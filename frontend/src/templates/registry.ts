import type { TemplateSchema } from './types';
import { globalSections, basePages } from './_base';

function makeSchema(id: string, label: string): TemplateSchema {
  return { id, label, global: globalSections, pages: basePages };
}

const schemas: Record<string, TemplateSchema> = {
  editorial:  makeSchema('editorial',  'Editorial'),
  magazine:   makeSchema('magazine',   'Magazine'),
  corporate:  makeSchema('corporate',  'Corporate'),
  creative:   makeSchema('creative',   'Creative'),
  luminary:   makeSchema('luminary',   'Luminary'),
};

export function getSchema(theme: string): TemplateSchema {
  return schemas[theme] ?? schemas.editorial;
}

export function getAllSchemas(): TemplateSchema[] {
  return Object.values(schemas);
}
