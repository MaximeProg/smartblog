'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioInput, StudioColorPicker,
} from '@/components/dashboard/BlogStudioShell';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

export default function GeneralPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const SOCIAL_FIELDS = [
    { key: 'twitter',   label: 'Twitter / X',  placeholder: 'https://twitter.com/...' },
    { key: 'facebook',  label: 'Facebook',      placeholder: 'https://facebook.com/...' },
    { key: 'instagram', label: 'Instagram',     placeholder: 'https://instagram.com/...' },
    { key: 'linkedin',  label: 'LinkedIn',      placeholder: 'https://linkedin.com/...' },
    { key: 'youtube',   label: 'YouTube',       placeholder: 'https://youtube.com/...' },
    { key: 'rss',       label: ts('fieldRss'),  placeholder: '/rss.xml' },
  ];

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
    ga4_measurement_id: '',
    matomo_url: '',
    matomo_site_id: '',
    facebook_pixel_id: '',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name ?? '',
        description: tenant.description ?? '',
        primary_color: tenant.primary_color ?? '#2563eb',
        cover_image_url: tenant.cover_image_url ?? '',
        social_links: (tenant as any).social_links ?? {},
        ga4_measurement_id: (tenant as any).ga4_measurement_id ?? '',
        matomo_url: (tenant as any).matomo_url ?? '',
        matomo_site_id: (tenant as any).matomo_site_id ?? '',
        facebook_pixel_id: (tenant as any).facebook_pixel_id ?? '',
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
      ga4_measurement_id: form.ga4_measurement_id || null,
      matomo_url: form.matomo_url || null,
      matomo_site_id: form.matomo_site_id || null,
      facebook_pixel_id: form.facebook_pixel_id || null,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('saved') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const setSocial = (key: string, val: string) =>
    setForm(f => ({ ...f, social_links: { ...f.social_links, [key]: val } }));

  return (
    <BlogStudioShell
      title={ts('pageGeneral')}
      description={ts('pageGeneralDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="identity" title={ts('sectionIdentity')} defaultOpen>
        <StudioField label={ts('fieldBlogName')}>
          <StudioInput
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="Mon blog"
          />
        </StudioField>
        <StudioField label={ts('fieldDescription')} hint={ts('fieldDescriptionHint')}>
          <StudioInput
            value={form.description}
            onChange={v => setForm(f => ({ ...f, description: v }))}
            placeholder="Un blog sur…"
            multiline
            rows={3}
          />
        </StudioField>
        <StudioField label={ts('fieldThumbnail')} hint={ts('fieldThumbnailHint')}>
          <ImagePicker
            value={form.cover_image_url}
            onChange={v => setForm(f => ({ ...f, cover_image_url: v }))}
            tenantId={blogId}
          />
        </StudioField>
      </StudioSection>

      <StudioSection id="url" title={ts('sectionUrl')}>
        <StudioField label={ts('fieldAddress')}>
          <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono shrink-0">smarterbloggers.com/</span>
            <span className="text-[13px] text-slate-800 dark:text-slate-200 font-mono">{tenant?.slug}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{ts('fieldSlugHint')}</p>
        </StudioField>
      </StudioSection>

      <StudioSection id="color" title={ts('sectionColor')} defaultOpen>
        <StudioField label={ts('fieldColor')} hint={ts('fieldColorHint')}>
          <StudioColorPicker
            value={form.primary_color}
            onChange={v => setForm(f => ({ ...f, primary_color: v }))}
          />
        </StudioField>
      </StudioSection>

      <StudioSection id="social" title={ts('sectionSocial')} defaultOpen={false}>
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

      <StudioSection id="integrations" title={ts('sectionIntegrations')} defaultOpen={false}>
        <StudioField label={ts('fieldGa4Id')} hint={ts('fieldGa4IdHint')}>
          <StudioInput
            value={form.ga4_measurement_id}
            onChange={v => setForm(f => ({ ...f, ga4_measurement_id: v }))}
            placeholder="G-XXXXXXXXXX"
          />
        </StudioField>
        <StudioField label={ts('fieldMatomoUrl')} hint={ts('fieldMatomoUrlHint')}>
          <StudioInput
            value={form.matomo_url}
            onChange={v => setForm(f => ({ ...f, matomo_url: v }))}
            placeholder="https://analytics.example.com"
          />
        </StudioField>
        <StudioField label={ts('fieldMatomoSiteId')}>
          <StudioInput
            value={form.matomo_site_id}
            onChange={v => setForm(f => ({ ...f, matomo_site_id: v }))}
            placeholder="1"
          />
        </StudioField>
        <StudioField label={ts('fieldFbPixelId')} hint={ts('fieldFbPixelIdHint')}>
          <StudioInput
            value={form.facebook_pixel_id}
            onChange={v => setForm(f => ({ ...f, facebook_pixel_id: v }))}
            placeholder="123456789012345"
          />
        </StudioField>
      </StudioSection>
    </BlogStudioShell>
  );
}
