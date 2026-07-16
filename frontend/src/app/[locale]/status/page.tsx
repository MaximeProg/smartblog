import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage, getPlatformStats } from '@/lib/platform-api';

const statusCfg = {
  operational: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Operational' },
  degraded:    { icon: AlertTriangle, color: 'text-amber-500',  label: 'Degraded' },
  outage:      { icon: XCircle,       color: 'text-red-500',    label: 'Outage' },
  maintenance: { icon: Clock,         color: 'text-blue-500',   label: 'Maintenance' },
};

const FALLBACK = {
  hero: { title: 'System Status', subtitle: 'Real-time availability and performance of SmarterBloggers.' },
  services: [
    { name: 'API', status: 'operational' },
    { name: 'Web App', status: 'operational' },
    { name: 'CDN', status: 'operational' },
    { name: 'Database', status: 'operational' },
    { name: 'Media Storage', status: 'operational' },
    { name: 'Search (Elasticsearch)', status: 'operational' },
    { name: 'Email Delivery', status: 'operational' },
    { name: 'Authentication', status: 'operational' },
  ],
  incidents: [] as { date: string; title: string; description: string; resolved: boolean }[],
};

export default async function StatusPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const [cms, stats] = await Promise.all([
    getPlatformPage('status', lang) as Promise<typeof FALLBACK | null>,
    getPlatformStats(),
  ]);
  const c = cms ?? FALLBACK;
  const services = c.services as typeof FALLBACK.services;
  const incidents = c.incidents as typeof FALLBACK.incidents;
  const allOK = services.every((s) => s.status === 'operational');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className={`rounded-2xl p-6 flex items-center gap-5 ${allOK ? 'bg-emerald-50 dark:bg-emerald-500/5' : 'bg-amber-50 dark:bg-amber-500/5'}`}>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${allOK ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {allOK
              ? <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              : <AlertTriangle className="h-7 w-7 text-amber-500" />}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {allOK ? 'All Systems Operational' : 'Ongoing Disruption'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Status is updated manually by our team when incidents occur.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-5">Services</h2>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {services.map((service) => {
              const cfg = statusCfg[service.status as keyof typeof statusCfg] ?? statusCfg.operational;
              const Icon = cfg.icon;
              return (
                <div key={service.name} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uptime réel — calculé depuis health_check_log, pas de chiffre inventé */}
        <div>
          <h2 className="text-xl font-bold mb-5">Uptime — Last 30 days</h2>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 text-center max-w-xs">
            <p className="text-3xl font-black text-emerald-500 mb-1">
              {stats?.uptime_pct != null ? `${stats.uptime_pct}%` : 'Collecting data'}
            </p>
            <p className="text-sm text-slate-500">Platform-wide availability</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-5">Incident History</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No incidents reported.</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((inc) => (
                <div key={inc.title} className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold">{inc.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">{inc.date}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{inc.description}</p>
                  {inc.resolved && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-500 font-medium">Resolved</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
