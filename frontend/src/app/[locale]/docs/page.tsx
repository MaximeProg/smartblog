import Link from 'next/link';
import { ArrowRight, BookOpen, Code2, Webhook, Key, Users, FileText } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const SECTIONS = [
  {
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-500',
    title: 'Getting Started',
    titleFr: 'Démarrage rapide',
    desc: 'Everything you need to set up your first blog and start publishing.',
    descFr: 'Tout ce dont vous avez besoin pour créer votre premier blog et commencer à publier.',
    href: '#',
  },
  {
    icon: Code2,
    color: 'bg-violet-500/10 text-violet-500',
    title: 'API Reference',
    titleFr: "Référence d'API",
    desc: 'Full REST API documentation with examples and SDKs.',
    descFr: 'Documentation REST API complète avec exemples et SDKs.',
    href: 'docs/api',
  },
  {
    icon: Webhook,
    color: 'bg-orange-500/10 text-orange-500',
    title: 'Webhooks',
    titleFr: 'Webhooks',
    desc: 'Integrate NexusBlog events into your own systems and workflows.',
    descFr: "Intégrez les événements NexusBlog dans vos propres systèmes.",
    href: '#',
  },
  {
    icon: Key,
    color: 'bg-emerald-500/10 text-emerald-500',
    title: 'Authentication',
    titleFr: 'Authentification',
    desc: 'Learn how to authenticate with the NexusBlog API using JWT.',
    descFr: "Apprenez à vous authentifier avec l'API NexusBlog via JWT.",
    href: '#',
  },
  {
    icon: Users,
    color: 'bg-cyan-500/10 text-cyan-500',
    title: 'Team & Roles',
    titleFr: "Équipes et rôles",
    desc: 'Manage access control and permissions for your team members.',
    descFr: "Gérez le contrôle d'accès et les permissions pour votre équipe.",
    href: '#',
  },
  {
    icon: FileText,
    color: 'bg-pink-500/10 text-pink-500',
    title: 'Content API',
    titleFr: "API de contenu",
    desc: 'Read published content with our public Content Delivery API.',
    descFr: 'Lisez le contenu publié avec notre API publique de diffusion.',
    href: '#',
  },
];

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Documentation' : 'Documentation'}
        subtitle={isFr
          ? "Guides, références d'API et ressources pour construire avec NexusBlog."
          : 'Guides, API references, and resources for building with NexusBlog.'}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Quick start terminal */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-14 font-mono text-sm">
          <p className="text-slate-500 mb-2 text-xs"># {isFr ? 'Vérification de l\'état de l\'API' : 'Check API status'}</p>
          <p className="text-emerald-400">{'$ curl https://api.nexusblog.com/v1/health'}</p>
          <p className="text-slate-300 mt-2">{'→ { "status": "ok", "version": "2.1.0" }'}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTIONS.map(({ icon: Icon, color, title, titleFr, desc, descFr, href }) => (
            <a
              key={title}
              href={href === '#' ? '#' : `/${locale}/${href}`}
              className="group bg-slate-50 dark:bg-slate-900 rounded-2xl p-7 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-5`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-500 transition-colors">
                {isFr ? titleFr : title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                {isFr ? descFr : desc}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-blue-500 font-semibold">
                {isFr ? 'En savoir plus' : 'Learn more'}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
