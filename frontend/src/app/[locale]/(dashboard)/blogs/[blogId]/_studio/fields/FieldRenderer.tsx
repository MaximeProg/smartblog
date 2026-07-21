'use client';

import { useTranslations } from 'next-intl';
import type { FieldDef } from '@/templates/types';
import { TextField, TextareaField } from './TextField';
import { BooleanField } from './BooleanField';
import { ColorField } from './ColorField';
import { SelectField } from './SelectField';
import { NumberField } from './NumberField';
import { ImageField } from './ImageField';
import { NavLinksField } from './NavLinksField';
import { SocialsField } from './SocialsField';
import { ArrayField } from './ArrayField';

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function FieldRenderer({ field: rawField, value, onChange }: Props) {
  const t = useTranslations('studio');
  // Le schéma de template (templates/_base.ts) porte des labels/hints par
  // défaut en dur (texte source) + une labelKey/hintKey — résolues ici une
  // seule fois pour tous les types de champ, plutôt que dans chacun.
  const field: FieldDef = rawField.labelKey || rawField.hintKey
    ? {
        ...rawField,
        label: rawField.labelKey ? t(rawField.labelKey as any) : rawField.label,
        hint: rawField.hintKey ? t(rawField.hintKey as any) : rawField.hint,
      }
    : rawField;

  switch (field.type) {
    case 'text':
    case 'richtext':
      return <TextField field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField field={field} value={value} onChange={onChange} />;
    case 'boolean':
      return <BooleanField field={field} value={value} onChange={onChange} />;
    case 'color':
      return <ColorField field={field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} />;
    case 'image':
      return <ImageField field={field} value={value} onChange={onChange} />;
    case 'navlinks':
      return <NavLinksField field={field} value={value} onChange={onChange} />;
    case 'socials':
      return <SocialsField field={field} value={value} onChange={onChange} />;
    case 'array':
      return <ArrayField field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
