import { Clock, ArrowRight, BookOpen, Rocket, Users, BarChart2, Globe2, Palette, type LucideIcon } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage } from '@/lib/platform-api';

const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, bookopen: BookOpen, users: Users, barchart2: BarChart2, palette: Palette, globe2: Globe2,
};

const ICON_COLORS: Record<string, string> = {
  rocket: 'bg-blue-500/10 text-blue-500', bookopen: 'bg-violet-500/10 text-violet-500',
  users: 'bg-cyan-500/10 text-cyan-500', barchart2: 'bg-emerald-500/10 text-emerald-500',
  palette: 'bg-orange-500/10 text-orange-500', globe2: 'bg-pink-500/10 text-pink-500',
};

const FALLBACK = {
  hero: { title: 'Guides', subtitle: 'Everything you need to get the most out of SmarterBloggers.' },
  categories: [
    { icon: 'rocket', title: 'Getting Started', guides: [
      { title: 'Create your first blog in 5 minutes', time: '5 min' },
      { title: 'Setting up your custom domain', time: '8 min' },
      { title: 'Invite your first team member', time: '3 min' },
      { title: 'Publish your first article', time: '10 min' },
    ] },
    { icon: 'bookopen', title: 'Writing & Publishing', guides: [
      { title: 'Using the rich text editor', time: '12 min' },
      { title: 'AI writing assistant guide', time: '8 min' },
      { title: 'Optimizing articles for SEO', time: '15 min' },
      { title: 'Managing categories and tags', time: '6 min' },
    ] },
    { icon: 'users', title: 'Team Management', guides: [
      { title: 'Understanding user roles', time: '7 min' },
      { title: 'Setting up editorial workflows', time: '10 min' },
      { title: 'Managing permissions', time: '5 min' },
    ] },
    { icon: 'barchart2', title: 'Analytics', guides: [
      { title: 'Reading your analytics dashboard', time: '8 min' },
      { title: 'Understanding traffic sources', time: '6 min' },
      { title: 'Growing your newsletter', time: '12 min' },
    ] },
    { icon: 'palette', title: 'Design & Branding', guides: [
      { title: 'Customizing your blog theme', time: '10 min' },
      { title: 'Working with images and media', time: '8 min' },
    ] },
    { icon: 'globe2', title: 'Multilingual Blogging', guides: [
      { title: 'Creating multilingual content', time: '12 min' },
      { title: 'Translating your blog interface', time: '6 min' },
    ] },
  ],
};

export default async function GuidesPage({
  params, searchParams,
}: { params: Promise<{ locale: string }>; searchParams: Promise<{ cmsLang?: string }> }) {
  const { locale } = await params;
  const { cmsLang } = await searchParams;
  const lang = cmsLang || locale;
  const cms = (await getPlatformPage('guides', lang)) as typeof FALLBACK | null;
  const c = cms ?? FALLBACK;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={lang} />

      <PageHero
        image="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          {(c.categories as typeof FALLBACK.categories).map(({ icon, title, guides }) => {
            const Icon = ICONS[icon] ?? BookOpen;
            return (
              <div key={title}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`h-10 w-10 rounded-xl ${ICON_COLORS[icon] ?? ''} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-lg">{title}</h2>
                </div>
                <div className="space-y-1">
                  {guides.map(({ title: gt, time }) => (
                    <a
                      key={gt}
                      href={`/${locale}/contact?subject=${encodeURIComponent(`Question about: ${gt}`)}`}
                      className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                        {gt}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {time}
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PublicFooter locale={locale} />
    </div>
  );
}
