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
import { StudioRichText } from '@/components/dashboard/StudioRichText';
import { ImagePicker } from '@/components/dashboard/ImagePicker';

interface StatItem { value: string; label: string; }
interface ValueItem { icon: string; title: string; description: string; }
interface TeamMember { name: string; role: string; bio: string; avatar_url?: string; }

interface AboutConfig {
  hero: { enabled: boolean; subtitle: string; title: string; description: string; cover_image_url?: string };
  stats: { enabled: boolean; items: StatItem[] };
  mission: { enabled: boolean; title: string; description: string; image_url?: string };
  values: { enabled: boolean; title: string; items: ValueItem[] };
  team: { enabled: boolean; title: string; members: TeamMember[] };
  cta: { enabled: boolean; title: string; description: string; primaryLabel: string; secondaryLabel: string };
}

const DEFAULT: AboutConfig = {
  hero: { enabled: true, subtitle: 'À propos', title: 'À propos de nous', description: 'Découvrez notre histoire, notre mission et notre équipe.', cover_image_url: '' },
  stats: { enabled: true, items: [{ value: '0', label: 'Articles' }, { value: '0', label: 'Abonnés' }] },
  mission: { enabled: true, title: 'Notre mission', description: 'Partager des insights de qualité avec nos lecteurs.', image_url: '' },
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
            <StudioField label="Sous-titre (badge)">
              <StudioInput value={cfg.hero.subtitle} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, subtitle: v } }))} placeholder="À propos" />
            </StudioField>
            <StudioField label="Titre principal">
              <StudioInput value={cfg.hero.title} onChange={v => patch(c => ({ ...c, hero: { ...c.hero, title: v } }))} placeholder="À propos de nous" />
            </StudioField>
            <StudioField label="Description">
              <StudioRichText
                value={cfg.hero.description}
                onChange={v => patch(c => ({ ...c, hero: { ...c.hero, description: v } }))}
                placeholder="Présentez votre blog, votre histoire…"
                tenantId={blogId}
                minHeight={120}
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Stats ── */}
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

      {/* ── Mission ── */}
      <StudioSection id="mission" title="Mission" defaultOpen={false}>
        <StudioSwitch label="Afficher la mission" checked={cfg.mission.enabled} onChange={v => patch(c => ({ ...c, mission: { ...c.mission, enabled: v } }))} />
        {cfg.mission.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.mission.title} onChange={v => patch(c => ({ ...c, mission: { ...c.mission, title: v } }))} placeholder="Notre mission" />
            </StudioField>
            <StudioField label="Contenu">
              <StudioRichText
                value={cfg.mission.description}
                onChange={v => patch(c => ({ ...c, mission: { ...c.mission, description: v } }))}
                placeholder="Décrivez votre mission en détail…"
                tenantId={blogId}
                minHeight={150}
              />
            </StudioField>
            <StudioField label="Image illustrative (optionnelle)">
              <ImagePicker
                value={cfg.mission.image_url ?? ''}
                onChange={url => patch(c => ({ ...c, mission: { ...c.mission, image_url: url } }))}
                tenantId={blogId}
                ratio="16/9"
              />
            </StudioField>
          </>
        )}
      </StudioSection>

      {/* ── Valeurs ── */}
      <StudioSection id="values" title="Valeurs" defaultOpen={false}>
        <StudioSwitch label="Afficher les valeurs" checked={cfg.values.enabled} onChange={v => patch(c => ({ ...c, values: { ...c.values, enabled: v } }))} />
        {cfg.values.enabled && (
          <>
            <StudioField label="Titre de la section">
              <StudioInput value={cfg.values.title} onChange={v => patch(c => ({ ...c, values: { ...c.values, title: v } }))} placeholder="Nos valeurs" />
            </StudioField>
            <div className="space-y-3">
              {cfg.values.items.map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <input value={item.icon} onChange={e => patch(c => ({ ...c, values: { ...c.values, items: c.values.items.map((x, j) => j === i ? { ...x, icon: e.target.value } : x) } }))}
                      placeholder="🎯" className="w-12 h-9 text-center rounded-lg border border-slate-200 bg-white text-[18px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <input value={item.title} onChange={e => patch(c => ({ ...c, values: { ...c.values, items: c.values.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) } }))}
                      placeholder="Titre de la valeur" className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    <button onClick={() => patch(c => ({ ...c, values: { ...c.values, items: c.values.items.filter((_, j) => j !== i) } }))}
                      className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea value={item.description} onChange={e => patch(c => ({ ...c, values: { ...c.values, items: c.values.items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) } }))}
                    placeholder="Description…" rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
              ))}
              <button onClick={() => patch(c => ({ ...c, values: { ...c.values, items: [...c.values.items, { icon: '✨', title: 'Nouvelle valeur', description: '' }] } }))}
                className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700">
                <Plus className="h-3.5 w-3.5" /> Ajouter une valeur
              </button>
            </div>
          </>
        )}
      </StudioSection>

      {/* ── Équipe ── */}
      <StudioSection id="team" title="Équipe" defaultOpen={false}>
        <StudioSwitch label="Afficher la section équipe sur le blog" checked={cfg.team.enabled} onChange={v => patch(c => ({ ...c, team: { ...c.team, enabled: v } }))} />
        <StudioField label="Titre de la section">
          <StudioInput value={cfg.team.title} onChange={v => patch(c => ({ ...c, team: { ...c.team, title: v } }))} placeholder="Notre équipe" />
        </StudioField>
        <div className="space-y-3">
          {cfg.team.members.map((m, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-20 shrink-0">
                  <ImagePicker
                    value={m.avatar_url ?? ''}
                    onChange={url => patch(c => ({ ...c, team: { ...c.team, members: c.team.members.map((x, j) => j === i ? { ...x, avatar_url: url } : x) } }))}
                    tenantId={blogId}
                    ratio="1/1"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <input value={m.name} onChange={e => patch(c => ({ ...c, team: { ...c.team, members: c.team.members.map((x, j) => j === i ? { ...x, name: e.target.value } : x) } }))}
                    placeholder="Prénom Nom" className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <input value={m.role} onChange={e => patch(c => ({ ...c, team: { ...c.team, members: c.team.members.map((x, j) => j === i ? { ...x, role: e.target.value } : x) } }))}
                    placeholder="Rôle / Titre" className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <textarea value={m.bio} onChange={e => patch(c => ({ ...c, team: { ...c.team, members: c.team.members.map((x, j) => j === i ? { ...x, bio: e.target.value } : x) } }))}
                    placeholder="Bio courte…" rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-slate-300 text-[12px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
                <button onClick={() => patch(c => ({ ...c, team: { ...c.team, members: c.team.members.filter((_, j) => j !== i) } }))}
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => patch(c => ({ ...c, team: { ...c.team, members: [...c.team.members, { name: '', role: '', bio: '', avatar_url: '' }] } }))}
            className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 hover:text-blue-700">
            <Plus className="h-3.5 w-3.5" /> Ajouter un membre
          </button>
        </div>
      </StudioSection>

      {/* ── CTA ── */}
      <StudioSection id="cta" title="Bloc CTA" defaultOpen={false}>
        <StudioSwitch label="Afficher le CTA" checked={cfg.cta.enabled} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, enabled: v } }))} />
        {cfg.cta.enabled && (
          <>
            <StudioField label="Titre">
              <StudioInput value={cfg.cta.title} onChange={v => patch(c => ({ ...c, cta: { ...c.cta, title: v } }))} placeholder="Rejoignez notre communauté" />
            </StudioField>
            <StudioField label="Description">
              <StudioRichText
                value={cfg.cta.description}
                onChange={v => patch(c => ({ ...c, cta: { ...c.cta, description: v } }))}
                placeholder="Abonnez-vous pour ne rien manquer…"
                minHeight={80}
              />
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
