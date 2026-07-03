import { redirect } from 'next/navigation';

export default async function BlogRootPage({
  params,
}: {
  params: Promise<{ locale: string; blogId: string }>;
}) {
  const { locale, blogId } = await params;
  redirect(`/${locale}/blogs/${blogId}/general`);
}
