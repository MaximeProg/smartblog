import { ArrowRight, BookOpen, Code2, Webhook, Key, Users, FileText, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage } from '@/lib/platform-api';

const ICONS: Record<string, LucideIcon> = {
  bookopen: BookOpen, code2: Code2, webhook: Webhook, key: Key, users: Users, filetext: FileText,
};

const ICON_COLORS: Record<string, string> = {
  bookopen: 'bg-blue-500/10 text-blue-500', code2: 'bg-violet-500/10 text-violet-500',
  webhook: 'bg-orange-500/10 text-orange-500', key: 'bg-emerald-500/10 text-emerald-500',
  users: 'bg-cyan-500/10 text-cyan-500', filetext: 'bg-pink-500/10 text-pink-500',
};

const FALLBACK = {
  hero: { title: 'Documentation', subtitle: 'Guides, API references, and resources for building with SmarterBloggers.' },
  quickstart: {
    comment: 'Check API status',
    command: 'curl https://api.smarterbloggers.com/v1/health',
    response: '→ { "status": "ok", "version": "2.1.0" }',
  },
  sections: [
    { icon: 'bookopen', title: 'Getting Started', description: 'Everything you need to set up your first blog and start publishing.', href: '' },
    { icon: 'code2', title: 'API Reference', description: 'Full REST API documentation with examples and SDKs.', href: 'docs/api' },
    { icon: 'webhook', title: 'Webhooks', description: 'Integrate SmarterBloggers events into your own systems and workflows.', href: '' },
    { icon: 'key', title: 'Authentication', description: 'Learn how to authenticate with the SmarterBloggers API using JWT.', href: '' },
    { icon: 'users', title: 'Team & Roles', description: 'Manage access control and permissions for your team members.', href: '' },
    { icon: 'filetext', title: 'Content API', description: 'Read published content with our public Content Delivery API.', href: '' },
  ],
};

export default async function DocsPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('docs', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-slate-900 rounded-2xl p-6 mb-14 font-mono text-sm">
          <p className="text-slate-500 mb-2 text-xs"># {c.quickstart.comment}</p>
          <p className="text-emerald-400">{`$ ${c.quickstart.command}`}</p>
          <p className="text-slate-300 mt-2">{c.quickstart.response}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(c.sections as typeof FALLBACK.sections).map(({ icon, title, description, href }) => {
            const Icon = ICONS[icon] ?? BookOpen;
            const target = href
              ? `/${locale}/${href}`
              : `/${locale}/contact?subject=${encodeURIComponent(`Question about: ${title}`)}`;
            return (
              <a
                key={title}
                href={target}
                className="group bg-slate-50 dark:bg-slate-900 rounded-2xl p-7 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className={`h-12 w-12 rounded-xl ${ICON_COLORS[icon] ?? ''} flex items-center justify-center mb-5`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-blue-500 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                  {description}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-blue-500 font-semibold">
                  {href ? 'Learn more' : 'Ask us'}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <PublicFooter locale={locale} lang={lang} />
    </div>
  );
}
