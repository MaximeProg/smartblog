'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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

function buildDefault(ts: (key: any) => string, tn: (key: any) => string): ContactConfig {
  return {
    hero: { enabled: true, subtitle: tn('pageContact'), title: ts('placeholderContactHeroTitle'), description: '', cover_image_url: '' },
    form: {
      enabled: true,
      title: '',
      namePlaceholder: '',
      emailPlaceholder: ts('placeholderEmailExample'),
      subjectPlaceholder: '',
      messagePlaceholder: '',
      submitLabel: '',
      successMessage: '',
    },
    info: {
      enabled: true,
      title: tn('pageContact'),
      email: '',
      phone: '',
      responseTime: '',
      showAddress: false,
      address: '',
      mapEmbedUrl: '',
    },
  };
}

export default function ContactPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');
  const tn = useTranslations('blogNav');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<ContactConfig>(() => buildDefault(ts, tn));

  useEffect(() => {
    if (tenant?.template_config?.contact) {
      setCfg({ ...buildDefault(ts, tn), ...(tenant.template_config.contact as any) });
    }
  }, [tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (fn: (c: ContactConfig) => ContactConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), contact: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('contactSavedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  return (
    <BlogStudioShell
      title={ts('pageContact')}
      description={ts('pageContactDesc')}
      previewPath="/contact"
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      {/* ── Hero ── */}
      <StudioSection id="hero" title={ts('sectionHero')} defaultOpen>
        <StudioSwitch label={ts('switchShowHero')} checked={cfg.hero.enabled} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, enabled: v } }))} />
        {cfg.hero.enabled && (
          <>
            <StudioField label={ts('fieldOptionalImage')}>
              <ImagePicker
                value={cfg.hero.cover_image_url ?? ''}
                onChange={url => patch(c => ({ ...c, hero: { ...c.hero, cover_image_url: url } }))}
                tenantId={blogId}
                ratio="16/9"
              />
            </StudioField>
            <StudioField label={ts('fieldSubtitle')}>
              <StudioInput value={cfg.hero.subtitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, subtitle: v } }))} placeholder={tn('pageContact')} />
            </StudioField>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.hero.title} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, title: v } }))} placeholder={ts('placeholderContactHeroTitle')} />
            </StudioField>
            <StudioField label={ts('fieldDescription')}>
              <StudioRichText
                value={cfg.hero.description}
                onChange={v => patch(c => ({ ...c, hero: { ...c.hero, description: v } }))}
                placeholder="…"
                tenantId={blogId}
                minHeight={100}
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Formulaire ── */}
      <StudioSection id="form" title={ts('sectionContactForm')} defaultOpen>
        <StudioSwitch label={ts('switchShowContactForm')} checked={cfg.form.enabled} onChange={v => patch(c => ({ ...c, form: { ...c.form, enabled: v } }))} />
        {cfg.form.enabled && (
          <>
            <StudioField label={ts('fieldFormTitle')}>
              <StudioInput value={cfg.form.title} onChange={v => patch(c => ({ ...c, form: { ...c.form, title: v } }))} placeholder={ts('placeholderContactFormTitle')} />
            </StudioField>
            <StudioField label={ts('fieldNamePlaceholder')}>
              <StudioInput value={cfg.form.namePlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, namePlaceholder: v } }))} placeholder={ts('placeholderYourName')} />
            </StudioField>
            <StudioField label={ts('fieldEmailPlaceholder')}>
              <StudioInput value={cfg.form.emailPlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, emailPlaceholder: v } }))} placeholder={ts('placeholderEmailExample')} />
            </StudioField>
            <StudioField label={ts('fieldSubjectPlaceholder')}>
              <StudioInput value={cfg.form.subjectPlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, subjectPlaceholder: v } }))} placeholder={ts('placeholderSubject')} />
            </StudioField>
            <StudioField label={ts('fieldMessagePlaceholder')}>
              <StudioInput value={cfg.form.messagePlaceholder} onChange={v => patch(c => ({ ...c, form: { ...c.form, messagePlaceholder: v } }))} placeholder={ts('placeholderYourMessage')} />
            </StudioField>
            <StudioField label={ts('fieldSubmitLabel')}>
              <StudioInput value={cfg.form.submitLabel} onChange={v => patch(c => ({ ...c, form: { ...c.form, submitLabel: v } }))} placeholder={ts('placeholderSend')} />
            </StudioField>
            <StudioField label={ts('fieldSuccessMessage')}>
              <StudioInput value={cfg.form.successMessage} onChange={v => patch(c => ({ ...c, form: { ...c.form, successMessage: v } }))} placeholder={ts('placeholderMessageSentThanks')} />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Informations ── */}
      <StudioSection id="info" title={ts('sectionContactInfo')} defaultOpen={false}>
        <StudioSwitch label={ts('switchShowContactInfo')} checked={cfg.info.enabled} onChange={v => patch(c => ({ ...c, info: { ...c.info, enabled: v } }))} />
        {cfg.info.enabled && (
          <>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.info.title} onChange={v => patch(c => ({ ...c, info: { ...c.info, title: v } }))} placeholder={tn('pageContact')} />
            </StudioField>
            <StudioField label={ts('fieldContactEmail')}>
              <StudioInput value={cfg.info.email} onChange={v => patch(c => ({ ...c, info: { ...c.info, email: v } }))} placeholder={ts('placeholderContactEmailExample')} />
            </StudioField>
            <StudioField label={ts('fieldContactPhone')}>
              <StudioInput value={cfg.info.phone ?? ''} onChange={v => patch(c => ({ ...c, info: { ...c.info, phone: v } }))} placeholder={ts('placeholderPhoneExample')} />
            </StudioField>
            <StudioField label={ts('fieldResponseTime')}>
              <StudioInput value={cfg.info.responseTime} onChange={v => patch(c => ({ ...c, info: { ...c.info, responseTime: v } }))} placeholder={ts('placeholderResponseTime')} />
            </StudioField>
            <StudioSwitch label={ts('switchShowAddress')} checked={cfg.info.showAddress} onChange={v => patch(c => ({ ...c, info: { ...c.info, showAddress: v } }))} />
            {cfg.info.showAddress && (
              <>
                <StudioField label={ts('fieldAddress')}>
                  <StudioInput value={cfg.info.address} onChange={v => patch(c => ({ ...c, info: { ...c.info, address: v } }))} multiline rows={2} placeholder={ts('placeholderAddressExample')} />
                </StudioField>
                <StudioField label={ts('fieldMapEmbed')}>
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
