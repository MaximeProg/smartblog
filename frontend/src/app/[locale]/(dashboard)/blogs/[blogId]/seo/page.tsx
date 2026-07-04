'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Search, Globe, Share2, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField, StudioInput,
} from '@/components/dashboard/BlogStudioShell';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

export default function SeoPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [form, setForm] = useState({
    seo_title_template:   '',
    seo_meta_description: '',
    og_image_url:         '',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        seo_title_template:   tenant.seo_title_template ?? '{title} | {blog_name}',
        seo_meta_description: tenant.seo_meta_description ?? '',
        og_image_url:         (tenant as any).og_image_url ?? '',
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      seo_title_template:   form.seo_title_template   || undefined,
      seo_meta_description: form.seo_meta_description || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('seoSavedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  const previewTitle = form.seo_title_template
    .replace('{title}', 'Mon article')
    .replace('{blog_name}', tenant?.name ?? 'Blog');

  const previewDesc = form.seo_meta_description || '…';

  return (
    <BlogStudioShell
      title={ts('pageSeo')}
      description={ts('pageSeoDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      {/* Google preview */}
      <div className="mx-5 mt-5 mb-1 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
          <Eye className="h-3 w-3" /> {ts('seoGooglePreview')}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <div className="h-3.5 w-3.5 rounded-sm bg-slate-200 flex items-center justify-center">
              <span className="text-[7px] font-black text-slate-500">N</span>
            </div>
            <span className="font-mono">{tenant?.slug ?? 'blog'}.nexusblog.io</span>
          </div>
          <p className="text-[14px] text-blue-700 font-medium leading-tight truncate">{previewTitle}</p>
          <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed">{previewDesc}</p>
        </div>
      </div>

      <StudioSection id="meta" title={ts('sectionMeta')} icon={<Search className="h-3.5 w-3.5" />} defaultOpen>
        <StudioField
          label={ts('fieldSeoTitleTemplate')}
          hint={ts('fieldSeoTitleTemplateHint')}
        >
          <StudioInput
            value={form.seo_title_template}
            onChange={v => setForm(f => ({ ...f, seo_title_template: v }))}
            placeholder="{title} | {blog_name}"
          />
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono bg-slate-50 rounded-lg px-2.5 py-1.5 truncate">
            → {previewTitle}
          </p>
        </StudioField>

        <StudioField
          label={ts('fieldMetaDescDefault')}
          hint={ts('fieldMetaDescDefaultHint')}
        >
          <StudioInput
            value={form.seo_meta_description}
            onChange={v => setForm(f => ({ ...f, seo_meta_description: v }))}
            placeholder="Découvrez nos meilleurs articles sur…"
            multiline
            rows={3}
          />
          <p className="text-[10px] text-slate-400 mt-1 text-right">
            {ts('seoCharCount', { n: form.seo_meta_description.length })}
          </p>
        </StudioField>
      </StudioSection>

      <StudioSection id="social" title={ts('sectionSocialShare')} icon={<Share2 className="h-3.5 w-3.5" />} defaultOpen={false}>
        <StudioField
          label={ts('fieldOgImage')}
          hint={ts('fieldOgImageHint')}
        >
          <ImagePicker
            value={form.og_image_url}
            onChange={v => setForm(f => ({ ...f, og_image_url: v }))}
            tenantId={blogId}
            ratio="16/9"
          />
        </StudioField>
      </StudioSection>

      <StudioSection id="sitemap" title={ts('sectionIndexing')} icon={<Globe className="h-3.5 w-3.5" />} defaultOpen={false}>
        <div className="space-y-3">
          {[
            { label: ts('seoSitemap'), url: `https://${tenant?.slug ?? '…'}.nexusblog.io/sitemap.xml` },
            { label: ts('seoRssFeed'), url: `https://${tenant?.slug ?? '…'}.nexusblog.io/rss.xml`    },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-[12px] font-semibold text-slate-700">{item.label}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{item.url}</p>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] font-semibold text-blue-600 border border-blue-100 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors"
              >
                {ts('seoView')}
              </a>
            </div>
          ))}
        </div>
      </StudioSection>
    </BlogStudioShell>
  );
}
