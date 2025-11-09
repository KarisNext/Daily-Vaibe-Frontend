import { notFound } from 'next/navigation';
import { fetchCategoryContent, fetchGroupContent } from '@/lib/serverData';
import CategoryPageClient from '@/components/client/pages/CategoryPageClient';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const GROUP_SLUGS = ['live-world', 'counties', 'politics', 'business', 'opinion', 'sports', 'lifestyle', 'entertainment', 'tech'];

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  
  const currentPage = page ? parseInt(page) : 1;
  const isGroup = GROUP_SLUGS.includes(slug);
  
  const categoryContent = isGroup 
    ? await fetchGroupContent(slug, currentPage, 20)
    : await fetchCategoryContent(slug, currentPage, 20);

  if (!categoryContent?.category) {
    notFound();
  }

  return <CategoryPageClient initialData={categoryContent} slug={slug} />;
}