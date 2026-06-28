import { Zap, Shield, Bot, BarChart2, Globe2, Wrench } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const RELEASES = [
  {
    version: '2.1.0',
    date: 'June 20, 2025',
    type: 'feature',
    icon: Bot,
    color: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    title: 'AI Writing Assistant',
    titleFr: 'Assistant de rédaction IA',
    changes: [
      'AI-powered content generation for articles',
      'Smart SEO title and meta description suggestions',
      'Grammar and style improvements',
      'Content outline generator',
    ],
    changesFr: [
      "Génération de contenu par IA pour les articles",
      "Suggestions intelligentes de titres SEO et méta-descriptions",
      "Améliorations grammaticales et stylistiques",
      "Générateur de plan de contenu",
    ],
  },
  {
    version: '2.0.0',
    date: 'May 15, 2025',
    type: 'major',
    icon: Zap,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    title: 'NexusBlog 2.0 — Multi-tenant Platform',
    titleFr: 'NexusBlog 2.0 — Plateforme Multi-tenant',
    changes: [
      'Complete platform rebuild with Next.js 15 and FastAPI',
      'Multi-tenant architecture supporting unlimited blogs',
      'Role-based access control (Owner, Admin, Editor, Author, Viewer)',
      'New rich text editor with TipTap',
      'Real-time analytics dashboard',
    ],
    changesFr: [
      "Refonte complète de la plateforme avec Next.js 15 et FastAPI",
      "Architecture multi-tenant supportant des blogs illimités",
      "Contrôle d'accès basé sur les rôles (Owner, Admin, Editor, Author, Viewer)",
      "Nouvel éditeur de texte riche avec TipTap",
      "Tableau de bord d'analyse en temps réel",
    ],
  },
  {
    version: '1.8.2',
    date: 'April 3, 2025',
    type: 'fix',
    icon: Wrench,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    title: 'Security & Performance Fixes',
    titleFr: 'Corrections de sécurité et de performance',
    changes: [
      'Fixed JWT token refresh edge case',
      'Improved image optimization pipeline',
      'Rate limiting improvements',
      'Database query optimization (40% faster)',
    ],
    changesFr: [
      "Correction d'un cas limite de rafraîchissement du token JWT",
      "Amélioration du pipeline d'optimisation des images",
      "Améliorations de la limitation de débit",
      "Optimisation des requêtes de base de données (40% plus rapide)",
    ],
  },
  {
    version: '1.8.0',
    date: 'March 12, 2025',
    type: 'feature',
    icon: BarChart2,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    title: 'Advanced Analytics',
    titleFr: 'Analytics Avancés',
    changes: [
      'Real-time visitor tracking',
      'Traffic source breakdown',
      'Top articles report',
      'Newsletter subscription analytics',
      'Export to CSV',
    ],
    changesFr: [
      "Suivi des visiteurs en temps réel",
      "Répartition des sources de trafic",
      "Rapport des meilleurs articles",
      "Analytiques des abonnements newsletter",
      "Export en CSV",
    ],
  },
  {
    version: '1.7.0',
    date: 'February 8, 2025',
    type: 'feature',
    icon: Globe2,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    title: 'Multilingual Support',
    titleFr: 'Support Multilingue',
    changes: [
      'Platform interface in English and French',
      'RTL language support (Arabic, Hebrew)',
      'Automatic locale detection',
      'Per-article language setting',
    ],
    changesFr: [
      "Interface de la plateforme en anglais et en français",
      "Support des langues RTL (arabe, hébreu)",
      "Détection automatique de la locale",
      "Paramètre de langue par article",
    ],
  },
  {
    version: '1.6.0',
    date: 'January 15, 2025',
    type: 'feature',
    icon: Shield,
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    title: 'Enterprise Security Features',
    titleFr: 'Fonctionnalités de sécurité entreprise',
    changes: [
      'Two-factor authentication (2FA)',
      'Comprehensive audit logs',
      'IP allowlist for team access',
      'Session management dashboard',
    ],
    changesFr: [
      "Authentification à deux facteurs (2FA)",
      "Journaux d'audit complets",
      "Liste d'autorisation IP pour l'accès de l'équipe",
      "Tableau de bord de gestion des sessions",
    ],
  },
];

const typeBadge: Record<string, { label: string; labelFr: string; cls: string }> = {
  major: { label: 'Major Release', labelFr: 'Version majeure', cls: 'bg-blue-600 text-white' },
  feature: { label: 'New Feature', labelFr: 'Nouvelle fonctionnalité', cls: 'bg-violet-600 text-white' },
  fix: { label: 'Bug Fix', labelFr: 'Correction', cls: 'bg-emerald-600 text-white' },
};

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Journal des modifications' : 'Changelog'}
        subtitle={isFr
          ? 'Toutes les nouveautés, améliorations et corrections de NexusBlog.'
          : 'All new features, improvements, and fixes to NexusBlog.'}
      />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

          <div className="space-y-10">
            {RELEASES.map((release) => {
              const Icon = release.icon;
              const badge = typeBadge[release.type];
              return (
                <div key={release.version} className="relative pl-14">
                  {/* Timeline dot */}
                  <div className={`absolute left-0 h-10 w-10 rounded-xl border ${release.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="font-black text-lg">{release.version}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                        {isFr ? badge.labelFr : badge.label}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{release.date}</span>
                    </div>
                    <h3 className="font-bold text-base mb-4">
                      {isFr ? release.titleFr : release.title}
                    </h3>
                    <ul className="space-y-2">
                      {(isFr ? release.changesFr : release.changes).map((change) => (
                        <li key={change} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
