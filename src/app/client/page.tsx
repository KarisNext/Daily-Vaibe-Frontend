// frontend/src/app/client/page.tsx
import { fetchHomeContent } from '@/lib/serverData';
import HomePageClient from '@/components/client/pages/HomePageClient';

export default async function ClientHomePage() {
  const homeContent = await fetchHomeContent();

  const initialData = {
    sessionData: {
      isAuthenticated: false,
      csrf_token: null
    },
    sliderSlides: homeContent.featured_news.slice(0, 5),
    headlines: homeContent.breaking_news.slice(0, 8),
    topArticles: homeContent.featured_news.slice(0, 3),
    politicsNews: homeContent.category_previews.politics || [],
    countiesNews: homeContent.category_previews.counties || [],
    opinionNews: homeContent.category_previews.opinion || [],
    businessNews: homeContent.category_previews.business || [],
    sportsNews: homeContent.category_previews.sports || [],
    technologyNews: homeContent.category_previews.technology || [],
    breakingNews: homeContent.breaking_news,
    featuredNews: homeContent.featured_news,
    categories: homeContent.categories
  };

  return <HomePageClient initialData={initialData} />;
}