import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Check, BarChart2, Users, FileText, Rss,
  Bot, Globe2, Zap, Shield, Star, Link2, UserPlus, Coins,
} from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { getPricingPlans, getPlatformStats, getPlatformPage, getUiTranslations, type PricingPlan } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

interface PlanStatic { name: string; desc: string; features: string[]; }

const EN_PLAN_STATIC: Record<string, PlanStatic> = {
  free: { name: 'Free', desc: 'Perfect to start blogging.', features: ['1 blog', '10 articles / month', '1 author', 'smarterbloggers.com subdomain'] },
  starter: { name: 'Starter', desc: 'For serious bloggers.', features: ['2 blogs', 'Unlimited articles', '3 authors', 'Custom domain', 'Newsletter — 1,000 subscribers'] },
  pro: { name: 'Pro', desc: 'For creative teams.', features: ['5 blogs', 'Unlimited articles', '10 authors', 'Custom domain', 'Newsletter — 10,000 subscribers', 'AI — 50 articles / month', 'Advanced analytics'] },
  business: { name: 'Business', desc: 'For large organizations.', features: ['Unlimited blogs', 'Unlimited articles', 'Unlimited authors', 'Unlimited domains', 'Unlimited newsletter', 'Unlimited AI', 'API access', 'White label'] },
  enterprise: { name: 'Enterprise', desc: 'For large enterprises.', features: ['Everything in Business', 'Dedicated SLA', 'Priority support', 'Custom onboarding'] },
};

interface HomeMisc { freeLabel: string; perMonthSuffix: string; popularBadge: string; collectingData: string; }

const EN_HOME_MISC: HomeMisc = { freeLabel: 'Free', perMonthSuffix: '/mo', popularBadge: 'Popular', collectingData: 'Collecting data' };
const FR_HOME_MISC: HomeMisc = { freeLabel: 'Gratuit', perMonthSuffix: '/mois', popularBadge: 'Populaire', collectingData: 'Collecte en cours' };

const FR_PLAN_STATIC: Record<string, PlanStatic> = {
  free: { name: 'Gratuit', desc: 'Parfait pour commencer à bloguer.', features: ['1 blog', '10 articles / mois', '1 auteur', 'Sous-domaine smarterbloggers.com'] },
  starter: { name: 'Starter', desc: 'Pour les blogueurs sérieux.', features: ['2 blogs', 'Articles illimités', '3 auteurs', 'Domaine personnalisé', 'Newsletter — 1 000 abonnés'] },
  pro: { name: 'Pro', desc: 'Pour les équipes créatives.', features: ['5 blogs', 'Articles illimités', '10 auteurs', 'Domaine personnalisé', 'Newsletter — 10 000 abonnés', 'IA — 50 articles / mois', 'Analytics avancés'] },
  business: { name: 'Business', desc: 'Pour les grandes organisations.', features: ['Blogs illimités', 'Articles illimités', 'Auteurs illimités', 'Domaines illimités', 'Newsletter illimitée', 'IA illimitée', 'Accès API', 'White label'] },
  enterprise: { name: 'Enterprise', desc: 'Pour les grandes entreprises.', features: ['Tout Business', 'SLA dédié', 'Support prioritaire', 'Onboarding personnalisé'] },
};

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cmsLang?: string }>;
}) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const [pricingPlans, stats, cms] = await Promise.all([
    getPricingPlans(lang),
    getPlatformStats(),
    getPlatformPage('home', lang),
  ]);

  let planStatic: Record<string, PlanStatic> = lang === 'fr' ? FR_PLAN_STATIC : EN_PLAN_STATIC;
  let homeMisc: HomeMisc = lang === 'fr' ? FR_HOME_MISC : EN_HOME_MISC;
  if (lang !== 'en' && lang !== 'fr') {
    const translated = await getUiTranslations('marketing', lang);
    if (translated?.homePricingPlans) planStatic = { ...EN_PLAN_STATIC, ...(translated.homePricingPlans as Record<string, PlanStatic>) };
    if (translated?.homeMisc) homeMisc = { ...EN_HOME_MISC, ...(translated.homeMisc as Partial<HomeMisc>) };
  }

  // Fallback EN codé en dur si le backend CMS est indisponible — jamais de page cassée.
  const cmsStatsLabels = (cms?.stats as any)?.labels ?? {
    active_blogs: 'Active blogs', articles_published: 'Articles published',
    monthly_readers: 'Monthly readers', uptime: 'Uptime SLA',
  };
  const editorShowcase = (cms?.editor_showcase as any) ?? {
    title: 'Write with built-in AI assistance',
    description: 'A powerful WYSIWYG editor with support for images, videos, code blocks, tables, and AI writing assistance to help you write faster and better.',
    items: ['AI content generation', 'Automatic SEO optimization', 'Code blocks with syntax highlighting', 'Rich media embeds'],
  };
  const analyticsShowcase = (cms?.analytics_showcase as any) ?? {
    title: 'Advanced real-time analytics',
    description: 'Track every metric that matters with real-time analytics, visitor insights, and comprehensive engagement reports.',
    items: ['Real-time page views', 'Detailed traffic sources', 'Top performing articles', 'Newsletter conversion rates'],
  };
  const pricingDisclaimer = (cms?.pricing as any)?.disclaimer
    ?? 'All plans include a 14-day free trial. No credit card required to start.';
  const trustBadges = (cms?.cta as any)?.trust_badges
    ?? ['2-min setup', 'Enterprise security', '4.9/5 rating'];

  const hero = (cms?.hero as any) ?? {
    title: 'The professional blog platform for teams',
    subtitle: 'Launch and manage multiple blogs, collaborate with your team, and grow your audience — all from one powerful platform.',
    cta: 'Get started free',
    ctaSecondary: 'View demo',
  };
  const featuresSection = (cms?.features as any) ?? {
    title: 'Everything you need to run a professional blog',
    subtitle: 'From writing to publishing, from analytics to monetization.',
    items: [
      { title: 'AI writing assistant', desc: 'Generate, improve, summarize, and translate content with integrated AI capabilities.' },
      { title: 'Multi-blog management', desc: 'Manage multiple independent blogs from a single dashboard. Each with its own team, domain, and settings.' },
      { title: 'Team collaboration', desc: 'Invite editors, authors, and viewers. Control who can write, review, and publish.' },
      { title: 'Built-in analytics', desc: 'Track page views, top articles, and subscriber growth with detailed real-time reports.' },
      { title: 'Newsletter built-in', desc: 'Grow and manage your subscriber list without any third-party tools.' },
      { title: 'SEO-first editor', desc: 'AI-powered SEO suggestions, automatic sitemaps, and structured data built right in.' },
    ],
  };
  const pricingHeaders = (cms?.pricing_headers as any) ?? {
    title: 'Simple, transparent pricing',
    subtitle: 'Start for free. Upgrade as you grow.',
    ctaFree: 'Start for free',
    cta: 'Get started',
  };
  const ctaSection = (cms?.cta_section as any) ?? {
    title: 'Ready to launch your blog?',
    subtitle: 'Join thousands of content creators who trust SmarterBloggers.',
    button: 'Start for free — no credit card needed',
  };
  const affiliate = (cms?.affiliate as any) ?? {
    eyebrow: 'Affiliate Program',
    title: 'Earn money by recommending SmarterBloggers',
    subtitle: 'Turn your network into recurring income — no cap on referrals, automatic crypto payouts.',
    steps: [
      { icon: 'link2', title: 'Share your unique link', description: 'Every account gets a personal referral code and link you can share anywhere — social media, email, your own blog.' },
      { icon: 'userplus', title: 'They subscribe', description: 'When someone you referred signs up for a paid plan, the commission tracking starts automatically — nothing to set up.' },
      { icon: 'coins', title: 'Get paid automatically', description: 'Commissions are paid out in cryptocurrency (USDT) as soon as your wallet is configured — no waiting period, no payout fees.' },
    ],
    highlights: [
      { value: '10%', label: 'Recurring commission on every payment your direct referrals make, for as long as they stay subscribed' },
      { value: '10 levels', label: "Extended referral network — earn a share from your referrals' own referrals too" },
      { value: 'Unlimited', label: 'No cap on how many people you can refer' },
    ],
    revenue_note: "Commissions are funded directly from platform revenue — never from other members' payments or funds. There are two verified revenue sources:",
    revenue_breakdown: [
      { source: 'Subscription payments', pool: '20% of every payment is allocated to the affiliate program', l1: '10% goes to your direct referral (Level 1)', rest: 'the remaining 10% is split equally across Levels 2–10 (~1.11% each)' },
      { source: 'Advertising revenue', pool: '10% of every ad payment is allocated to the affiliate program', l1: '5% goes to your direct referral (Level 1)', rest: 'the remaining 5% is split equally across Levels 2–10 (~0.56% each)' },
    ],
    cta_label: 'Start earning today',
  };
  const AFFILIATE_ICONS: Record<string, typeof Link2> = { link2: Link2, userplus: UserPlus, coins: Coins };

  const FEATURE_ICONS = [Bot, Globe2, Users, BarChart2, Rss, FileText];
  const FEATURE_COLORS = [
    'bg-violet-500/10 text-violet-400',
    'bg-blue-500/10 text-blue-400',
    'bg-cyan-500/10 text-cyan-400',
    'bg-emerald-500/10 text-emerald-400',
    'bg-pink-500/10 text-pink-400',
    'bg-orange-500/10 text-orange-400',
  ];
  const features = (featuresSection.items as { title: string; desc: string }[]).map((item, i) => ({
    icon: FEATURE_ICONS[i] ?? Bot,
    title: item.title,
    desc: item.desc,
    color: FEATURE_COLORS[i] ?? FEATURE_COLORS[0],
  }));

  // Static text/features per plan — translated via the `marketing` DeepL mechanism; prices come from API
  const PLAN_STATIC = planStatic;

  // Lookup API prices by plan ID (case-insensitive); static text always shown regardless of API
  const apiById = Object.fromEntries(
    pricingPlans.map((p: PricingPlan) => [p.id.toLowerCase(), p])
  );

  const DISPLAY_ORDER = ['free', 'starter', 'pro', 'business'];
  const FALLBACK_PRICES: Record<string, number> = { free: 0, starter: 5, pro: 30, business: 90 };

  // Always render the 4 core plans; prefer real DB fields (name/description/
  // features, editable from superadmin/plans), fall back to static EN/FR text
  // only when the API is unavailable or a field is empty.
  const plans = DISPLAY_ORDER.map(id => {
    const api = apiById[id] as PricingPlan | undefined;
    const fallback = PLAN_STATIC[id] ?? { name: id, desc: '', features: [] };
    const priceNum = api != null ? api.price_monthly : (FALLBACK_PRICES[id] ?? 0);
    return {
      id,
      name: api?.name || fallback.name,
      price: priceNum === 0 ? homeMisc.freeLabel : `$${priceNum}`,
      period: priceNum > 0 ? homeMisc.perMonthSuffix : undefined,
      desc: api?.description || fallback.desc,
      features: api?.features?.length ? api.features : fallback.features,
      cta: priceNum === 0 ? pricingHeaders.ctaFree : pricingHeaders.cta,
      highlight: api != null ? api.is_highlighted : id === 'pro',
      badge: (api != null ? api.is_highlighted : id === 'pro') ? homeMisc.popularBadge : null,
    };
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} transparent />

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
            {hero.title}
          </h1>

          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
            <Link
              href={`/${locale}/login`}
              className="group flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base transition-all shadow-xl shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02] w-full sm:w-auto justify-center"
            >
              {hero.cta}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold text-sm sm:text-base transition-all hover:bg-white/5 backdrop-blur-sm w-full sm:w-auto justify-center"
            >
              {hero.ctaSecondary}
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
              { value: stats ? stats.active_blogs.toLocaleString(locale) : '—', label: cmsStatsLabels.active_blogs },
              { value: stats ? stats.published_articles.toLocaleString(locale) : '—', label: cmsStatsLabels.articles_published },
              { value: stats ? stats.monthly_readers.toLocaleString(locale) : '—', label: cmsStatsLabels.monthly_readers },
              { value: stats?.uptime_pct != null ? `${stats.uptime_pct}%` : homeMisc.collectingData, label: cmsStatsLabels.uptime },
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">{featuresSection.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">{featuresSection.subtitle}</p>
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
              {editorShowcase.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8">
              {editorShowcase.description}
            </p>
            <ul className="space-y-3">
              {(editorShowcase.items as string[]).map((item) => (
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
              {analyticsShowcase.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-8">
              {analyticsShowcase.description}
            </p>
            <ul className="space-y-3">
              {(analyticsShowcase.items as string[]).map((item) => (
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">{pricingHeaders.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">{pricingHeaders.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 items-start">
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
            {pricingDisclaimer}
          </p>
        </div>
      </section>

      {/* ─── AFFILIATE PROGRAM ─────────────────────────────────────────────── */}
      <section id="affiliate" className="py-16 md:py-24 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 md:mb-4">{affiliate.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">{affiliate.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-12 md:mb-16">
            {(affiliate.steps as { icon: string; title: string; description: string }[]).map(({ icon, title, description }, i) => {
              const Icon = AFFILIATE_ICONS[icon] ?? Link2;
              return (
                <div
                  key={title}
                  className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-slate-300 dark:text-slate-700">0{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
            {(affiliate.highlights as { value: string; label: string }[]).map(({ value, label }) => (
              <div key={label} className="text-center px-4">
                <p className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">{value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>

          {affiliate.revenue_breakdown && (
            <div className="max-w-3xl mx-auto mb-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 text-center">
                {affiliate.revenue_note}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(affiliate.revenue_breakdown as { source: string; pool: string; l1: string; rest: string }[]).map(({ source, pool, l1, rest }) => (
                  <div key={source} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">{source}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{pool}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">→ {l1}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">→ {rest}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.02]"
            >
              {affiliate.cta_label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{ctaSection.title}</h2>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">{ctaSection.subtitle}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all shadow-xl shadow-blue-600/30 hover:scale-[1.02]"
          >
            {ctaSection.button}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center justify-center gap-8 mt-10">
            {(trustBadges as string[]).map((text, i) => {
              const Icon = [Zap, Shield, Star][i] ?? Star;
              return (
                <div key={text} className="flex items-center gap-2 text-slate-400 text-sm">
                  <Icon className="h-4 w-4 text-slate-500" />
                  {text}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
