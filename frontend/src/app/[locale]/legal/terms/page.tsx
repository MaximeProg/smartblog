import { FileText, User, Edit3, CreditCard, Server, XCircle, AlertTriangle, Mail } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const buildSections = (isFr: boolean) => [
  {
    icon: FileText,
    num: '01',
    title: isFr ? "Acceptation des conditions" : 'Acceptance of Terms',
    color: 'bg-blue-500/10 text-blue-500',
    body: isFr
      ? "En accédant à NexusBlog ou en l'utilisant, vous acceptez d'être lié par ces Conditions d'utilisation. Si vous n'acceptez pas, vous ne pouvez pas utiliser notre service."
      : 'By accessing or using NexusBlog, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.',
    items: [],
  },
  {
    icon: Server,
    num: '02',
    title: isFr ? 'Description du service' : 'Description of Service',
    color: 'bg-violet-500/10 text-violet-500',
    body: isFr
      ? "NexusBlog est une plateforme SaaS multi-tenant qui permet aux créateurs et aux entreprises de créer, gérer et publier des blogs professionnels avec des outils d'édition, d'analyse et de monétisation."
      : 'NexusBlog is a multi-tenant SaaS platform that enables content creators and businesses to create, manage, and publish professional blogs with editing, analytics, and monetization tools.',
    items: [],
  },
  {
    icon: User,
    num: '03',
    title: isFr ? 'Comptes utilisateurs' : 'User Accounts',
    color: 'bg-emerald-500/10 text-emerald-500',
    body: isFr
      ? "Pour utiliser certaines fonctionnalités, vous devez créer un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte."
      : 'To use certain features, you must create an account. You are responsible for the confidentiality of your credentials and all activities under your account.',
    items: [
      isFr ? "Vous devez avoir au moins 16 ans pour créer un compte" : 'You must be at least 16 years old to create an account',
      isFr ? "Vous devez fournir des informations exactes et complètes" : 'You must provide accurate and complete information',
      isFr ? "Vous êtes responsable de la sécurité de votre mot de passe" : 'You are responsible for the security of your password',
      isFr ? "Vous devez nous informer immédiatement de tout accès non autorisé" : 'You must notify us immediately of any unauthorized access',
    ],
  },
  {
    icon: Edit3,
    num: '04',
    title: isFr ? 'Contenu utilisateur' : 'User Content',
    color: 'bg-amber-500/10 text-amber-500',
    body: isFr
      ? "Vous conservez la propriété de tout contenu que vous publiez. En publiant du contenu, vous nous accordez une licence non exclusive pour l'utiliser dans le cadre de nos services."
      : 'You retain ownership of all content you publish. By publishing content, you grant us a non-exclusive license to use it in connection with our services.',
    items: [
      isFr ? "Contenu illégal, diffamatoire, haineux ou obscène — interdit" : 'Illegal, defamatory, hateful, or obscene content — prohibited',
      isFr ? "Violation des droits de propriété intellectuelle — interdit" : 'Infringing third-party intellectual property rights — prohibited',
      isFr ? "Logiciels malveillants, spam ou phishing — interdit" : 'Malware, spam, or phishing — prohibited',
      isFr ? "Usurpation d'identité — interdit" : 'Impersonating another person or entity — prohibited',
    ],
  },
  {
    icon: CreditCard,
    num: '05',
    title: isFr ? 'Plans et facturation' : 'Plans and Billing',
    color: 'bg-cyan-500/10 text-cyan-500',
    body: isFr
      ? "NexusBlog propose des plans gratuits et payants. Les abonnements payants sont facturés mensuellement ou annuellement. Vous pouvez annuler à tout moment ; l'annulation prend effet à la fin de la période en cours."
      : 'NexusBlog offers free and paid plans billed monthly or annually. You may cancel at any time; cancellation takes effect at the end of the current billing period.',
    items: [],
  },
  {
    icon: XCircle,
    num: '06',
    title: isFr ? 'Résiliation' : 'Termination',
    color: 'bg-red-500/10 text-red-500',
    body: isFr
      ? "Nous nous réservons le droit de suspendre ou de résilier votre accès à NexusBlog en cas de violation de ces conditions. Vous pouvez également résilier votre compte à tout moment depuis les paramètres."
      : 'We reserve the right to suspend or terminate your access for violations of these terms. You may also terminate your account at any time from your account settings.',
    items: [],
  },
  {
    icon: AlertTriangle,
    num: '07',
    title: isFr ? 'Limitation de responsabilité' : 'Limitation of Liability',
    color: 'bg-orange-500/10 text-orange-500',
    body: isFr
      ? "Dans les limites autorisées par la loi applicable, NexusBlog ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre service."
      : 'To the maximum extent permitted by applicable law, NexusBlog shall not be liable for indirect, incidental, special, or consequential damages arising from use or inability to use our service.',
    items: [],
  },
  {
    icon: Mail,
    num: '08',
    title: isFr ? 'Contact' : 'Contact',
    color: 'bg-pink-500/10 text-pink-500',
    body: isFr
      ? "Pour toute question concernant ces Conditions d'utilisation, contactez-nous à legal@nexusblog.com."
      : 'For questions about these Terms of Service, contact us at legal@nexusblog.com.',
    items: ['legal@nexusblog.com'],
  },
];

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? "Conditions d'utilisation" : 'Terms of Service'}
        subtitle={isFr
          ? "Les règles qui régissent l'utilisation de NexusBlog."
          : 'The rules governing your use of NexusBlog.'}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10 md:space-y-14">
        {buildSections(isFr).map(({ icon: Icon, num, title, color, body, items }) => (
          <div key={num} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 md:gap-10">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-3">
              <span className="text-3xl md:text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">{num}</span>
              <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">{title}</h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{body}</p>
              {items.length > 0 && (
                <ul className="space-y-2.5 mt-4">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
