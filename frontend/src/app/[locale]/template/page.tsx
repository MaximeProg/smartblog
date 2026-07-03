import { publicApi } from '@/lib/public-api';
import CorporateHome from '@/components/themes/corporate/CorporateHome';
import { MOCK_BLOG, MOCK_ARTICLES, MOCK_CATEGORIES } from '@/components/themes/corporate/mock-data';

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string; category?: string; q?: string }>;
}) {
  const { preview, category, q } = await searchParams;

  if (preview) {
    try {
      const [blog, articles, categories] = await Promise.all([
        publicApi.getBlogInfo(preview),
        publicApi.getArticles(preview, { category, q }),
        publicApi.getCategories(preview),
      ]);
      return (
        <CorporateHome
          blog={blog as any}
          articles={articles as any}
          categories={categories as any}
          currentCategory={category}
          searchQuery={q}
          previewSlug={preview}
        />
      );
    } catch {
      // Fall through to mock data if blog not found or API error
    }
  }

  return (
    <CorporateHome
      blog={MOCK_BLOG as any}
      articles={MOCK_ARTICLES as any}
      categories={MOCK_CATEGORIES as any}
      currentCategory={category}
      searchQuery={q}
    />
  );
}
