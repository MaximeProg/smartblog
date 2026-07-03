'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioSwitch, StudioInput,
} from '@/components/dashboard/BlogStudioShell';
import { StudioRichText } from '@/components/dashboard/StudioRichText';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

interface ContactConfig {
  hero: { enabled: boolean; subtitle: string; title: string; description: string; cover_image_url?: string };
  form: {
    enabled: boolean;
    title: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    submitLabel: string;
    successMessage: string;
  };
  info: {
    enabled: boolean;
    title: string;
    email: string;
    phone?: string;
    responseTime: string;
    showAddress: boolean;
    address: string;
    mapEmbedUrl?: string;
  };
}

const DEFAULT: ContactConfig = {
  hero: { enabled: true, subtitle: 'Contact', title: 'Prenons contact', description: 'Une question ? Contactez-nous.', cover_image_url: '' },
  form: {
    enabled: true,
    title: 'Envoyez-nous un message',
    namePlaceholder: 'Votre nom',
    emailPlaceholder: 'votre@email.com',
    subjectPlaceholder: 'Sujet',
    messagePlaceholder: 'Votre message…',
    submitLabel: 'Envoyer',
    successMessage: 'Message envoyé, merci !',
  },
  info: {
    enabled: true,
    title: 'Contact',
    email: '',
    phone: '',
    responseTime: 'Réponse sous 48h',
    showAddress: false,
    address: '',
    mapEmbedUrl: '',
  },
};

export default function ContactPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<ContactConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.contact) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.contact as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: ContactConfig) => ContactConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), contact: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: 'Page Contact sauvegardée !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  return (
    <BlogStudioShell
      title="Page Contact"
      description="Hero, formulaire de contact et informations."
      previewPath="/contact"
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      {/* ── Hero ── */}
      <StudioSection id="hero" title="Section Hero" defaultOpen>
        <StudioSwitch label="Afficher le hero" checked={cfg.hero.enabled} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, enabled: v } }))} />
        {cfg.hero.enabled && (
          <>
            <StudioField label="Image de fond (optionnelle)">
              <ImagePicker
                value={cfg.hero.cover_image_url ?? ''}
                onChange={url => patch(c => ({ ...c, hero: { ...c.hero, cover_image_url: url } }))}
                tenantId={blogId}
                ratio="16/9"
              />
            </StudioField>
            <StudioField label="Badge">
              <StudioInput value={cfg.hero.subtitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, subtitle: v } }))} placeholder="Contact" />
            </StudioField>
            <StudioField label="Titre">
              <StudioInput value={cfg.hero.title} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, title: v } }))} placeholder="Prenons contact" />
            </StudioField>
            <StudioField label="Description">
              <StudioRichText
                value={cfg.hero.description}
                onChange={v => patch(c => ({ ...c, hero: { ...c.hero, description: v } }))}
                placeholder="Dites quelque chose d'accrocheur…"
                tenantId={blogId}
                minHeight={100}
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Formulaire ── */}
      <StudioSection id="form" title="Formulaire de contact" defaultOpen>
        <StudioSwitch label="Afficher le formulaire" checked={cfg.form.enabled} onChange={v => patch(c => ({ ...c, form: { ...c.form, enabled: v } }))} />
        {cfg.form.enabled && (
          <>
            <StudioField label="Titre du formulaire">
              <StudioInput value={cfg.form.title} onChange={v => patch(c => ({ ...c, form: { ...c.form, title: v } }))} placeholder="Envoyez-nous un message" />
            </StudioField>
            <StudioField label="Placeholder nom">
              <StudioInput value={cfg.form.namePlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, namePlaceholder: v } }))} placeholder="Votre nom" />
            </StudioField>
            <StudioField label="Placeholder email">
              <StudioInput value={cfg.form.emailPlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, emailPlaceholder: v } }))} placeholder="votre@email.com" />
            </StudioField>
            <StudioField label="Placeholder sujet">
              <StudioInput value={cfg.form.subjectPlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, subjectPlaceholder: v } }))} placeholder="Sujet" />
            </StudioField>
            <StudioField label="Placeholder message">
              <StudioInput value={cfg.form.messagePlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, messagePlaceholder: v } }))} placeholder="Votre message…" />
            </StudioField>
            <StudioField label="Texte du bouton Envoyer">
              <StudioInput value={cfg.form.submitLabel} onChange={v => patch(c => ({ ...c, form: { ...c.form, submitLabel: v } }))} placeholder="Envoyer" />
            </StudioField>
            <StudioField label="Message de succès">
              <StudioInput value={cfg.form.successMessage} onChange={v => patch(c => ({ ...c, form: { ...c.form, successMessage: v } }))} placeholder="Message envoyé, merci !" />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Informations ── */}
      <StudioSection id="info" title="Informations de contact" defaultOpen={false}>
        <StudioSwitch label="Afficher le bloc infos" checked={cfg.info.enabled} onChange={v => patch(c => ({ ...c, info: { ...c.info, enabled: v } }))} />
        {cfg.info.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.info.title} onChange={v => patch(c => ({ ...c, info: { ...c.info, title: v } }))} placeholder="Contact" />
            </StudioField>
            <StudioField label="Email de contact">
              <StudioInput value={cfg.info.email} onChange={v => patch(c => ({ ...c, info: { ...c.info, email: v } }))} placeholder="contact@monblog.com" />
            </StudioField>
            <StudioField label="Téléphone (optionnel)">
              <StudioInput value={cfg.info.phone ?? ''} onChange={v => patch(c => ({ ...c, info: { ...c.info, phone: v } }))} placeholder="+33 1 23 45 67 89" />
            </StudioField>
            <StudioField label="Délai de réponse">
              <StudioInput value={cfg.info.responseTime} onChange={v => patch(c => ({ ...c, info: { ...c.info, responseTime: v } }))} placeholder="Réponse sous 48h" />
            </StudioField>
            <StudioSwitch label="Afficher l'adresse" checked={cfg.info.showAddress} onChange={v => patch(c => ({ ...c, info: { ...c.info, showAddress: v } }))} />
            {cfg.info.showAddress && (
              <>
                <StudioField label="Adresse">
                  <StudioInput value={cfg.info.address} onChange={v => patch(c => ({ ...c, info: { ...c.info, address: v } }))} multiline rows={2} placeholder="1 rue de la Paix, Paris" />
                </StudioField>
                <StudioField label="URL carte Google Maps (embed, optionnel)">
                  <StudioInput value={cfg.info.mapEmbedUrl ?? ''} onChange={v => patch(c => ({ ...c, info: { ...c.info, mapEmbedUrl: v } }))} placeholder="https://maps.google.com/maps?..." />
                </StudioField>
              </>
            )}
          </>
        )}
      </StudioSection>
    </BlogStudioShell>
  );
}
