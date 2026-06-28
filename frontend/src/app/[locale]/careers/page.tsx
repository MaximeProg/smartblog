import Image from 'next/image';
import { MapPin, Clock, ArrowRight, Heart, Globe2, Zap, Coffee } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';

const JOBS = [
  {
    title: 'Senior Full-Stack Engineer',
    titleFr: 'Ingénieur Full-Stack Senior',
    dept: 'Engineering',
    deptFr: 'Ingénierie',
    location: 'Remote (Europe/Americas)',
    type: 'Full-time',
    typeFr: 'Temps plein',
    desc: "Join our core platform team to build the next generation of NexusBlog's multi-tenant infrastructure.",
    descFr: "Rejoignez notre équipe plateforme pour construire la prochaine génération de l'infrastructure multi-tenant de NexusBlog.",
  },
  {
    title: 'Product Designer (UX/UI)',
    titleFr: 'Designer Produit (UX/UI)',
    dept: 'Design',
    deptFr: 'Design',
    location: 'Remote (Worldwide)',
    type: 'Full-time',
    typeFr: 'Temps plein',
    desc: "Help shape the user experience for thousands of content creators using NexusBlog's editor and dashboard.",
    descFr: "Contribuez à façonner l'expérience utilisateur pour des milliers de créateurs de contenu utilisant l'éditeur et le tableau de bord NexusBlog.",
  },
  {
    title: 'Growth Marketing Manager',
    titleFr: 'Responsable Marketing Growth',
    dept: 'Marketing',
    deptFr: 'Marketing',
    location: 'Paris, France (Hybrid)',
    type: 'Full-time',
    typeFr: 'Temps plein',
    desc: 'Drive user acquisition and retention through data-driven marketing campaigns and partnerships.',
    descFr: "Pilotez l'acquisition et la rétention d'utilisateurs via des campagnes marketing data-driven et des partenariats.",
  },
  {
    title: 'Customer Success Specialist',
    titleFr: 'Spécialiste Customer Success',
    dept: 'Support',
    deptFr: 'Support',
    location: 'Remote (Europe)',
    type: 'Full-time',
    typeFr: 'Temps plein',
    desc: 'Help our users succeed with NexusBlog by providing world-class onboarding and support.',
    descFr: "Aidez nos utilisateurs à réussir avec NexusBlog en fournissant un onboarding et un support de premier ordre.",
  },
];

const PERKS = [
  { icon: Globe2, title: '100% Remote', titleFr: '100% Télétravail', desc: 'Work from anywhere in the world.', descFr: 'Travaillez depuis n\'importe où dans le monde.' },
  { icon: Heart, title: 'Health Benefits', titleFr: 'Avantages santé', desc: 'Full medical, dental, and vision coverage.', descFr: 'Couverture médicale, dentaire et visuelle complète.' },
  { icon: Zap, title: 'Equity', titleFr: 'Actions', desc: 'Competitive equity package for all employees.', descFr: 'Package actions compétitif pour tous les employés.' },
  { icon: Coffee, title: 'Learning Budget', titleFr: 'Budget formation', desc: '$2,000/year for conferences and courses.', descFr: '2 000 $/an pour les conférences et formations.' },
];

export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80"
          alt="Team at work"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
            {isFr ? "Construisons l'avenir du blogging ensemble" : "Let's build the future of blogging together"}
          </h1>
          <p className="text-lg text-slate-300 mb-8">
            {isFr
              ? "Rejoignez une équipe passionnée qui aide des milliers de créateurs à partager leurs idées avec le monde."
              : "Join a passionate team helping thousands of creators share their ideas with the world."}
          </p>
          <a href="#jobs" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all">
            {isFr ? 'Voir les postes ouverts' : 'View open positions'}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERKS.map(({ icon: Icon, title, titleFr, desc, descFr }) => (
            <div key={title} className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">{isFr ? titleFr : title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{isFr ? descFr : desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Jobs */}
      <section id="jobs" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-8">{isFr ? 'Postes ouverts' : 'Open Positions'}</h2>
          <div className="space-y-4">
            {JOBS.map((job) => (
              <div key={job.title} className="group bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 p-6 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        {isFr ? job.deptFr : job.dept}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {isFr ? job.typeFr : job.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">
                      {isFr ? job.titleFr : job.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{isFr ? job.descFr : job.desc}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-lg mb-2">
              {isFr ? "Vous ne voyez pas le poste qu'il vous faut ?" : "Don't see the right role?"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {isFr
                ? "Envoyez-nous votre candidature spontanée, nous adorons rencontrer des talents passionnés."
                : "Send us an open application — we love meeting passionate people."}
            </p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all"
            >
              {isFr ? 'Candidature spontanée' : 'Send Open Application'}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  );
}
