import { notFound } from 'next/navigation';
import CorporateArticle from '@/components/themes/corporate/CorporateArticle';
import {
  MOCK_BLOG, MOCK_ARTICLES, MOCK_COMMENTS, ARTICLE_CONTENTS,
} from '@/components/themes/corporate/mock-data';
import { publicApi } from '@/lib/public-api';

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
  const { slug } = await params;
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
          comments={[]}
          basePath="/en/template"
          previewSlug={preview}
          getArticleHref={(s: string) => `/en/template/${s}?preview=${preview}`}
        />
      );
    } catch {
      // Fall through to mock data
    }
  }

  const article = MOCK_ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  const related = MOCK_ARTICLES.filter(a => a.id !== article.id).slice(0, 5);
  const comments = MOCK_COMMENTS[article.id] ?? [];

  const fullArticle = {
    ...article,
    content: ARTICLE_CONTENTS[article.slug] ?? `<p>Contenu de l'article "${article.title}" à venir.</p>`,
  };

  return (
    <CorporateArticle
      blog={MOCK_BLOG as any}
      article={fullArticle as any}
      relatedArticles={related as any}
      comments={comments}
    />
  );
}
