'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { tenantsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  BlogStudioShell, StudioSection, StudioField,
  StudioSwitch, StudioInput,
} from '@/components/dashboard/BlogStudioShell';

interface StatItem { value: string; label: string; }
interface ValueItem { icon: string; title: string; description: string; }
interface TeamMember { name: string; role: string; bio: string; }

interface AboutConfig {
  hero: { enabled: boolean; subtitle: string; title: string; description: string };
  stats: { enabled: boolean; items: StatItem[] };
  mission: { enabled: boolean; title: string; description: string };
  values: { enabled: boolean; title: string; items: ValueItem[] };
  team: { enabled: boolean; title: string; members: TeamMember[] };
  cta: { enabled: boolean; title: string; description: string; primaryLabel: string; secondaryLabel: string };
}

const DEFAULT: AboutConfig = {
  hero: { enabled: true, subtitle: 'À propos', title: 'À propos de nous', description: 'Découvrez notre histoire, notre mission et notre équipe.' },
  stats: { enabled: true, items: [{ value: '0', label: 'Articles' }, { value: '0', label: 'Abonnés' }] },
  mission: { enabled: true, title: 'Notre mission', description: 'Partager des insights de qualité avec nos lecteurs.' },
  values: { enabled: true, title: 'Nos valeurs', items: [{ icon: '🎯', title: 'Expertise', description: 'Des contenus rédigés par des experts.' }] },
  team: { enabled: false, title: 'Notre équipe', members: [] },
  cta: { enabled: true, title: 'Rejoignez notre communauté', description: "Abonnez-vous pour ne rien manquer.", primaryLabel: "S'abonner", secondaryLabel: 'Nos articles' },
};

export default function AboutPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', blogId],
    queryFn: async () => { const { data } = await tenantsApi.get(blogId); return data; },
  });

  const [cfg, setCfg] = useState<AboutConfig>(DEFAULT);

  useEffect(() => {
    if (tenant?.template_config?.about) {
      setCfg({ ...DEFAULT, ...(tenant.template_config.about as any) });
    }
  }, [tenant]);

  const patch = (fn: (c: AboutConfig) => AboutConfig) => setCfg(fn);

  const mutation = useMutation({
    mutationFn: () => tenantsApi.update(blogId, {
      template_config: { ...(tenant?.template_config ?? {}), about: cfg },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', blogId] });
      toast({ title: 'Page À propos sauvegardée !' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde.' }),
  });

  return (
    <BlogStudioShell
      title="Page À propos"
      description="Hero, stats, mission, valeurs, équipe et CTA."
      previewPath="/about"
      blogSlug={tenant?.slug}
      saving={mutation.isPending}
      onSave={() => mutation.mutate()}
    >
      <StudioSection id="hero" title="Section Hero" defaultOpen>
        <StudioSwitch label="Afficher le hero" checked={cfg.hero.enabled} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, enabled: v } }))} />
        {cfg.hero.enabled && (
          <>
            <StudioField label="Sous-titre (badge)">
              <StudioInput value={cfg.hero.subtitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, subtitle: v } }))} placeholder="À propos" />
            </StudioField>
            <StudioField label="Titre principal">
              <StudioInput value={cfg.hero.title} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, title: v } }))} placeholder="À propos de nous" />
            </StudioField>
            <StudioField label="Description">
              <StudioInput value={cfg.hero.description} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, description: v } }))} multiline rows={3} placeholder="Découvrez notre histoire…" />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="stats" title="Chiffres clés" defaultOpen>
        <StudioSwitch label="Afficher les stats" checked={cfg.stats.enabled} onChange={v => patch(c => ({ ...c, stats: { ...c.stats, enabled: v } }))} />
        {cfg.stats.enabled && (
          <div className="space-y-2">
            {cfg.stats.items.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={s.value} onChange={e => patch(c => ({ ...c, stats: { ...c.stats, items: c.stats.items.map((x, j) => j === i ? { ...x, value: e.target.value } : x) } }))}
                  placeholder="0" className="w-20 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input value={s.label} onChange={e => patch(c => ({ ...c, stats: { ...c.stats, items: c.stats.items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) } }))}
                  placeholder="Label" className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <button onClick={() => patch(c => ({ ...c, stats: { ...c.stats, items: c.stats.items.filter((_, j) => j !== i) } }))}
                  className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button onClick={() => patch(c => ({ ...c, stats: { ...c.stats, items: [...c.stats.items, { value: '0', label: 'Nouveau stat' }] } }))}
              className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700">
              <Plus className="h-3.5 w-3.5" /> Ajouter un chiffre
            </button>
          </div>
        )}
      </StudioSection>

      <StudioSection id="mission" title="Mission" defaultOpen={false}>
        <StudioSwitch label="Afficher la mission" checked={cfg.mission.enabled} onChange={v => patch(c => ({ ...c, mission: { ...c.mission, enabled: v } }))} />
        {cfg.mission.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.mission.title} onChange={v => patch(c => ({ ...c, mission: { ...c.mission, title: v } }))} placeholder="Notre mission" />
            </StudioField>
            <StudioField label="Description">
              <StudioInput value={cfg.mission.description} onChange={v => patch(c => ({ ...c, mission: { ...c.mission, description: v } }))} multiline rows={4} placeholder="Partager des insights…" />
            </StudioField>
          </>
        )}
      </StudioSection>

      <StudioSection id="cta" title="Bloc CTA" defaultOpen={false}>
        <StudioSwitch label="Afficher le CTA" checked={cfg.cta.enabled} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, enabled: v } }))} />
        {cfg.cta.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.cta.title} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, title: v } }))} placeholder="Rejoignez notre communauté" />
            </StudioField>
            <StudioField label="Description">
              <StudioInput value={cfg.cta.description} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, description: v } }))} multiline rows={2} placeholder="Abonnez-vous…" />
            </StudioField>
            <StudioField label="Bouton principal">
              <StudioInput value={cfg.cta.primaryLabel} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, primaryLabel: v } }))} placeholder="S'abonner" />
            </StudioField>
            <StudioField label="Bouton secondaire">
              <StudioInput value={cfg.cta.secondaryLabel} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, secondaryLabel: v } }))} placeholder="Nos articles" />
            </StudioField>
          </>
        )}
      </StudioSection>
    </BlogStudioShell>
  );
}
