'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioInput, StudioColorPicker,
} from '@/components/dashboard/BlogStudioShell';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

const SOCIAL_FIELDS = [
  { key: 'twitter',   label: 'Twitter / X',  placeholder: 'https://twitter.com/...' },
  { key: 'facebook',  label: 'Facebook',      placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram',     placeholder: 'https://instagram.com/...' },
  { key: 'linkedin',  label: 'LinkedIn',      placeholder: 'https://linkedin.com/...' },
  { key: 'youtube',   label: 'YouTube',       placeholder: 'https://youtube.com/...' },
  { key: 'rss',       label: 'Flux RSS',      placeholder: '/rss.xml' },
];

export default function GeneralPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => {
      const { data } = await tenantsApi.get(blogId);
      return data;
    },
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    primary_color: '#2563eb',
    cover_image_url: '',
    social_links: {} as Record<string, string>,
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? '',
        description: tenant.description ?? '',
        primary_color: tenant.primary_color ?? '#2563eb',
        cover_image_url: tenant.cover_image_url ?? '',
        social_links: (tenant as any).social_links ?? {},
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      name: form.name,
      description: form.description,
      primary_color: form.primary_color,
      cover_image_url: form.cover_image_url || null,
      social_links: form.social_links,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: 'Paramètres sauvegardés !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  const setSocial = (key: string, val: string) =>
    setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }));

  return (
    <BlogStudioShell
      title="Paramètres généraux"
      description="Nom, couleur, description et réseaux sociaux de votre blog."
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="identity" title="Identité du blog" defaultOpen>
        <StudioField label="Nom du blog">
          <StudioInput
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="Mon blog"
          />
        </StudioField>
        <StudioField label="Description" hint="Apparaît dans le footer et les méta SEO.">
          <StudioInput
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
            placeholder="Un blog sur…"
            multiline
            rows={3}
          />
        </StudioField>
        <StudioField
          label="Miniature"
          hint="Image affichée sur votre dashboard et les cartes de blog."
        >
          <ImagePicker
            value={form.cover_image_url}
            onChange={v => setForm(f => ({ ...f, cover_image_url: v }))}
            tenantId={blogId}
          />
        </StudioField>
      </StudioSection>

      <StudioSection id="url" title="URL du blog">
        <StudioField label="Adresse">
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] text-slate-400 font-mono shrink-0">nexusblog.io/</span>
            <span className="text-[13px] text-slate-800 font-mono">{tenant?.slug}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Le slug ne peut pas être modifié après création.</p>
        </StudioField>
      </StudioSection>

      <StudioSection id="color" title="Couleur principale" defaultOpen>
        <StudioField label="Couleur" hint="Utilisée pour les boutons, liens et accents du blog.">
          <StudioColorPicker
            value={form.primary_color}
            onChange={v => setForm(f => ({ ...f, primary_color: v }))}
          />
        </StudioField>
      </StudioSection>

      <StudioSection id="social" title="Réseaux sociaux" defaultOpen={false}>
        {SOCIAL_FIELDS.map(s => (
          <StudioField key={s.key} label={s.label}>
            <StudioInput
              value={form.social_links[s.key] ?? ''}
              onChange={v => setSocial(s.key, v)}
              placeholder={s.placeholder}
            />
          </StudioField>
        ))}
      </StudioSection>
    </BlogStudioShell>
  );
}
