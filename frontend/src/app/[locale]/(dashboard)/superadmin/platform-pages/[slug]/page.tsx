'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Loader2, Languages } from 'lucide-react';
import { superadminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PlatformPageJsonEditor } from '@/components/superadmin/PlatformPageJsonEditor';

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

  const { data, isLoading } = useQuery({
    queryKey: ['sa-platform-page', slug],
    queryFn: () => superadminApi.getPlatformPage(slug).then((r) => r.data),
  });

  useEffect(() => {
    if (data?.content) setContent(data.content);
  }, [data]);

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
    </div>
  );
}
