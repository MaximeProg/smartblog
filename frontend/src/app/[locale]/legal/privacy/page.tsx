import { Shield, Eye, Lock, Users, Globe2, Mail } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const SECTIONS_EN = [
  {
    icon: Eye,
    num: '01',
    title: 'Information We Collect',
    color: 'bg-blue-500/10 text-blue-500',
    body: 'We collect information you provide directly to us when creating an account, publishing content, or contacting support: name, email address, billing information, and the content you create.',
    items: [
      'Name and email address when you create an account',
      'Article content and media you publish on your blogs',
      'Billing information for paid subscriptions',
      'Communications with our customer support team',
      'Technical data: IP address, browser type, pages visited',
    ],
  },
  {
    icon: Shield,
    num: '02',
    title: 'How We Use Your Information',
    color: 'bg-violet-500/10 text-violet-500',
    body: 'We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and analyze usage to enhance your experience.',
    items: [
      'Provide, maintain, and improve our services',
      'Process transactions and send related confirmations',
      'Send technical notifications and security alerts',
      'Respond to your comments, questions, and support requests',
      'Monitor and analyze trends to improve user experience',
      'Detect and prevent fraudulent or abusive activity',
    ],
  },
  {
    icon: Users,
    num: '03',
    title: 'Information Sharing',
    color: 'bg-emerald-500/10 text-emerald-500',
    body: 'We do not sell or rent your personal information to third parties. We may share your information only in the following limited circumstances:',
    items: [
      'With service providers who help us operate our platform (hosting, payments, analytics)',
      'When required by law or in response to valid legal process',
      'To protect the rights, property, or safety of NexusBlog and our users',
      'In connection with a merger, acquisition, or sale of assets (you will be notified)',
    ],
  },
  {
    icon: Lock,
    num: '04',
    title: 'Data Security',
    color: 'bg-amber-500/10 text-amber-500',
    body: 'We implement appropriate technical and organizational security measures to protect your information. This includes encryption of data in transit (TLS 1.3) and at rest (AES-256), access controls, and regular security audits.',
    items: [
      'All data encrypted in transit using TLS 1.3',
      'Data at rest encrypted using AES-256',
      'Role-based access controls for our team',
      'Regular third-party security audits and penetration testing',
      'Automated threat detection and monitoring',
    ],
  },
  {
    icon: Globe2,
    num: '05',
    title: 'Your Rights (GDPR)',
    color: 'bg-cyan-500/10 text-cyan-500',
    body: 'If you are based in the EEA, you have the following rights regarding your personal data. To exercise any of these rights, contact us at privacy@nexusblog.com.',
    items: [
      'Right to access your personal data',
      'Right to rectification of inaccurate data',
      'Right to erasure (right to be forgotten)',
      'Right to restriction of processing',
      'Right to data portability',
      'Right to object to processing',
    ],
  },
  {
    icon: Mail,
    num: '06',
    title: 'Contact & Updates',
    color: 'bg-pink-500/10 text-pink-500',
    body: 'For questions about this Privacy Policy, contact our Data Protection Officer at privacy@nexusblog.com. We will update this policy as needed and notify you of significant changes via email or an in-app notice.',
    items: [
      'DPO email: privacy@nexusblog.com',
      'Last updated: January 1, 2025',
      'Effective date: January 1, 2025',
    ],
  },
];

const SECTIONS_FR = [
  {
    icon: Eye,
    num: '01',
    title: 'Informations que nous collectons',
    color: 'bg-blue-500/10 text-blue-500',
    body: "Nous collectons les informations que vous nous fournissez directement lors de la création d'un compte, de la publication de contenu ou du contact avec notre support : nom, adresse e-mail, informations de facturation et contenu que vous créez.",
    items: [
      "Nom et adresse e-mail lors de la création de compte",
      "Contenu des articles et médias que vous publiez",
      "Informations de facturation pour les abonnements payants",
      "Communications avec notre équipe de support client",
      "Données techniques : adresse IP, type de navigateur, pages visitées",
    ],
  },
  {
    icon: Shield,
    num: '02',
    title: 'Comment nous utilisons vos informations',
    color: 'bg-violet-500/10 text-violet-500',
    body: "Nous utilisons les informations collectées pour fournir, maintenir et améliorer nos services, traiter les transactions, envoyer des notifications et analyser l'utilisation.",
    items: [
      "Fournir, maintenir et améliorer nos services",
      "Traiter les transactions et envoyer les confirmations associées",
      "Envoyer des notifications techniques et des alertes de sécurité",
      "Répondre à vos commentaires, questions et demandes de support",
      "Analyser les tendances pour améliorer l'expérience utilisateur",
      "Détecter et prévenir les activités frauduleuses",
    ],
  },
  {
    icon: Users,
    num: '03',
    title: 'Partage des informations',
    color: 'bg-emerald-500/10 text-emerald-500',
    body: "Nous ne vendons ni ne louons vos informations personnelles à des tiers. Nous pouvons partager vos informations uniquement dans les cas suivants :",
    items: [
      "Avec des prestataires de services qui nous aident à exploiter notre plateforme",
      "Lorsque la loi l'exige ou en réponse à une procédure judiciaire valide",
      "Pour protéger les droits, la propriété ou la sécurité de NexusBlog",
      "Dans le cadre d'une fusion, acquisition ou vente d'actifs (vous serez notifié)",
    ],
  },
  {
    icon: Lock,
    num: '04',
    title: 'Sécurité des données',
    color: 'bg-amber-500/10 text-amber-500',
    body: "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos informations. Cela inclut le chiffrement en transit (TLS 1.3) et au repos (AES-256).",
    items: [
      "Toutes les données chiffrées en transit via TLS 1.3",
      "Données au repos chiffrées via AES-256",
      "Contrôles d'accès basés sur les rôles pour notre équipe",
      "Audits de sécurité et tests de pénétration réguliers",
      "Détection automatisée des menaces et surveillance continue",
    ],
  },
  {
    icon: Globe2,
    num: '05',
    title: 'Vos droits (RGPD)',
    color: 'bg-cyan-500/10 text-cyan-500',
    body: "Si vous êtes basé dans l'EEE, vous disposez des droits suivants concernant vos données personnelles. Pour exercer ces droits, contactez-nous à privacy@nexusblog.com.",
    items: [
      "Droit d'accès à vos données personnelles",
      "Droit de rectification des données inexactes",
      "Droit à l'effacement (droit à l'oubli)",
      "Droit à la limitation du traitement",
      "Droit à la portabilité des données",
      "Droit d'opposition au traitement",
    ],
  },
  {
    icon: Mail,
    num: '06',
    title: 'Contact et mises à jour',
    color: 'bg-pink-500/10 text-pink-500',
    body: "Pour toute question concernant cette Politique de confidentialité, contactez notre DPO à privacy@nexusblog.com. Nous mettrons à jour cette politique si nécessaire et vous informerons des changements importants.",
    items: [
      "DPO : privacy@nexusblog.com",
      "Dernière mise à jour : 1er janvier 2025",
      "Date d'entrée en vigueur : 1er janvier 2025",
    ],
  },
];

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const SECTIONS = isFr ? SECTIONS_FR : SECTIONS_EN;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Politique de confidentialité' : 'Privacy Policy'}
        subtitle={isFr
          ? "Comment nous collectons, utilisons et protégeons vos données personnelles."
          : 'How we collect, use, and protect your personal information.'}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-10 md:space-y-14">
        {SECTIONS.map(({ icon: Icon, num, title, color, body, items }) => (
          <div key={num} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 md:gap-10">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-3">
              <span className="text-3xl md:text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">{num}</span>
              <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">{title}</h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">{body}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
