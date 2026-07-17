'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Loader2, Languages, Sparkles } from 'lucide-react';
import { superadminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PlatformPageJsonEditor } from '@/components/superadmin/PlatformPageJsonEditor';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const PAGE_LABELS: Record<string, string> = {
  home: 'Accueil',
  about: 'À propos',
  contact: 'Contact',
  careers: 'Carrières',
  press: 'Presse',
  changelog: 'Changelog',
  status: 'Statut',
  'legal-privacy': 'Confidentialité',
  'legal-terms': "Conditions d'utilisation",
  'legal-cookies': 'Cookies',
  'legal-security': 'Sécurité',
  docs: 'Documentation',
  'docs-api': "Documentation — Référence d'API",
  guides: 'Guides',
};

export default function PlatformPageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const { toast } = useToast();
  const qc = useQueryClient();

  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiKeyPoints, setAiKeyPoints] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sa-platform-page', slug],
    queryFn: () => superadminApi.getPlatformPage(slug).then((r) => r.data),
  });

  useEffect(() => {
    if (data?.content) setContent(data.content);
  }, [data]);

  const { mutate: generateWithAi, isPending: aiLoading } = useMutation({
    mutationFn: () =>
      superadminApi.generatePlatformPageContent(slug, {
        topic: aiTopic,
        tone: aiTone,
        key_points: aiKeyPoints,
      }),
    onSuccess: ({ data: result }) => {
      setContent(result.result);
      setAiOpen(false);
      toast({ title: 'Contenu généré — relis et enregistre.' });
    },
    onError: () => toast({ title: "Échec de la génération IA", variant: 'destructive' }),
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (forceRetranslate: boolean) =>
      superadminApi.updatePlatformPage(slug, content ?? {}, forceRetranslate),
    onSuccess: () => {
      toast({ title: 'Page enregistrée' });
      qc.invalidateQueries({ queryKey: ['sa-platform-page', slug] });
      qc.invalidateQueries({ queryKey: ['sa-platform-pages'] });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${locale}/superadmin/platform-pages`)}
            className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-black" style={{ color: 'var(--sa-text)' }}>
              {PAGE_LABELS[slug] ?? slug}
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
              Contenu source anglais — les traductions sont régénérées automatiquement.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[13px] font-semibold hover:bg-[var(--sa-surface)] transition-colors"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}
          >
            <Sparkles className="h-3.5 w-3.5" /> Remplir avec l&apos;IA
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || !content}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border text-[13px] font-semibold hover:bg-[var(--sa-surface)] transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-2)' }}
          >
            <Languages className="h-3.5 w-3.5" /> Enregistrer + régénérer les traductions
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || !content}
            className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-[13px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-70"
            style={{ background: '#6366f1' }}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>

      {isLoading || !content ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <PlatformPageJsonEditor content={content} onChange={setContent} />
      )}

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remplir cette page avec l&apos;IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-2)' }}>
                Sujet / description de la page
              </label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                placeholder="Ex: page À propos d'une plateforme SaaS de blog multi-tenant destinée aux créateurs de contenu."
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none"
                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-2)' }}>Ton</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30"
                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
              >
                <option value="professional">Professionnel</option>
                <option value="friendly">Amical</option>
                <option value="bold">Affirmé</option>
                <option value="playful">Ludique</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--sa-text-2)' }}>
                Points clés à mettre en avant <span className="font-normal opacity-60">(optionnel)</span>
              </label>
              <textarea
                value={aiKeyPoints}
                onChange={(e) => setAiKeyPoints(e.target.value)}
                rows={2}
                placeholder="Ex: fondée en 2024, plus de 500 blogs créés, support multilingue."
                className="w-full px-3 py-2 rounded-lg border bg-transparent text-[13px] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 resize-none"
                style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text)' }}
              />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--sa-text-3)' }}>
              Seuls les champs texte seront générés — les images existantes ne sont jamais modifiées.
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => generateWithAi()}
              disabled={aiLoading || !aiTopic.trim()}
              className="flex items-center gap-1.5 h-9 px-5 rounded-xl text-[13px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: '#6366f1' }}
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
