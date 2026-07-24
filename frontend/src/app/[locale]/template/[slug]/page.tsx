import { notFound } from 'next/navigation';
import CorporateArticle from '@/components/themes/corporate/CorporateArticle';
import {
  MOCK_BLOG, MOCK_ARTICLES, ARTICLE_CONTENTS,
} from '@/components/themes/corporate/mock-data';
import { publicApi } from '@/lib/public-api';
import { getUiTranslations } from '@/lib/platform-api';

const EN_CONTENT_COMING_SOON = 'Content for article "{title}" coming soon.';
const FR_CONTENT_COMING_SOON = 'Contenu de l\'article "{title}" à venir.';

export function generateStaticParams() {
  return MOCK_ARTICLES.map(a => ({ slug: a.slug }));
}

export default async function TemplateArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { locale, slug } = await params;
  const { preview } = await searchParams;

  if (preview) {
    try {
      const [blog, article, allArticles] = await Promise.all([
        publicApi.getBlogInfo(preview),
        publicApi.getArticle(preview, slug),
        publicApi.getArticles(preview, { limit: 10 }),
      ]);
      const related = allArticles.filter(a => a.slug !== slug).slice(0, 5);
      return (
        <CorporateArticle
          blog={blog as any}
          article={article as any}
          relatedArticles={related as any}
          basePath={`/${locale}/template`}
          previewSlug={preview}
        />
      );
    } catch {
      // Fall through to mock data
    }
  }

  const article = MOCK_ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  const related = MOCK_ARTICLES.filter(a => a.id !== article.id).slice(0, 5);

  let comingSoonTpl = locale === 'fr' ? FR_CONTENT_COMING_SOON : EN_CONTENT_COMING_SOON;
  if (locale !== 'en' && locale !== 'fr') {
    const translated = await getUiTranslations('marketing', locale);
    const tpl = (translated?.templateArticle as Record<string, string> | undefined)?.contentComingSoon;
    if (tpl) comingSoonTpl = tpl;
  }

  const fullArticle = {
    ...article,
    content: ARTICLE_CONTENTS[article.slug] ?? `<p>${comingSoonTpl.replace('{title}', article.title)}</p>`,
  };

  return (
    <CorporateArticle
      blog={MOCK_BLOG as any}
      article={fullArticle as any}
      relatedArticles={related as any}
    />
  );
}
