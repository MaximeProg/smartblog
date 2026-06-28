import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight, Check, BarChart2, Users, FileText, Rss,
  Bot, Globe2, Zap, Shield, Star,
} from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { getPricingPlans } from '@/lib/platform-api';
import type { PricingPlan } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  const isFr = locale === 'fr';
  const pricingPlans = await getPricingPlans();

  const features = [
    { icon: Bot, title: t('features.aiTitle'), desc: t('features.aiDesc'), color: 'bg-violet-500/10 text-violet-400' },
    { icon: Globe2, title: t('features.multiTenantTitle'), desc: t('features.multiTenantDesc'), color: 'bg-blue-500/10 text-blue-400' },
    { icon: Users, title: t('features.teamTitle'), desc: t('features.teamDesc'), color: 'bg-cyan-500/10 text-cyan-400' },
    { icon: BarChart2, title: t('features.analyticsTitle'), desc: t('features.analyticsDesc'), color: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Rss, title: t('features.newsletterTitle'), desc: t('features.newsletterDesc'), color: 'bg-pink-500/10 text-pink-400' },
    { icon: FileText, title: t('features.seoTitle'), desc: t('features.seoDesc'), color: 'bg-orange-500/10 text-orange-400' },
  ];

  const plans = pricingPlans.map((p: PricingPlan) => ({
    name: isFr ? p.name_fr : p.name,
    price: p.price_monthly === null ? (isFr ? 'Gratuit' : 'Free') : `$${p.price_monthly}`,
    period: p.price_monthly !== null ? (isFr ? '/mois' : '/mo') : undefined,
    desc: isFr ? (p.description_fr ?? '') : (p.description ?? ''),
    features: isFr ? p.features_fr : p.features,
    cta: p.price_monthly === null ? t('pricing.ctaFree') : t('pricing.cta'),
    highlight: p.is_highlighted,
    badge: isFr ? p.badge_fr : p.badge,
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} transparent />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1920&q=85"
          alt="Writing and blogging"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/40" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-5 md:mb-6 drop-shadow-2xl text-white">
            {t('hero.title')}
          </h1>

          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <Link
              href={`/${locale}/login`}
              className="group flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              {t('hero.cta')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-sm sm:text-base transition-all hover:bg-white/5 backdrop-blur-sm w-full sm:w-auto justify-center"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/60" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-14 bg-slate-100 dark:bg-slate-900/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            {[
              { value: '10,000+', label: isFr ? 'Blogs actifs' : 'Active blogs' },
              { value: '2M+', label: isFr ? 'Articles publiés' : 'Articles published' },
              { value: '50M+', label: isFr ? 'Lecteurs/mois' : 'Monthly readers' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mb-1">{value}</p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">{t('features.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group relative bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} mb-5`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-base">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EDITOR VISUAL ─────────────────────────────────────────────────── */}
      <section className="py-20 overflow-hidden bg-slate-50 dark:bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {isFr
                ? "Écrivez avec l'assistance de l'IA intégrée"
                : 'Write with built-in AI assistance'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8">
              {isFr
                ? "Un éditeur riche WYSIWYG avec support des images, vidéos, blocs de code, tableaux et l'assistance IA pour écrire plus vite et mieux."
                : 'A powerful WYSIWYG editor with support for images, videos, code blocks, tables, and AI writing assistance to help you write faster and better.'}
            </p>
            <ul className="space-y-3">
              {[
                isFr ? 'Génération de contenu par IA' : 'AI content generation',
                isFr ? 'Optimisation SEO automatique' : 'Automatic SEO optimization',
                isFr ? 'Blocs de code avec coloration syntaxique' : 'Code blocks with syntax highlighting',
                isFr ? 'Intégration de médias' : 'Rich media embeds',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/20 dark:shadow-black/40">
            <Image
              src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80"
              alt="Code editor"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ─── ANALYTICS VISUAL ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/40 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl shadow-black/20 dark:shadow-black/40">
            <Image
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
              alt="Analytics dashboard"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 to-transparent" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {isFr
                ? 'Des analyses avancées en temps réel'
                : 'Advanced real-time analytics'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8">
              {isFr
                ? "Suivez chaque métrique importante avec des analyses en temps réel, des insights visiteurs et des rapports d'engagement complets."
                : 'Track every metric that matters with real-time analytics, visitor insights, and comprehensive engagement reports.'}
            </p>
            <ul className="space-y-3">
              {[
                isFr ? 'Vues de pages en temps réel' : 'Real-time page views',
                isFr ? 'Sources de trafic détaillées' : 'Detailed traffic sources',
                isFr ? 'Articles les plus performants' : 'Top performing articles',
                isFr ? 'Taux de conversion newsletter' : 'Newsletter conversion rates',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="h-4 w-4 text-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">{t('pricing.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">{t('pricing.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 md:p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-blue-600 ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 md:scale-[1.03]'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } transition-all`}
              >
                {'badge' in plan && plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-900 text-xs font-black shadow-sm">
                      <Star className="h-3 w-3 fill-current" />
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-8">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.highlight ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{plan.price}</span>
                    {'period' in plan && plan.period && (
                      <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-400'}`}>{plan.period}</span>
                    )}
                  </div>
                  <p className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-100' : 'text-emerald-500'}`} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-slate-700 dark:text-slate-300'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/${locale}/login`}
                  className={`block text-center py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 dark:border-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 mt-10">
            {isFr
              ? "Tous les plans incluent 14 jours d'essai gratuit."
              : 'All plans include a 14-day free trial. No credit card required to start.'}
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80"
          alt="Team collaborating"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{t('cta.title')}</h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">{t('cta.subtitle')}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all shadow-xl shadow-blue-600/30 hover:scale-[1.02]"
          >
            {t('cta.button')}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { icon: Zap, text: isFr ? 'Démarrage en 2 min' : '2-min setup' },
              { icon: Shield, text: isFr ? 'Sécurité enterprise' : 'Enterprise security' },
              { icon: Star, text: '4.9/5 rating' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-slate-400 text-sm">
                <Icon className="h-4 w-4 text-slate-500" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </div>
  );
}
