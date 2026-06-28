import Image from 'next/image';
import { Download, ExternalLink, Newspaper, Camera, Package, Users } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const COVERAGE = [
  {
    outlet: 'TechCrunch',
    logo: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=200&q=80',
    title: 'NexusBlog raises $5M to bring enterprise blogging to the masses',
    titleFr: "NexusBlog lève 5M$ pour démocratiser le blogging d'entreprise",
    date: 'March 2025',
    href: '#',
  },
  {
    outlet: 'Product Hunt',
    logo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80',
    title: '#1 Product of the Day — NexusBlog 2.0',
    titleFr: '#1 Produit du Jour — NexusBlog 2.0',
    date: 'May 2025',
    href: '#',
  },
  {
    outlet: 'The Verge',
    logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80',
    title: 'The best new blogging platform for serious creators',
    titleFr: 'La meilleure nouvelle plateforme de blogging pour les créateurs sérieux',
    date: 'April 2025',
    href: '#',
  },
];

const BRAND_ASSETS = [
  { icon: Package, label: 'NexusBlog Logo (SVG, PNG)', labelFr: 'Logo NexusBlog (SVG, PNG)', size: '2.4 MB' },
  { icon: Newspaper, label: 'Full Press Kit', labelFr: 'Kit presse complet', size: '12 MB' },
  { icon: Camera, label: 'Product Screenshots', labelFr: "Captures d'écran produit", size: '8.1 MB' },
  { icon: Users, label: 'Team Photos', labelFr: "Photos de l'équipe", size: '5.3 MB' },
];

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Espace presse' : 'Press'}
        subtitle={isFr
          ? 'Ressources et informations pour les journalistes et médias.'
          : 'Resources and information for journalists and media.'}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
        {/* Press contact */}
        <div className="rounded-2xl bg-blue-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-white mb-1">
              {isFr ? 'Contact presse' : 'Press Contact'}
            </h2>
            <p className="text-blue-100 text-sm">
              {isFr
                ? "Pour les demandes de presse, interviews ou informations supplémentaires :"
                : 'For press inquiries, interviews, or additional information:'}
            </p>
          </div>
          <a
            href="mailto:press@nexusblog.com"
            className="shrink-0 px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors"
          >
            press@nexusblog.com
          </a>
        </div>

        {/* Key facts */}
        <div>
          <h2 className="text-xl font-bold mb-6">{isFr ? 'Chiffres clés' : 'Key Facts'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '2024', label: isFr ? 'Fondée' : 'Founded' },
              { value: '10K+', label: isFr ? 'Blogs actifs' : 'Active blogs' },
              { value: '25', label: isFr ? 'Employés' : 'Employees' },
              { value: '$5M', label: isFr ? 'Levé' : 'Raised' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
                <p className="text-2xl font-black text-blue-500 mb-1">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Press coverage */}
        <div>
          <h2 className="text-xl font-bold mb-6">{isFr ? 'Revue de presse' : 'Press Coverage'}</h2>
          <div className="space-y-3">
            {COVERAGE.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="group flex items-center gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                  <Image src={item.logo} alt={item.outlet} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-500 font-semibold mb-0.5">{item.outlet} · {item.date}</p>
                  <p className="text-sm font-semibold group-hover:text-blue-500 transition-colors truncate">
                    {isFr ? item.titleFr : item.title}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Brand assets */}
        <div>
          <h2 className="text-xl font-bold mb-6">{isFr ? 'Ressources de marque' : 'Brand Assets'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BRAND_ASSETS.map(({ icon: Icon, label, labelFr, size }) => (
              <button
                key={label}
                className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{isFr ? labelFr : label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                  <span>{size}</span>
                  <Download className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
