import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';

const SERVICES = [
  { name: 'API', status: 'operational', latency: '42ms' },
  { name: 'Web App', status: 'operational', latency: '120ms' },
  { name: 'CDN', status: 'operational', latency: '8ms' },
  { name: 'Database', status: 'operational', latency: '3ms' },
  { name: 'Media Storage', status: 'operational', latency: '56ms' },
  { name: 'Search (Elasticsearch)', status: 'operational', latency: '18ms' },
  { name: 'Email Delivery', status: 'operational', latency: '—' },
  { name: 'Authentication', status: 'operational', latency: '31ms' },
];

const INCIDENTS = [
  {
    date: 'June 10, 2025',
    title: 'Increased API latency',
    titleFr: 'Latence API accrue',
    desc: 'Some users experienced increased API response times for 18 minutes. Root cause: database connection pool exhaustion. Resolved by scaling the connection pool.',
    descFr: "Certains utilisateurs ont expérimenté des temps de réponse API accrus pendant 18 minutes. Cause : épuisement du pool de connexions BD. Résolu par le scaling du pool.",
    resolved: true,
  },
  {
    date: 'May 22, 2025',
    title: 'Scheduled maintenance — Database upgrade',
    titleFr: 'Maintenance planifiée — Mise à jour BD',
    desc: 'Planned 30-minute maintenance window for database version upgrade. All services restored as scheduled.',
    descFr: 'Fenêtre de maintenance planifiée de 30 minutes pour la mise à jour de la base de données. Tous les services restaurés comme prévu.',
    resolved: true,
  },
];

const statusCfg = {
  operational: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Operational', labelFr: 'Opérationnel' },
  degraded:    { icon: AlertTriangle, color: 'text-amber-500',  label: 'Degraded',    labelFr: 'Dégradé' },
  outage:      { icon: XCircle,       color: 'text-red-500',    label: 'Outage',      labelFr: 'Panne' },
  maintenance: { icon: Clock,          color: 'text-blue-500',   label: 'Maintenance', labelFr: 'Maintenance' },
};

export default async function StatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const allOK = SERVICES.every((s) => s.status === 'operational');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=85"
        title={isFr ? 'Statut des systèmes' : 'System Status'}
        subtitle={isFr
          ? 'Disponibilité et performance de NexusBlog en temps réel.'
          : 'Real-time availability and performance of NexusBlog.'}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        {/* Overall badge */}
        <div className={`rounded-2xl p-6 flex items-center gap-5 ${allOK ? 'bg-emerald-50 dark:bg-emerald-500/5' : 'bg-amber-50 dark:bg-amber-500/5'}`}>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${allOK ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {allOK
              ? <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              : <AlertTriangle className="h-7 w-7 text-amber-500" />}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {allOK
                ? (isFr ? 'Tous les systèmes sont opérationnels' : 'All Systems Operational')
                : (isFr ? 'Perturbation en cours' : 'Ongoing Disruption')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isFr ? 'Dernière vérification il y a 30 secondes' : 'Last checked 30 seconds ago'}
            </p>
          </div>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-xl font-bold mb-5">{isFr ? 'Services' : 'Services'}</h2>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {SERVICES.map((service) => {
              const cfg = statusCfg[service.status as keyof typeof statusCfg];
              const Icon = cfg.icon;
              return (
                <div key={service.name} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-slate-400 font-mono">{service.latency}</span>
                    <span className={`text-xs font-semibold ${cfg.color}`}>
                      {isFr ? cfg.labelFr : cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uptime */}
        <div>
          <h2 className="text-xl font-bold mb-5">{isFr ? 'Disponibilité — 90 derniers jours' : 'Uptime — Last 90 days'}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'API', value: '99.98%' },
              { label: 'Web App', value: '99.95%' },
              { label: 'CDN', value: '100%' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center">
                <p className="text-3xl font-black text-emerald-500 mb-1">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-xl font-bold mb-5">{isFr ? 'Historique des incidents' : 'Incident History'}</h2>
          <div className="space-y-4">
            {INCIDENTS.map((inc) => (
              <div key={inc.title} className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold">{isFr ? inc.titleFr : inc.title}</h3>
                  <span className="text-xs text-slate-400 shrink-0">{inc.date}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{isFr ? inc.descFr : inc.desc}</p>
                {inc.resolved && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">{isFr ? 'Résolu' : 'Resolved'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
