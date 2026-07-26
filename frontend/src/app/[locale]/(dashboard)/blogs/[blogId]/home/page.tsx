'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/use-auto-save';
import { getErrorMessage } from '@/lib/utils';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioSwitch, StudioInput,
} from '@/components/dashboard/BlogStudioShell';

interface HomeConfig {
  hero: { enabled: boolean; sectionTitle: string };
  categoriesStrip: { enabled: boolean; label: string };
  newsletter: {
    enabled: boolean;
    title: string;
    description: string;
    buttonLabel: string;
    placeholder: string;
    disclaimer: string;
  };
  latest: { enabled: boolean; sectionTitle: string; postsPerPage: number };
  sidebar: {
    popularArticles: boolean;
    popularTitle: string;
    categories: boolean;
    categoriesTitle: string;
    tags: boolean;
    tagsTitle: string;
    newsletterMini: boolean;
  };
}

function buildDefault(ts: (key: string) => string): HomeConfig {
  return {
    hero: { enabled: true, sectionTitle: ts('placeholderHeroTitle') },
    categoriesStrip: { enabled: true, label: ts('placeholderExplore') },
    newsletter: {
      enabled: true,
      title: '',
      description: '',
      buttonLabel: '',
      placeholder: ts('placeholderEmailExample'),
      disclaimer: '',
    },
    latest: { enabled: true, sectionTitle: ts('placeholderLatestArticles'), postsPerPage: 12 },
    sidebar: {
      popularArticles: true,
      popularTitle: '',
      categories: true,
      categoriesTitle: '',
      tags: true,
      tagsTitle: '',
      newsletterMini: true,
    },
  };
}

export default function HomePage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();
  const ts = useTranslations('studio');

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<HomeConfig>(() => buildDefault(ts));
  const [serverLoaded, setServerLoaded] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!isDirtyRef.current && tenant?.template_config?.home) {
      setCfg({ ...buildDefault(ts), ...(tenant.template_config.home as any) });
      setServerLoaded(true);
    }
  }, [tenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (fn: (c: HomeConfig) => HomeConfig) => {
    isDirtyRef.current = true;
    setCfg(fn);
  };

  const doSave = async (latestCfg: HomeConfig) => {
    await tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), home: latestCfg },
    });
    isDirtyRef.current = false;
    qc.invalidateQueries({ queryKey: ['tenant', blogId] });
  };

  const { isAutoSaving } = useAutoSave(cfg, doSave, { enabled: serverLoaded });

  const mutation = useMutation({
    mutationFn: () => doSave(cfg),
    onSuccess: () => toast({ title: ts('homeSavedToast') }),
    onError: (err: any) => toast({ variant: 'destructive', title: ts('saveError'), description: getErrorMessage(err, '') }),
  });

  return (
    <BlogStudioShell
      title={ts('pageHome')}
      description={ts('pageHomeDesc')}
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending || isAutoSaving}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="hero" title={ts('sectionFeatured')} defaultOpen>
        <StudioSwitch label={ts('switchShowSection')} checked={cfg.hero.enabled} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, enabled: v } }))} />
        {cfg.hero.enabled && (
          <StudioField label={ts('fieldSectionTitle')}>
            <StudioInput value={cfg.hero.sectionTitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, sectionTitle: v } }))} placeholder={ts('placeholderHeroTitle')} />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="categories-strip" title={ts('sectionCategoriesStrip')} defaultOpen>
        <StudioSwitch label={ts('switchShowStrip')} checked={cfg.categoriesStrip.enabled} onChange={v => patch(c => ({ ...c, categoriesStrip: { ...c.categoriesStrip, enabled: v } }))} />
        {cfg.categoriesStrip.enabled && (
          <StudioField label={ts('seeAllLabel')}>
            <StudioInput value={cfg.categoriesStrip.label} onChange={v => patch(c => ({ ...c, categoriesStrip: { ...c.categoriesStrip, label: v } }))} placeholder={ts('placeholderExplore')} />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="newsletter-band" title={ts('sectionNewsletterBand')} defaultOpen>
        <StudioSwitch label={ts('switchShowNewsletterSection')} checked={cfg.newsletter.enabled} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, enabled: v } }))} />
        {cfg.newsletter.enabled && (
          <>
            <StudioField label={ts('fieldTitle')}>
              <StudioInput value={cfg.newsletter.title} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, title: v } }))} placeholder={ts('placeholderNewsletterTitle')} />
            </StudioField>
            <StudioField label={ts('fieldDescription')}>
              <StudioInput value={cfg.newsletter.description} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, description: v } }))} multiline rows={2} placeholder={ts('placeholderNewsletterDesc')} />
            </StudioField>
            <StudioField label={ts('fieldButtonText')}>
              <StudioInput value={cfg.newsletter.buttonLabel} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, buttonLabel: v } }))} placeholder={ts('defaultSubscribeLabel')} />
            </StudioField>
            <StudioField label={ts('fieldEmailPlaceholder')}>
              <StudioInput value={cfg.newsletter.placeholder} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, placeholder: v } }))} placeholder={ts('placeholderEmailExample')} />
            </StudioField>
            <StudioField label={ts('fieldReassuranceText')}>
              <StudioInput value={cfg.newsletter.disclaimer} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, disclaimer: v } }))} placeholder={ts('placeholderNoSpam')} />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="latest" title={ts('sectionLatest')} defaultOpen>
        <StudioSwitch label={ts('switchShowArticlesGrid')} checked={cfg.latest.enabled} onChange={v => patch(c => ({ ...c, latest: { ...c.latest, enabled: v } }))} />
        {cfg.latest.enabled && (
          <>
            <StudioField label={ts('fieldSectionTitle')}>
              <StudioInput value={cfg.latest.sectionTitle} onChange={v => patch(c => ({ ...c, latest: { ...c.latest, sectionTitle: v } }))} placeholder={ts('placeholderLatestArticles')} />
            </StudioField>
            <StudioField label={ts('fieldPostsPerPage')}>
              <select
                value={cfg.latest.postsPerPage}
                onChange={e => patch(c => ({ ...c, latest: { ...c.latest, postsPerPage: Number(e.target.value) } }))}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {[6, 9, 12, 15, 20, 24].map(n => (
                  <option key={n} value={n}>{n} articles</option>
                ))}
              </select>
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="sidebar" title={ts('sectionSidebar')} defaultOpen={false}>
        <StudioSwitch label={ts('switchPopularArticles')} checked={cfg.sidebar.popularArticles} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, popularArticles: v } }))} />
        {cfg.sidebar.popularArticles && (
          <StudioField label={ts('fieldBlockTitle')}>
            <StudioInput value={cfg.sidebar.popularTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, popularTitle: v } }))} placeholder={ts('placeholderPopularArticles')} />
          </StudioField>
        )}
        <StudioSwitch label={ts('switchCategories')} checked={cfg.sidebar.categories} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, categories: v } }))} />
        {cfg.sidebar.categories && (
          <StudioField label={ts('fieldBlockTitle')}>
            <StudioInput value={cfg.sidebar.categoriesTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, categoriesTitle: v } }))} placeholder={ts('placeholderCategories')} />
          </StudioField>
        )}
        <StudioSwitch label={ts('switchTags')} checked={cfg.sidebar.tags} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, tags: v } }))} />
        {cfg.sidebar.tags && (
          <StudioField label={ts('fieldBlockTitle')}>
            <StudioInput value={cfg.sidebar.tagsTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, tagsTitle: v } }))} placeholder={ts('placeholderTags')} />
          </StudioField>
        )}
        <StudioSwitch label={ts('switchMiniNewsletter')} checked={cfg.sidebar.newsletterMini} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, newsletterMini: v } }))} />
      </StudioSection>
    </BlogStudioShell>
  );
}
