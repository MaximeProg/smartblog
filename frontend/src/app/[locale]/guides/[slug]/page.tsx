import Image from 'next/image';
import { notFound } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { PublicFooter } from '@/components/marketing/PublicFooter';
import { PageHero } from '@/components/marketing/PageHero';
import { getPlatformPage } from '@/lib/platform-api';

export const dynamic = 'force-dynamic';

interface GuideSection {
  title: string;
  body: string;
  image: string | null;
  tips: string[];
}

interface GuideContent {
  hero: { title: string; subtitle: string };
  sections: GuideSection[];
  next: { title: string; description: string };
}

export default async function GuideDetailPage({
  params,
}: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const cms = (await getPlatformPage(`guide-${slug}`, locale)) as GuideContent | null;
  if (!cms) notFound();
  const c = cms;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white antialiased transition-colors">
      <PublicNav locale={locale} lang={locale} />

      <PageHero
        image="https://images.unsplash.com/photo-1633265486064-086b219458ec?auto=format&fit=crop&w=1920&q=85"
        title={c.hero.title}
        subtitle={c.hero.subtitle}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        {c.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-xl font-bold mb-3">{section.title}</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              {section.body}
            </p>
            {section.tips.length > 0 && (
              <ul className="space-y-2 mb-5">
                {section.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
            {section.image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <Image
                  src={section.image}
                  alt={section.title}
                  width={1440}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
            )}
          </section>
        ))}

        {c.next.description && (
          <section className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              {c.next.title}
              <ArrowRight className="h-4 w-4" />
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {c.next.description}
            </p>
          </section>
        )}
      </div>

      <PublicFooter locale={locale} lang={locale} />
    </div>
  );
}
