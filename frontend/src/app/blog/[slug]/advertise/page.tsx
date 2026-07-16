import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/public-api';
import { ThemeAdvertise } from '@/components/themes/ThemeRenderer';
import type { Metadata } from 'next';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ lang?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await publicApi.getBlogInfo(slug);
    return { title: `Advertise on ${blog.name}`, description: `Reach the audience of ${blog.name} with targeted advertising.` };
  } catch {
    return { title: 'Advertise' };
  }
}

export default async function CustomDomainAdvertisePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { lang } = await searchParams;

  let blog, categories;
  try {
    [blog, categories] = await Promise.all([
      publicApi.getBlogInfo(slug, lang),
      publicApi.getCategories(slug),
    ]);
  } catch {
    notFound();
  }

  return (
    <ThemeAdvertise
      blog={blog}
      categories={categories}
      basePath=""
    />
  );
}
