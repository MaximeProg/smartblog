import { Cookie, Settings, BarChart2, Star, Globe2, Mail } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const COOKIE_TYPES_EN = [
  {
    icon: Settings,
    num: '01',
    name: 'Essential Cookies',
    color: 'bg-blue-500/10 text-blue-500',
    desc: 'These cookies are necessary for the site to function and cannot be disabled. They are set in response to your actions such as logging in, filling out forms, or setting your privacy preferences.',
    examples: ['nexusblog-auth — Session authentication token (7 days)', 'nexusblog-theme — Your dark/light theme preference (persistent)', 'CSRF token — Security protection for form submissions'],
  },
  {
    icon: BarChart2,
    num: '02',
    name: 'Analytics Cookies',
    color: 'bg-emerald-500/10 text-emerald-500',
    desc: 'These cookies allow us to count visits and traffic sources to measure and improve site performance. All information collected is aggregated and anonymous — we cannot identify you individually.',
    examples: ['_ga — Google Analytics visitor ID (2 years)', '_gid — Google Analytics session ID (24 hours)', '_gat — Request throttle (1 minute)'],
  },
  {
    icon: Star,
    num: '03',
    name: 'Preference Cookies',
    color: 'bg-violet-500/10 text-violet-500',
    desc: 'These cookies allow the site to remember your choices, such as your language preference, so we can provide a more personalized experience.',
    examples: ['locale — Your chosen language (persistent)', 'sidebar-collapsed — Dashboard sidebar state (session)'],
  },
  {
    icon: Globe2,
    num: '04',
    name: 'Third-Party Cookies',
    color: 'bg-orange-500/10 text-orange-500',
    desc: 'Some of our third-party services may set their own cookies. These include Firebase for authentication and Google Analytics for usage statistics. Please review their privacy policies for more information.',
    examples: ['Firebase (Google) — Authentication and security', 'Google Analytics — Usage statistics'],
  },
  {
    icon: Cookie,
    num: '05',
    name: 'Managing Cookies',
    color: 'bg-amber-500/10 text-amber-500',
    desc: 'You can control and/or delete cookies as you wish via your browser settings. You can delete all cookies currently on your computer and you can set most browsers to prevent them from being placed. Note that disabling certain cookies may affect site functionality.',
    examples: [],
  },
  {
    icon: Mail,
    num: '06',
    name: 'Questions?',
    color: 'bg-pink-500/10 text-pink-500',
    desc: 'For questions about our use of cookies, please contact us at privacy@nexusblog.com. Last updated: January 1, 2025.',
    examples: [],
  },
];

const COOKIE_TYPES_FR = [
  {
    icon: Settings,
    num: '01',
    name: 'Cookies essentiels',
    color: 'bg-blue-500/10 text-blue-500',
    desc: "Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. Ils sont généralement définis en réponse à vos actions : connexion, remplissage de formulaires ou définition de vos préférences de confidentialité.",
    examples: ['nexusblog-auth — Jeton d\'authentification de session (7 jours)', 'nexusblog-theme — Votre préférence de thème sombre/clair (permanent)', 'Jeton CSRF — Protection de sécurité pour les envois de formulaires'],
  },
  {
    icon: BarChart2,
    num: '02',
    name: "Cookies d'analyse",
    color: 'bg-emerald-500/10 text-emerald-500',
    desc: "Ces cookies nous permettent de compter les visites et les sources de trafic afin de mesurer et d'améliorer les performances du site. Toutes les informations collectées sont agrégées et anonymes.",
    examples: ['_ga — ID visiteur Google Analytics (2 ans)', '_gid — ID session Google Analytics (24 heures)', '_gat — Limitation de débit (1 minute)'],
  },
  {
    icon: Star,
    num: '03',
    name: 'Cookies de préférences',
    color: 'bg-violet-500/10 text-violet-500',
    desc: "Ces cookies permettent au site de mémoriser vos choix, comme votre préférence de langue, afin de vous offrir une expérience plus personnalisée.",
    examples: ['locale — Votre langue choisie (permanent)', 'sidebar-collapsed — État de la barre latérale (session)'],
  },
  {
    icon: Globe2,
    num: '04',
    name: 'Cookies tiers',
    color: 'bg-orange-500/10 text-orange-500',
    desc: "Certains de nos services tiers peuvent définir leurs propres cookies, notamment Firebase pour l'authentification et Google Analytics pour les statistiques d'utilisation.",
    examples: ['Firebase (Google) — Authentification et sécurité', 'Google Analytics — Statistiques d\'utilisation'],
  },
  {
    icon: Cookie,
    num: '05',
    name: 'Gérer les cookies',
    color: 'bg-amber-500/10 text-amber-500',
    desc: "Vous pouvez contrôler et/ou supprimer les cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter les fonctionnalités du site.",
    examples: [],
  },
  {
    icon: Mail,
    num: '06',
    name: 'Des questions ?',
    color: 'bg-pink-500/10 text-pink-500',
    desc: "Pour toute question concernant notre utilisation des cookies, contactez-nous à privacy@nexusblog.com. Dernière mise à jour : 1er janvier 2025.",
    examples: [],
  },
];

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const TYPES = isFr ? COOKIE_TYPES_FR : COOKIE_TYPES_EN;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Politique de cookies' : 'Cookie Policy'}
        subtitle={isFr
          ? "Comment et pourquoi nous utilisons des cookies sur NexusBlog."
          : 'How and why we use cookies on NexusBlog.'}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10 md:space-y-14">
        {TYPES.map(({ icon: Icon, num, name, color, desc, examples }) => (
          <div key={num} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 md:gap-10">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-3">
              <span className="text-3xl md:text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">{num}</span>
              <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">{name}</h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              {examples.length > 0 && (
                <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                  {examples.map((ex) => (
                    <p key={ex} className="text-xs font-mono text-slate-500 dark:text-slate-400">{ex}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
