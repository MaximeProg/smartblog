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

interface ArticlePageConfig {
  progressBar: { enabled: boolean };
  tableOfContents: { enabled: boolean; title: string; minHeadings: number };
  share: { enabled: boolean; title: string; platforms: { twitter: boolean; linkedin: boolean; facebook: boolean; copyLink: boolean } };
  authorBio: { enabled: boolean; title: string };
  comments: { enabled: boolean };
  relatedArticles: { enabled: boolean; title: string; count: number };
}

const DEFAULT: ArticlePageConfig = {
  progressBar: { enabled: true },
  tableOfContents: { enabled: true, title: 'Dans cet article', minHeadings: 3 },
  share: { enabled: true, title: 'Partager', platforms: { twitter: true, linkedin: true, facebook: true, copyLink: true } },
  authorBio: { enabled: true, title: "À propos de l'auteur" },
  comments: { enabled: false },
  relatedArticles: { enabled: true, title: 'Articles similaires', count: 3 },
};

export default function ArticlePage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<ArticlePageConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.article) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.article as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: ArticlePageConfig) => ArticlePageConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), article: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: 'Page Article sauvegardée !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  return (
    <BlogStudioShell
      title="Page Article"
      description="Barre de progression, table des matières, partage, auteur et articles similaires."
      previewPath=""
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="progress" title="Barre de progression" defaultOpen>
        <StudioSwitch label="Afficher la barre de lecture" description="Barre de progression en haut de page pendant la lecture d'un article." checked={cfg.progressBar.enabled} onChange={v => patch(c => ({ ...c, progressBar: { enabled: v } }))} />
      </StudioSection>

      <StudioSection id="toc" title="Table des matières" defaultOpen>
        <StudioSwitch label="Afficher la table des matières" description="Générée automatiquement à partir des titres H2/H3 de l'article." checked={cfg.tableOfContents.enabled} onChange={v => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, enabled: v } }))} />
        {cfg.tableOfContents.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.tableOfContents.title} onChange={v => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, title: v } }))} placeholder="Dans cet article" />
            </StudioField>
            <StudioField label="Nombre minimal de titres" hint="N'affiche la TdM que si l'article contient au moins N titres.">
              <input
                type="number" min={1} max={10}
                value={cfg.tableOfContents.minHeadings}
                onChange={e => patch(c => ({ ...c, tableOfContents: { ...c.tableOfContents, minHeadings: Number(e.target.value) } }))}
                className="w-24 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="share" title="Boutons de partage" defaultOpen>
        <StudioSwitch label="Afficher les boutons de partage" checked={cfg.share.enabled} onChange={v => patch(c => ({ ...c, share: { ...c.share, enabled: v } }))} />
        {cfg.share.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.share.title} onChange={v => patch(c => ({ ...c, share: { ...c.share, title: v } }))} placeholder="Partager" />
            </StudioField>
            <StudioSwitch label="Twitter / X" checked={cfg.share.platforms.twitter} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, twitter: v } } }))} />
            <StudioSwitch label="LinkedIn" checked={cfg.share.platforms.linkedin} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, linkedin: v } } }))} />
            <StudioSwitch label="Facebook" checked={cfg.share.platforms.facebook} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, facebook: v } } }))} />
            <StudioSwitch label="Copier le lien" checked={cfg.share.platforms.copyLink} onChange={v => patch(c => ({ ...c, share: { ...c.share, platforms: { ...c.share.platforms, copyLink: v } } }))} />
          </>
        )}
      </StudioSection>

      <StudioSection id="author" title="Bio de l'auteur" defaultOpen>
        <StudioSwitch label="Afficher la bio de l'auteur" description="Bloc affiché en bas de l'article avec l'avatar et la bio de l'auteur." checked={cfg.authorBio.enabled} onChange={v => patch(c => ({ ...c, authorBio: { ...c.authorBio, enabled: v } }))} />
        {cfg.authorBio.enabled && (
          <StudioField label="Titre">
            <StudioInput value={cfg.authorBio.title} onChange={v => patch(c => ({ ...c, authorBio: { ...c.authorBio, title: v } }))} placeholder="À propos de l'auteur" />
          </StudioField>
        )}
      </StudioSection>

      <StudioSection id="related" title="Articles similaires" defaultOpen>
        <StudioSwitch label="Afficher les articles similaires" checked={cfg.relatedArticles.enabled} onChange={v => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, enabled: v } }))} />
        {cfg.relatedArticles.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.relatedArticles.title} onChange={v => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, title: v } }))} placeholder="Articles similaires" />
            </StudioField>
            <StudioField label="Nombre d'articles">
              <input
                type="number" min={2} max={6}
                value={cfg.relatedArticles.count}
                onChange={e => patch(c => ({ ...c, relatedArticles: { ...c.relatedArticles, count: Number(e.target.value) } }))}
                className="w-24 h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="comments" title="Commentaires" defaultOpen={false}>
        <StudioSwitch label="Activer les commentaires" description="Fonctionnalité en cours de développement." checked={cfg.comments.enabled} onChange={v => patch(c => ({ ...c, comments: { enabled: v } }))} />
      </StudioSection>
    </BlogStudioShell>
  );
}
