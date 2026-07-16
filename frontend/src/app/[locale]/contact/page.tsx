import Image from 'next/image';
import { Mail, MessageSquare, Headphones, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { siteConfig } from '@/config/site';
import { getPlatformPage } from '@/lib/platform-api';
import { ContactForm } from './ContactForm';

const ICONS: Record<string, LucideIcon> = {
  messagesquare: MessageSquare, headphones: Headphones, mail: Mail,
};

const ICON_COLORS: Record<string, string> = {
  messagesquare: 'bg-blue-500/10 text-blue-500',
  headphones: 'bg-emerald-500/10 text-emerald-500',
  mail: 'bg-violet-500/10 text-violet-500',
};

// Fallback EN codé en dur si le backend CMS est indisponible — jamais de page cassée.
const FALLBACK: any = {
  hero: {
    title: 'Contact Us',
    subtitle: 'Our team is available Monday–Friday, 9am–6pm CET.',
    image_url: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=1920&q=85',
  },
  channels_intro: { title: 'Find the right channel' },
  channels: [
    { key: 'sales', icon: 'messagesquare', title: 'Sales', description: 'Questions about plans, pricing, or custom enterprise contracts.' },
    { key: 'support', icon: 'headphones', title: 'Support', description: 'Technical help or questions about your account.' },
    { key: 'general', icon: 'mail', title: 'General', description: 'Press, partnerships, or anything else.' },
  ],
  response_times: {
    title: 'Average response time',
    items: [
      { label: 'Pro Support', value: '< 4h' },
      { label: 'Business Support', value: '< 1h' },
      { label: 'Starter Support', value: '< 24h' },
      { label: 'Sales', value: '< 2h' },
    ],
  },
  form: {
    title: 'Send a message',
    name_label: 'Name', name_placeholder: 'Your name',
    email_label: 'Email', email_placeholder: 'you@email.com',
    subject_label: 'Subject', subject_placeholder: 'How can we help?',
    message_label: 'Message', message_placeholder: 'Describe your request...',
    submit_label: 'Send Message',
    success_title: 'Message sent!',
    success_message: "We'll get back to you as soon as possible.",
  },
};

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cmsLang?: string; subject?: string }>;
}) {
  const { locale } = await params;
  const { cmsLang, subject } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('contact', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      {/* Hero */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <Image
          src={c.hero.image_url}
          alt=""
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950/90" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight max-w-3xl">
            {c.hero.title}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            {c.hero.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: channels + response times */}
          <div>
            <h2 className="text-2xl font-bold mb-8">{c.channels_intro.title}</h2>
            <div className="space-y-4 mb-10">
              {(c.channels as { key: string; icon: string; title: string; description: string }[]).map(({ key, icon, title, description }) => {
                const Icon = ICONS[icon] ?? Mail;
                const email = (siteConfig.contact as Record<string, string>)[key] ?? siteConfig.contact.general;
                return (
                  <div key={key} className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900">
                    <div className={`h-11 w-11 rounded-xl ${ICON_COLORS[icon] ?? ''} flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold mb-0.5">{title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{description}</p>
                      <a href={`mailto:${email}`} className="text-sm text-blue-500 hover:underline">{email}</a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900">
              <p className="text-sm font-semibold mb-4">{c.response_times.title}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(c.response_times.items as { label: string; value: string }[]).map(({ label, value }) => (
                  <div key={label} className="text-center bg-white dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-base font-bold text-blue-500">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form (client component — interactive state) */}
          <div>
            <ContactForm config={c.form} initialSubject={subject ?? ''} />
          </div>
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
