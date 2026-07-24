import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, ShieldCheck, BarChart3, Shield, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { getPlatformPage } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

const ICONS: Record<string, LucideIcon> = {
  users: Users, 'shield-check': ShieldCheck, 'bar-chart-3': BarChart3, shield: Shield,
};

const FALLBACK = {
  hero: {
    title: 'Put your brand in front of thousands of engaged readers',
    subtitle: 'Advertise directly on the SmarterBloggers homepage — reviewed and published by our team, paid securely in crypto.',
    cta_label: 'See how it works',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80',
  },
  benefits: {
    title: 'Why advertise with SmarterBloggers',
    items: [
      { icon: 'users', title: 'Real, engaged audience', description: 'Your ad reaches bloggers and readers actively using the platform every day.' },
      { icon: 'shield-check', title: 'Human-reviewed', description: 'Every ad is checked for safety and quality by our team before it goes live — no bots, no scams.' },
      { icon: 'bar-chart-3', title: 'Real-time statistics', description: 'Track impressions, clicks, and click-through rate live from your own advertiser dashboard.' },
      { icon: 'shield', title: 'Secure crypto payment', description: 'Pay safely in USDT — no card details shared, no hidden fees.' },
    ],
  },
  how_it_works: {
    title: 'How it works',
    steps: [
      { title: 'Create your account', description: "Sign up or log in — the same account you'd use anywhere else on SmarterBloggers." },
      { title: 'Submit your ad', description: 'Add your title, image, destination link and budget from your Advertiser dashboard.' },
      { title: 'Pay securely', description: 'Complete payment in USDT — your submission is reviewed once payment is confirmed.' },
      { title: 'Go live', description: 'Once approved, your ad appears on the SmarterBloggers homepage and you can track its performance live.' },
    ],
  },
  cta: {
    title: 'Ready to get started?',
    subtitle: 'Create an account or log in to submit your first ad in minutes.',
    signup_label: 'Sign up',
    login_label: 'Log in',
  },
};

export default async function AdvertiseWithUsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('advertise-with-us', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <Image src={c.hero.image_url} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5">{c.hero.title}</h1>
          <p className="text-lg text-slate-300 mb-8">{c.hero.subtitle}</p>
          <a href="#how-it-works" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all">
            {c.hero.cta_label}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">{c.benefits.title}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(c.benefits.items as typeof FALLBACK.benefits.items).map(({ icon, title, description }) => {
              const Icon = ICONS[icon] ?? Shield;
              return (
                <div key={title} className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-10 text-center">{c.how_it_works.title}</h2>
          <div className="space-y-6">
            {(c.how_it_works.steps as typeof FALLBACK.how_it_works.steps).map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — sign up / log in */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">{c.cta.title}</h2>
          <p className="text-blue-100 mb-8">{c.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${locale}/register`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-all"
            >
              {c.cta.signup_label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/login`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all"
            >
              {c.cta.login_label}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
