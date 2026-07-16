'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { superadminApi } from '@/lib/api';

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

export default function PlatformPagesListPage() {
  const params = useParams();
  const locale = params.locale as string;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-platform-pages'],
    queryFn: () => superadminApi.listPlatformPages().then((r) => r.data),
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sa-text-3)' }}>
              CMS
            </span>
          </div>
          <h1 className="text-[22px] font-black" style={{ color: 'var(--sa-text)' }}>Pages publiques</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
            Contenu des pages marketing pilotes (Home, About, Contact) — traduit automatiquement via DeepL.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="h-9 w-9 flex items-center justify-center rounded-xl border hover:bg-[var(--sa-surface)]"
          style={{ borderColor: 'var(--sa-border)', color: 'var(--sa-text-3)' }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: 'var(--sa-text-3)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(data?.pages ?? []).map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/superadmin/platform-pages/${p.slug}`}
              className="flex items-center justify-between rounded-xl border px-5 py-4 hover:bg-[var(--sa-surface)] transition-colors"
              style={{ borderColor: 'var(--sa-border)', background: 'var(--sa-card)' }}
            >
              <div>
                <p className="text-[14px] font-bold" style={{ color: 'var(--sa-text)' }}>
                  {PAGE_LABELS[p.slug] ?? p.slug}
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--sa-text-3)' }}>
                  {p.updated_at ? `Modifié le ${new Date(p.updated_at).toLocaleString(locale)}` : 'Jamais modifié'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4" style={{ color: 'var(--sa-text-3)' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
