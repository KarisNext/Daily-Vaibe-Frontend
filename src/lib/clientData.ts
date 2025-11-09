export interface SessionData {
  isAuthenticated: boolean;
  isAnonymous?: boolean;
  client_id?: string | null;
  csrf_token: string | null;
}

export interface NewsArticle {
  news_id: string;
  slug: string;
  title: string;
  excerpt: string; // REQUIRED
  content?: string;
  image_url: string | null; // REQUIRED - no undefined
  published_at: string;
  reading_time: number; // REQUIRED - no undefined
  views: number;
  likes_count: number;
  first_name: string;
  last_name: string;
  author_name?: string;
  category_name: string;
  category_slug: string;
}

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  icon?: string;
  isGroup?: boolean;
}

export interface CategoryGroup {
  title: string;
  categories: Category[];
}

export interface HomeContent {
  sessionData: SessionData;
  sliderSlides: NewsArticle[];
  headlines: NewsArticle[];
  topArticles: NewsArticle[];
  trending: NewsArticle[];
  latest: NewsArticle[];
  popular: NewsArticle[];
  politicsNews: NewsArticle[];
  countiesNews: NewsArticle[];
  opinionNews: NewsArticle[];
  businessNews: NewsArticle[];
  sportsNews: NewsArticle[];
  technologyNews: NewsArticle[];
  breakingNews: NewsArticle[];
  featuredNews: NewsArticle[];
  categories: Category[];
}

export interface CategoryContent {
  category: Category;
  news: NewsArticle[];
  pagination: {
    current_page: number;
    per_page: number;
    total_news: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ArticleContent {
  article: NewsArticle;
  related: NewsArticle[];
}

export const MAIN_CATEGORIES: Category[] = [
  { category_id: 0, slug: 'home', name: 'Home', icon: '🏠', isGroup: false },
  { category_id: 1, slug: 'live-world', name: 'Live & World', icon: '🌍', isGroup: true },
  { category_id: 2, slug: 'counties', name: 'Counties', icon: '🏢', isGroup: true },
  { category_id: 3, slug: 'politics', name: 'Politics', icon: '🏛️', isGroup: true },
  { category_id: 4, slug: 'business', name: 'Business', icon: '💼', isGroup: true },
  { category_id: 5, slug: 'opinion', name: 'Opinion', icon: '💭', isGroup: true },
  { category_id: 6, slug: 'sports', name: 'Sports', icon: '⚽', isGroup: true },
  { category_id: 7, slug: 'lifestyle', name: 'Life & Style', icon: '🎭', isGroup: true },
  { category_id: 8, slug: 'entertainment', name: 'Entertainment', icon: '🎉', isGroup: true },
  { category_id: 9, slug: 'tech', name: 'Technology', icon: '💻', isGroup: true }
];

export const CATEGORY_ICONS: { [key: string]: string } = {
  'Live & World': '🌍',
  'Counties': '🏢',
  'Business': '💼',
  'Opinion': '💭',
  'Sports': '⚽',
  'Life & Style': '🎭',
  'Entertainment': '🎉',
  'Technology': '💻',
  'Politics': '🏛️',
  'home': '🏠',
  'live-world': '🌍',
  'counties': '🏢',
  'politics': '🏛️',
  'business': '💼',
  'opinion': '💭',
  'sports': '⚽',
  'lifestyle': '🎭',
  'entertainment': '🎉',
  'tech': '💻',
  'technology': '💻'
};

export const GROUP_TO_CATEGORY_MAP: { [key: string]: string } = {
  'Live & World': 'live-world',
  'Counties': 'counties',
  'Politics': 'politics',
  'Business': 'business',
  'Opinion': 'opinion',
  'Sports': 'sports',
  'Life & Style': 'lifestyle',
  'Entertainment': 'entertainment',
  'Technology': 'tech',
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] || '📰';
}

export function getCategoryColor(slug: string): string {
  const colors: { [key: string]: string } = {
    politics: '#e74c3c',
    counties: '#3498db',
    opinion: '#9b59b6',
    business: '#2ecc71',
    sports: '#f39c12',
    technology: '#1abc9c',
    tech: '#1abc9c',
    'live-world': '#e67e22',
    lifestyle: '#9b59b6',
    entertainment: '#e91e63'
  };
  return colors[slug] || '#34495e';
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return MAIN_CATEGORIES.find(cat => cat.slug === slug);
}

export function isCategoryGroup(slug: string): boolean {
  const category = getCategoryBySlug(slug);
  return category?.isGroup ?? false;
}

// Helper function to calculate reading time from content
function calculateReadingTime(content?: string, title?: string): number {
  if (!content && !title) return 3;
  
  const text = (content || '') + ' ' + (title || '');
  const words = text.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return Math.max(1, Math.min(minutes, 15)); // Between 1-15 minutes
}

// Helper function to normalize articles from backend
export function normalizeArticle(article: any): NewsArticle {
  return {
    news_id: article.news_id || '',
    slug: article.slug || '',
    title: article.title || 'Untitled',
    excerpt: article.excerpt || article.title?.substring(0, 150) + '...' || 'Read more about this story...',
    content: article.content,
    image_url: article.image_url !== undefined ? article.image_url : null,
    published_at: article.published_at || new Date().toISOString(),
    reading_time: article.reading_time || calculateReadingTime(article.content, article.title),
    views: article.views || 0,
    likes_count: article.likes_count || 0,
    first_name: article.first_name || '',
    last_name: article.last_name || '',
    author_name: article.author_name,
    category_name: article.category_name || '',
    category_slug: article.category_slug || ''
  };
}

// Helper to process article arrays
export function normalizeArticles(articles: any[]): NewsArticle[] {
  return articles.map(normalizeArticle);
}