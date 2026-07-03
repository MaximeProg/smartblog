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
  latest: { enabled: boolean; sectionTitle: string };
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

const DEFAULT: HomeConfig = {
  hero: { enabled: true, sectionTitle: 'À la une' },
  categoriesStrip: { enabled: true, label: 'Explorer' },
  newsletter: {
    enabled: true,
    title: 'Restez toujours informé',
    description: 'Rejoignez nos abonnés et recevez chaque semaine nos meilleurs articles.',
    buttonLabel: "S'abonner",
    placeholder: 'votre@email.com',
    disclaimer: 'Pas de spam · Désabonnement en un clic',
  },
  latest: { enabled: true, sectionTitle: 'Derniers articles' },
  sidebar: {
    popularArticles: true,
    popularTitle: 'Articles populaires',
    categories: true,
    categoriesTitle: 'Catégories',
    tags: true,
    tagsTitle: 'Tags',
    newsletterMini: true,
  },
};

export default function HomePage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<HomeConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.home) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.home as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: HomeConfig) => HomeConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), home: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: 'Page Accueil sauvegardée !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  return (
    <BlogStudioShell
      title="Page Accueil"
      description="Sections À la une, catégories, newsletter, derniers articles et sidebar."
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="hero" title="Section À la une" defaultOpen>
        <StudioSwitch label="Afficher la section" checked={cfg.hero.enabled} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, enabled: v } }))} />
        {cfg.hero.enabled && (
          <StudioField label="Titre de la section">
            <StudioInput value={cfg.hero.sectionTitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, sectionTitle: v } }))} placeholder="À la une" />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="categories-strip" title="Bande de catégories" defaultOpen>
        <StudioSwitch label="Afficher la bande" checked={cfg.categoriesStrip.enabled} onChange={v => patch(c => ({ ...c, categoriesStrip: { ...c.categoriesStrip, enabled: v } }))} />
        {cfg.categoriesStrip.enabled && (
          <StudioField label="Label bouton &quot;Tout voir&quot;">
            <StudioInput value={cfg.categoriesStrip.label} onChange={v => patch(c => ({ ...c, categoriesStrip: { ...c.categoriesStrip, label: v } }))} placeholder="Explorer" />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="newsletter-band" title="Bande Newsletter" defaultOpen>
        <StudioSwitch label="Afficher la section newsletter" checked={cfg.newsletter.enabled} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, enabled: v } }))} />
        {cfg.newsletter.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.newsletter.title} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, title: v } }))} placeholder="Restez toujours informé" />
            </StudioField>
            <StudioField label="Description">
              <StudioInput value={cfg.newsletter.description} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, description: v } }))} multiline rows={2} placeholder="Rejoignez nos abonnés…" />
            </StudioField>
            <StudioField label="Texte du bouton">
              <StudioInput value={cfg.newsletter.buttonLabel} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, buttonLabel: v } }))} placeholder="S'abonner" />
            </StudioField>
            <StudioField label="Placeholder email">
              <StudioInput value={cfg.newsletter.placeholder} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, placeholder: v } }))} placeholder="votre@email.com" />
            </StudioField>
            <StudioField label="Texte de rassurance">
              <StudioInput value={cfg.newsletter.disclaimer} onChange={v => patch(c => ({ ...c, newsletter: { ...c.newsletter, disclaimer: v } }))} placeholder="Pas de spam…" />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="latest" title="Derniers articles" defaultOpen>
        <StudioSwitch label="Afficher la grille d'articles" checked={cfg.latest.enabled} onChange={v => patch(c => ({ ...c, latest: { ...c.latest, enabled: v } }))} />
        {cfg.latest.enabled && (
          <StudioField label="Titre de la section">
            <StudioInput value={cfg.latest.sectionTitle} onChange={v => patch(c => ({ ...c, latest: { ...c.latest, sectionTitle: v } }))} placeholder="Derniers articles" />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="sidebar" title="Sidebar latérale" defaultOpen={false}>
        <StudioSwitch label="Articles populaires" checked={cfg.sidebar.popularArticles} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, popularArticles: v } }))} />
        {cfg.sidebar.popularArticles && (
          <StudioField label="Titre du bloc">
            <StudioInput value={cfg.sidebar.popularTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, popularTitle: v } }))} placeholder="Articles populaires" />
          </StudioField>
        )}
        <StudioSwitch label="Catégories" checked={cfg.sidebar.categories} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, categories: v } }))} />
        {cfg.sidebar.categories && (
          <StudioField label="Titre du bloc">
            <StudioInput value={cfg.sidebar.categoriesTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, categoriesTitle: v } }))} placeholder="Catégories" />
          </StudioField>
        )}
        <StudioSwitch label="Tags" checked={cfg.sidebar.tags} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, tags: v } }))} />
        {cfg.sidebar.tags && (
          <StudioField label="Titre du bloc">
            <StudioInput value={cfg.sidebar.tagsTitle} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, tagsTitle: v } }))} placeholder="Tags" />
          </StudioField>
        )}
        <StudioSwitch label="Mini newsletter" checked={cfg.sidebar.newsletterMini} onChange={v => patch(c => ({ ...c, sidebar: { ...c.sidebar, newsletterMini: v } }))} />
      </StudioSection>
    </BlogStudioShell>
  );
}
