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

interface ArticlePageConfig {
  progressBar: { enabled: boolean };
  tableOfContents: { enabled: boolean; title: string; minHeadings: number };
  share: { enabled: boolean; title: string; platforms: { twitter: boolean; linkedin: boolean; facebook: boolean; copyLink: boolean } };
  authorBio: { enabled: boolean; title: string };
  comments: { enabled: boolean };
  relatedArticles: { enabled: boolean; title: string; count: number };
}

function buildDefault(ts: (key: any) => string): ArticlePageConfig {
  return {
    progressBar: { enabled: true },
    tableOfContents: { enabled: true, title: ts('placeholderTocTitle'), minHeadings: 3 },
    share: { enabled: true, title: ts('placeholderShareTitle'), platforms: { twitter: true, linkedin: true, facebook: true, copyLink: true } },
    authorBio: { enabled: true, title: ts('placeholderAuthorBioTitle') },
    comments: { enabled: false },
    relatedArticles: { enabled: true, title: ts('placeholderRelatedTitle'), count: 3 },
  };
}

export default function ArticlePage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<ArticlePageConfig>(() => buildDefault(ts));

  useEffect(() => {
    if (tenant?.template_config?.article) {
      setCfg({ ...buildDefault(ts), ...(tenant.template_config.article as any) });
    }
  }, [tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (fn: (c: ArticlePageConfig) => ArticlePageConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), article: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: ts('articlePageSavedToast') });
    },
    onError: () => toast({ variant: 'destructive', title: ts('saveError') }),
  });

  return (
    <BlogStudioShell
      title={ts('pageArticle')}
      description={ts('pageArticleDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="progress" title={ts('sectionProgress')} defaultOpen>
        <StudioSwitch label={ts('switchShowProgressBar')} description={ts('switchShowProgressBarDesc')} checked={cfg.progressBar.enabled} onChange={v => patch(c => ({ ...c, progressBar: { enabled: v } }))} />
      </StudioSection>

      <StudioSection id="toc" title={ts('sectionToc')} defaultOpen>
        <StudioSwitch label={ts('switchShowToc')} description={ts('switchShowTocDesc')} checked={cfg.tableOfContents.enabled} onChange={v => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, enabled: v } }))} />
        {cfg.tableOfContents.enabled && (
          <>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.tableOfContents.title} onChange={v => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, title: v } }))} placeholder={ts('placeholderTocTitle')} />
            </StudioField>
            <StudioField label={ts('fieldMinHeadings')} hint={ts('fieldMinHeadingsHint')}>
              <input
                type="number" min={1} max={10}
                value={cfg.tableOfContents.minHeadings}
                onChange={e => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, minHeadings: Number(e.target.value) } }))}
                className="w-24 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="share" title={ts('sectionShare')} defaultOpen>
        <StudioSwitch label={ts('switchShowShare')} checked={cfg.share.enabled} onChange={v => patch(c => ({ ...c, share: { ...c.share, enabled: v } }))} />
        {cfg.share.enabled && (
          <>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.share.title} onChange={v => patch(c => ({ ...c, share: { ...c.share, title: v } }))} placeholder={ts('placeholderShareTitle')} />
            </StudioField>
            <StudioSwitch label="Twitter / X" checked={cfg.share.platforms.twitter} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, twitter: v } } }))} />
            <StudioSwitch label="LinkedIn" checked={cfg.share.platforms.linkedin} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, linkedin: v } } }))} />
            <StudioSwitch label="Facebook" checked={cfg.share.platforms.facebook} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, facebook: v } } }))} />
            <StudioSwitch label={ts('switchCopyLink')} checked={cfg.share.platforms.copyLink} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, copyLink: v } } }))} />
          </>
        )}
      </StudioSection>

      <StudioSection id="author" title={ts('sectionAuthorBio')} defaultOpen>
        <StudioSwitch label={ts('switchShowAuthorBio')} description={ts('switchShowAuthorBioDesc')} checked={cfg.authorBio.enabled} onChange={v => patch(c => ({ ...c, authorBio: { ...c.authorBio, enabled: v } }))} />
        {cfg.authorBio.enabled && (
          <StudioField label={ts('fieldTitle')}>
            <StudioInput value={cfg.authorBio.title} onChange={v => patch(c => ({ ...c, authorBio: { ...c.authorBio, title: v } }))} placeholder={ts('placeholderAuthorBioTitle')} />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="related" title={ts('sectionRelated')} defaultOpen>
        <StudioSwitch label={ts('switchShowRelated')} checked={cfg.relatedArticles.enabled} onChange={v => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, enabled: v } }))} />
        {cfg.relatedArticles.enabled && (
          <>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.relatedArticles.title} onChange={v => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, title: v } }))} placeholder={ts('placeholderRelatedTitle')} />
            </StudioField>
            <StudioField label={ts('fieldArticleCount')}>
              <input
                type="number" min={2} max={6}
                value={cfg.relatedArticles.count}
                onChange={e => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, count: Number(e.target.value) } }))}
                className="w-24 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="comments" title={ts('sectionComments')} defaultOpen={false}>
        <StudioSwitch label={ts('switchEnableComments')} description={ts('switchEnableCommentsDesc')} checked={cfg.comments.enabled} onChange={v => patch(c => ({ ...c, comments: { enabled: v } }))} />
      </StudioSection>
    </BlogStudioShell>
  );
}
