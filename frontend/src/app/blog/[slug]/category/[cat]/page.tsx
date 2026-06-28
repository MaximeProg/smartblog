import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { publicApi } from '@/lib/public-api';
import { ThemeHome } from '@/components/themes/ThemeRenderer';

interface Props {
  params: Promise<{ slug: string; cat: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, cat } = await params;
  try {
    const [blog, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getCategories(slug),
    ]);
    const category = categories.find((c) => c.slug === cat);
    return {
      title: category?.name ?? cat,
      description: category?.description ?? undefined,
      openGraph: { siteName: blog.name },
    };
  } catch {
    return { title: 'Catégorie' };
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug, cat } = await params;
  try {
    const [blog, articles, categories] = await Promise.all([
      publicApi.getBlogInfo(slug),
      publicApi.getArticles(slug, { category: cat, limit: 20 }),
      publicApi.getCategories(slug),
    ]);

    return (
      <ThemeHome
        blog={blog}
        articles={articles}
        categories={categories}
        currentCategory={cat}
      />
    );
  } catch {
    notFound();
  }
}
