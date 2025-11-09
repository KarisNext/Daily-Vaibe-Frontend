import { notFound } from 'next/navigation';
import { fetchCategoryContent } from '@/lib/serverData';
import SubCategoryPageClient from '@/components/client/pages/SubCategoryPageClient';

interface SubCategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function SubCategoryPage({ params, searchParams }: SubCategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  
  const currentPage = page ? parseInt(page) : 1;
  const categoryContent = await fetchCategoryContent(slug, currentPage, 20);

  if (!categoryContent.category) {
    notFound();
  }

  return <SubCategoryPageClient initialData={categoryContent} slug={slug} />;
}