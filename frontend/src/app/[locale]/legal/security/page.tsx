import { Shield, Lock, Eye, Server, CheckCircle2, AlertTriangle, Key, Zap } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const buildSections = (isFr: boolean) => [
  {
    icon: Lock,
    num: '01',
    title: isFr ? 'Chiffrement des données' : 'Data Encryption',
    color: 'bg-blue-500/10 text-blue-500',
    body: isFr
      ? "Toutes les données échangées avec NexusBlog sont chiffrées en transit via TLS 1.3. Les données stockées sont chiffrées au repos via AES-256. Les mots de passe ne sont jamais stockés en clair."
      : 'All data exchanged with NexusBlog is encrypted in transit via TLS 1.3. Stored data is encrypted at rest using AES-256. Passwords are never stored in plaintext.',
    items: [
      isFr ? 'TLS 1.3 pour toutes les communications client-serveur' : 'TLS 1.3 for all client-server communications',
      isFr ? 'AES-256 pour les données au repos' : 'AES-256 for data at rest',
      isFr ? 'Hachage des mots de passe avec bcrypt' : 'Password hashing with bcrypt',
      isFr ? 'Clés de chiffrement en rotation automatique' : 'Automatic encryption key rotation',
    ],
  },
  {
    icon: Shield,
    num: '02',
    title: isFr ? "Contrôle d'accès" : 'Access Control',
    color: 'bg-emerald-500/10 text-emerald-500',
    body: isFr
      ? "Notre architecture de contrôle d'accès basée sur les rôles (RBAC) garantit que chaque utilisateur ne peut accéder qu'à ce dont il a besoin. Cinq niveaux de rôles sont disponibles : Owner, Admin, Editor, Author, Viewer."
      : 'Our role-based access control (RBAC) architecture ensures each user can only access what they need. Five role levels are available: Owner, Admin, Editor, Author, Viewer.',
    items: [
      isFr ? 'RBAC avec 5 niveaux de rôles' : 'RBAC with 5 role levels',
      isFr ? 'Isolation complète des données entre tenants' : 'Complete data isolation between tenants',
      isFr ? 'Authentification multi-facteur disponible' : 'Multi-factor authentication available',
      isFr ? 'Gestion des sessions avec invalidation forcée' : 'Session management with forced invalidation',
    ],
  },
  {
    icon: Eye,
    num: '03',
    title: isFr ? "Journaux d'audit" : 'Audit Logs',
    color: 'bg-violet-500/10 text-violet-500',
    body: isFr
      ? "NexusBlog maintient des journaux d'audit complets pour tous les événements liés à la sécurité et les accès aux données. Ces journaux sont conservés 90 jours pour les plans Pro et 1 an pour Business."
      : 'NexusBlog maintains comprehensive audit logs for all security-relevant events and data access. Logs are retained for 90 days on Pro plans and 1 year on Business.',
    items: [
      isFr ? 'Enregistrement de toutes les connexions et déconnexions' : 'All login and logout events recorded',
      isFr ? 'Suivi des modifications de contenu' : 'Content modification tracking',
      isFr ? 'Alertes sur les activités suspectes' : 'Suspicious activity alerts',
      isFr ? 'Export des journaux disponible' : 'Log export available',
    ],
  },
  {
    icon: Server,
    num: '04',
    title: isFr ? "Sécurité de l'infrastructure" : 'Infrastructure Security',
    color: 'bg-amber-500/10 text-amber-500',
    body: isFr
      ? "NexusBlog est hébergé sur une infrastructure cloud certifiée SOC 2 Type II avec sauvegardes automatiques, redondance géographique et disponibilité de 99,9%."
      : 'NexusBlog is hosted on SOC 2 Type II certified cloud infrastructure with automated backups, geographic redundancy, and 99.9% uptime.',
    items: [
      isFr ? 'Infrastructure cloud certifiée SOC 2 Type II' : 'SOC 2 Type II certified cloud infrastructure',
      isFr ? 'Sauvegardes automatiques chiffrées toutes les heures' : 'Automated encrypted backups every hour',
      isFr ? 'Redondance géographique multi-région' : 'Multi-region geographic redundancy',
      isFr ? 'Protection DDoS intégrée' : 'Built-in DDoS protection',
    ],
  },
  {
    icon: Key,
    num: '05',
    title: isFr ? 'Tests et audits' : 'Testing & Audits',
    color: 'bg-cyan-500/10 text-cyan-500',
    body: isFr
      ? "Nous effectuons des tests de sécurité continus pour identifier et corriger les vulnérabilités avant qu'elles ne puissent être exploitées."
      : 'We conduct continuous security testing to identify and fix vulnerabilities before they can be exploited.',
    items: [
      isFr ? 'Tests de pénétration trimestriels par des tiers' : 'Quarterly third-party penetration testing',
      isFr ? 'Analyse statique du code (SAST) dans notre CI/CD' : 'Static code analysis (SAST) in our CI/CD',
      isFr ? 'Analyse des dépendances (SCA) automatisée' : 'Automated dependency scanning (SCA)',
      isFr ? "Programme de divulgation responsable des vulnérabilités" : 'Responsible vulnerability disclosure program',
    ],
  },
  {
    icon: Zap,
    num: '06',
    title: isFr ? 'Limitation de débit' : 'Rate Limiting & Protection',
    color: 'bg-orange-500/10 text-orange-500',
    body: isFr
      ? "Toutes nos API sont protégées par une limitation de débit pour prévenir les abus, les attaques par force brute et les attaques DDoS."
      : 'All our APIs are protected by rate limiting to prevent abuse, brute-force attacks, and DDoS attacks.',
    items: [
      isFr ? 'Limitation de débit sur toutes les API et endpoints' : 'Rate limiting on all APIs and endpoints',
      isFr ? 'Protection contre les attaques par force brute sur la connexion' : 'Brute-force protection on login',
      isFr ? 'Blocage automatique des IPs suspectes' : 'Automatic suspicious IP blocking',
      isFr ? 'Surveillance 24/7 des anomalies' : '24/7 anomaly monitoring',
    ],
  },
];

export default async function SecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Sécurité de niveau entreprise' : 'Enterprise-Grade Security'}
        subtitle={isFr
          ? "Votre contenu et vos données sont protégés par les meilleures pratiques de sécurité du secteur."
          : 'Your content and data are protected by industry-leading security practices.'}
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
              <ul className="space-y-2.5 mt-5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Report vulnerability */}
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/5 p-8">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">
                {isFr ? 'Signaler une vulnérabilité' : 'Report a Vulnerability'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                {isFr
                  ? "Si vous découvrez une vulnérabilité de sécurité, veuillez nous la signaler de manière responsable. Nous nous engageons à répondre dans les 24 heures et à reconnaître votre contribution."
                  : "If you discover a security vulnerability, please report it to us responsibly. We commit to responding within 24 hours and acknowledging your contribution."}
              </p>
              <a
                href="mailto:security@nexusblog.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                security@nexusblog.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
