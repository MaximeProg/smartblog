export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'image' | 'color'
  | 'boolean' | 'number' | 'select' | 'navlinks' | 'socials' | 'array';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  type: FieldType;
  label: string;
  hint?: string;
  inplace?: boolean;
  options?: SelectOption[];
  itemFields?: FieldDef[];
  ratio?: '16/9' | '1/1' | '3/2' | '4/3';
  min?: number;
  max?: number;
}

export interface SectionDef {
  id: string;
  label: string;
  icon?: string;
  fields: FieldDef[];
}

export interface PageDef {
  id: string;
  label: string;
  icon: string;
  canvasPath: string;
  sections: SectionDef[];
}

export interface TemplateSchema {
  id: string;
  label: string;
  global: SectionDef[];
  pages: PageDef[];
}
