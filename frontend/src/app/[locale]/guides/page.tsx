import { Clock, ArrowRight, BookOpen, Rocket, Users, BarChart2, Globe2, Palette } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const GUIDE_SECTIONS = [
  {
    icon: Rocket,
    color: 'bg-blue-500/10 text-blue-500',
    title: 'Getting Started',
    titleFr: 'Démarrage',
    guides: [
      { title: 'Create your first blog in 5 minutes', titleFr: 'Créer votre premier blog en 5 minutes', time: '5 min' },
      { title: 'Setting up your custom domain', titleFr: 'Configurer votre domaine personnalisé', time: '8 min' },
      { title: 'Invite your first team member', titleFr: "Inviter votre premier membre d'équipe", time: '3 min' },
      { title: 'Publish your first article', titleFr: 'Publier votre premier article', time: '10 min' },
    ],
  },
  {
    icon: BookOpen,
    color: 'bg-violet-500/10 text-violet-500',
    title: 'Writing & Publishing',
    titleFr: 'Rédaction et publication',
    guides: [
      { title: 'Using the rich text editor', titleFr: "Utiliser l'éditeur de texte riche", time: '12 min' },
      { title: 'AI writing assistant guide', titleFr: "Guide de l'assistant IA", time: '8 min' },
      { title: 'Optimizing articles for SEO', titleFr: 'Optimiser les articles pour le SEO', time: '15 min' },
      { title: 'Managing categories and tags', titleFr: 'Gérer les catégories et les tags', time: '6 min' },
    ],
  },
  {
    icon: Users,
    color: 'bg-cyan-500/10 text-cyan-500',
    title: 'Team Management',
    titleFr: "Gestion d'équipe",
    guides: [
      { title: 'Understanding user roles', titleFr: 'Comprendre les rôles utilisateurs', time: '7 min' },
      { title: 'Setting up editorial workflows', titleFr: 'Configurer des workflows éditoriaux', time: '10 min' },
      { title: 'Managing permissions', titleFr: 'Gérer les permissions', time: '5 min' },
    ],
  },
  {
    icon: BarChart2,
    color: 'bg-emerald-500/10 text-emerald-500',
    title: 'Analytics',
    titleFr: 'Analytics',
    guides: [
      { title: 'Reading your analytics dashboard', titleFr: "Lire votre tableau de bord d'analytics", time: '8 min' },
      { title: 'Understanding traffic sources', titleFr: 'Comprendre les sources de trafic', time: '6 min' },
      { title: 'Growing your newsletter', titleFr: 'Développer votre newsletter', time: '12 min' },
    ],
  },
  {
    icon: Palette,
    color: 'bg-orange-500/10 text-orange-500',
    title: 'Design & Branding',
    titleFr: 'Design et image de marque',
    guides: [
      { title: 'Customizing your blog theme', titleFr: 'Personnaliser le thème de votre blog', time: '10 min' },
      { title: 'Working with images and media', titleFr: 'Travailler avec les images et médias', time: '8 min' },
    ],
  },
  {
    icon: Globe2,
    color: 'bg-pink-500/10 text-pink-500',
    title: 'Multilingual Blogging',
    titleFr: 'Blogging multilingue',
    guides: [
      { title: 'Creating multilingual content', titleFr: 'Créer du contenu multilingue', time: '12 min' },
      { title: 'Translating your blog interface', titleFr: "Traduire l'interface de votre blog", time: '6 min' },
    ],
  },
];

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Guides pratiques' : 'Guides'}
        subtitle={isFr
          ? 'Tout ce dont vous avez besoin pour tirer le meilleur parti de NexusBlog.'
          : 'Everything you need to get the most out of NexusBlog.'}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          {GUIDE_SECTIONS.map(({ icon: Icon, color, title, titleFr, guides }) => (
            <div key={title}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-lg">{isFr ? titleFr : title}</h2>
              </div>
              <div className="space-y-1">
                {guides.map(({ title: gt, titleFr: gfr, time }) => (
                  <a
                    key={gt}
                    href="#"
                    className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                      {isFr ? gfr : gt}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {time}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
