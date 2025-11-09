// frontend/src/app/client/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { fetchArticleContent } from '@/lib/serverData';
import ArticlePageClient from '@/components/client/pages/ArticlePageClient';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const articleContent = await fetchArticleContent(slug);

  if (!articleContent) {
    notFound();
  }

  return <ArticlePageClient initialData={articleContent} />;
}