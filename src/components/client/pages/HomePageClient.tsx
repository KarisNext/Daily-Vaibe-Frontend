'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber, getImageUrl } from '@/lib/clientData';
import type { NewsArticle, Category } from '@/lib/clientData';
import Gallery from '../components/Gallery';
import HeroSlider from '../components/HeroSlider';
import Header from '../components/Header';
import Horizontal from '../components/Horizontal';
import Footer from '../components/Footer';
import SmallRibbon from '../components/SmallRibbon';

interface HomePageData {
  sessionData: {
    isAuthenticated: boolean;
    csrf_token: string | null;
  };
  sliderSlides: NewsArticle[];
  headlines: NewsArticle[];
  topArticles: NewsArticle[];
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

const HORIZONTAL_CATEGORIES = [
  { slug: 'live-world', name: 'Live & World', icon: '🌍' },
  { slug: 'counties', name: 'Counties', icon: '🏢' },
  { slug: 'politics', name: 'Politics', icon: '🏛️' },
  { slug: 'business', name: 'Business', icon: '💼' },
  { slug: 'opinion', name: 'Opinion', icon: '💭' },
  { slug: 'sports', name: 'Sports', icon: '⚽' },
  { slug: 'lifestyle', name: 'Life & Style', icon: '🎭' },
  { slug: 'entertainment', name: 'Entertainment', icon: '🎉' },
  { slug: 'tech', name: 'Technology', icon: '💻' }
];

const FOOTER_ITEMS = [
  { name: 'About Us', icon: 'ℹ️' },
  { name: 'Contact', icon: '📧' },
  { name: 'Privacy Policy', icon: '🔒' },
  { name: 'Terms of Service', icon: '📄' },
  { name: 'Advertise', icon: '📢' },
];

export default function HomePageClient({ initialData }: { initialData: HomePageData }) {
  const router = useRouter();
  const [showGallery, setShowGallery] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<string>('white');
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  
  const [showHeadlines, setShowHeadlines] = useState<boolean>(false);
  const [showTrending, setShowTrending] = useState<boolean>(false);
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [showFooter, setShowFooter] = useState<boolean>(false);

  const [currentHeadlineIndex, setCurrentHeadlineIndex] = useState<number>(0);
  const [isHeadlinePaused, setIsHeadlinePaused] = useState<boolean>(false);

  const {
    sliderSlides,
    headlines,
    topArticles,
    politicsNews,
    countiesNews,
    opinionNews,
    businessNews,
    sportsNews,
    technologyNews,
    breakingNews,
    featuredNews,
  } = initialData;

  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const recentFeatured = featuredNews.filter(article => 
    new Date(article.published_at) >= threeHoursAgo
  );

  const trendingNews = [
    ...breakingNews.slice(0, 5),
    ...politicsNews.slice(0, 5),
    ...countiesNews.slice(0, 5),
    ...businessNews.slice(0, 5)
  ].slice(0, 20);

  const handleThemeChange = useCallback((theme: string): void => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vybes-theme', theme);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vybes-theme') || 'white';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (headlines.length === 0 || isHeadlinePaused) return;
    
    const interval = setInterval(() => {
      setCurrentHeadlineIndex((prev) => (prev + 1) % Math.min(headlines.length, 6));
    }, 4000);
    
    return () => clearInterval(interval);
  }, [headlines.length, isHeadlinePaused]);

  const handleArticleClick = useCallback((article: NewsArticle | any): void => {
    if (article?.slug) {
      router.push(`/client/articles/${article.slug}`);
    }
  }, [router]);

  const getAuthorName = useCallback((article: NewsArticle | any): string => {
    if (!article) return 'Anonymous';
    if (article.author_name) return article.author_name;
    if (article.first_name || article.last_name) {
      return `${article.first_name || ''} ${article.last_name || ''}`.trim() || 'Anonymous';
    }
    if (article.author?.first_name || article.author?.last_name) {
      return `${article.author.first_name || ''} ${article.author.last_name || ''}`.trim() || 'Anonymous';
    }
    return 'Anonymous';
  }, []);

  const closeSidebar = useCallback((): void => {
    setShowHeadlines(false);
    setShowTrending(false);
    setShowCategories(false);
    setShowFooter(false);
  }, []);

  const renderCard = useCallback((
    article: NewsArticle, 
    size: 'large' | 'medium' | 'small', 
    index: number, 
    sectionName: string
  ): JSX.Element => {
    const imageUrl = getImageUrl(article.image_url || '');
    const uniqueKey = article.news_id 
      ? `${sectionName}-${article.news_id}-${size}-${index}` 
      : `${sectionName}-fallback-${article.slug || ''}-${size}-${index}`;
    
    return (
      <div key={uniqueKey} className={`card-${size} lazy-card`} onClick={() => handleArticleClick(article)}>
        <div className="card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={article.title} loading="lazy" />
          ) : (
            <div className="image-placeholder">📰</div>
          )}
        </div>
        <div className="card-content">
          <span className="category-badge">{article.category_name}</span>
          <h3 className="card-title">{article.title}</h3>
          <div className="card-meta">
            <span>{getAuthorName(article)}</span>
            <span>•</span>
            <span>{formatDate(article.published_at)}</span>
            <span>•</span>
            <span>👁 {formatNumber(article.views)}</span>
          </div>
        </div>
      </div>
    );
  }, [handleArticleClick, getAuthorName]);

  const renderThumbnail = useCallback((article: NewsArticle, index: number): JSX.Element => {
    const imageUrl = getImageUrl(article.image_url || '');
    const uniqueKey = article.news_id 
      ? `thumb-${article.news_id}-${index}` 
      : `thumb-fallback-${article.slug || index}-${article.published_at}-${index}`;
    
    return (
      <div key={uniqueKey} className="card-thumbnail" onClick={() => handleArticleClick(article)}>
        <div className="thumb-image">
          {imageUrl ? (
            <img src={imageUrl} alt={article.title} loading="lazy" />
          ) : (
            <div className="image-placeholder" style={{ fontSize: '0.8rem' }}>📰</div>
          )}
        </div>
        <div className="thumb-content">
          <div className="thumb-title">{article.title}</div>
          <div className="thumb-meta">{formatDate(article.published_at)}</div>
        </div>
      </div>
    );
  }, [handleArticleClick]);

  const allNewsItems = [
    ...breakingNews,
    ...featuredNews,
    ...politicsNews,
    ...countiesNews,
    ...opinionNews,
    ...businessNews,
    ...sportsNews,
    ...technologyNews,
  ];

  if (showGallery) {
    return <Gallery allNews={allNewsItems as any} onArticleClick={handleArticleClick} />;
  }

  return (
    <div className="news-homepage">
      <div className={`header-wrapper ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <Header currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      </div>
      <Horizontal activeCategory="home" />

      <main className="main-container">
        <section className="hero-section">
          <div className="hero-slider-col">
            <HeroSlider
              slides={sliderSlides}
              onSlideClick={handleArticleClick}
              formatDate={formatDate}
              formatNumber={formatNumber}
              getImageUrl={getImageUrl}
            />
          </div>

          <div className="headlines-sidebar desktop-only">
            <h3 className="headlines-title">Top Headlines</h3>
            
            <div 
              className="headlines-carousel"
              onMouseEnter={() => setIsHeadlinePaused(true)}
              onMouseLeave={() => setIsHeadlinePaused(false)}
            >
              {headlines.slice(0, 6).map((headline, index) => {
                const headlineKey = headline.news_id 
                  ? `headline-${headline.news_id}-${index}` 
                  : `headline-fallback-${headline.slug || index}-${index}`;
                
                return (
                  <div 
                    key={headlineKey} 
                    className={`headline-carousel-item ${index === currentHeadlineIndex ? 'active' : ''}`}
                    onClick={() => handleArticleClick(headline)}
                  >
                    <div className="headline-carousel-image">
                      {headline.image_url ? (
                        <img src={getImageUrl(headline.image_url)} alt={headline.title} loading="lazy" />
                      ) : (
                        <div className="image-placeholder">📰</div>
                      )}
                    </div>
                    <div className="headline-carousel-content">
                      <div className="headline-carousel-number">{index + 1}</div>
                      <div className="headline-carousel-text">
                        <div className="headline-carousel-title">{headline.title}</div>
                        <div className="headline-carousel-meta">
                          {headline.category_name} • {formatDate(headline.published_at)}
                        </div>
                      </div>
                    </div>
                    <div className="carousel-progress">
                      <div className="carousel-progress-bar"></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="headlines-list">
              {headlines.slice(0, 6).map((headline, index) => {
                const headlineKey = headline.news_id 
                  ? `headline-list-${headline.news_id}-${index}` 
                  : `headline-list-fallback-${headline.slug || index}-${index}`;
                
                return (
                  <div key={headlineKey} className="headline-item" onClick={() => handleArticleClick(headline)}>
                    <div className="headline-number">{index + 1}</div>
                    <div className="headline-content">
                      <div className="headline-link">{headline.title}</div>
                      <div className="headline-meta">
                        {headline.category_name} • {formatDate(headline.published_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="headlines-ad-space">
              <div className="ad-placeholder">
                <div className="ad-label">Advertisement</div>
                <div className="ad-content">300x250</div>
              </div>
            </div>
          </div>
        </section>

        <div className="ad-youtube-grid-container">
          <div className="ad-youtube-grid">
            <div className="ad-cell">
              <div className="ad-cell-content">
                <span className="ad-cell-label">Own Space</span>
              </div>
            </div>
            <div className="ad-cell ad-cell-youtube">
              <div className="ad-cell-content youtube-cell">
                <span className="youtube-icon">▶️</span>
                <span className="youtube-label">YouTube</span>
              </div>
            </div>
            <div className="ad-cell">
              <div className="ad-cell-content">
                <span className="ad-cell-label">Own Space</span>
              </div>
            </div>
            <div className="ad-cell ad-cell-youtube">
              <div className="ad-cell-content youtube-cell">
                <span className="youtube-icon">▶️</span>
                <span className="youtube-label">YouTube</span>
              </div>
            </div>
            <div className="ad-cell desktop-only">
              <div className="ad-cell-content">
                <span className="ad-cell-label">Own Space</span>
              </div>
            </div>
            <div className="ad-cell ad-cell-youtube desktop-only">
              <div className="ad-cell-content youtube-cell">
                <span className="youtube-icon">▶️</span>
                <span className="youtube-label">YouTube</span>
              </div>
            </div>
          </div>
        </div>

        {trendingNews.length > 0 && (
          <div className="trending-ribbon-container">
            <SmallRibbon 
              articles={trendingNews}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}

        <div className="main-content-wrapper">
          <div className="content-sections">
            {recentFeatured.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-featured">
                  <h2 className="section-title">
                    <span className="section-icon">⭐</span>
                    Featured
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/featured')}>
                    View All →
                  </button>
                </div>
                <div className="grid-4col">
                  {recentFeatured.slice(0, 1).map((article, idx) => renderCard(article, 'large', idx, 'featured'))}
                  {recentFeatured.slice(1, 3).map((article, idx) => renderCard(article, 'medium', idx, 'featured'))}
                  {recentFeatured.slice(3, 7).map((article, idx) => renderCard(article, 'small', idx, 'featured'))}
                </div>
              </section>
            )}

            {breakingNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <span className="section-icon">🔥</span>
                    Breaking News
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/breaking')}>
                    View All →
                  </button>
                </div>
                <div className="grid-6col">
                  {breakingNews.slice(0, 2).map((article, idx) => renderCard(article, 'large', idx, 'breaking'))}
                  {breakingNews.slice(2, 6).map((article, idx) => renderCard(article, 'medium', idx, 'breaking'))}
                  {breakingNews.slice(6, 12).map((article, idx) => renderCard(article, 'small', idx, 'breaking'))}
                </div>
              </section>
            )}

            {politicsNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-politics">
                  <h2 className="section-title">
                    <span className="section-icon">🏛️</span>
                    Politics
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/politics')}>
                    View All →
                  </button>
                </div>
                <div className="grid-6col">
                  {politicsNews.slice(0, 1).map((article, idx) => renderCard(article, 'large', idx, 'politics'))}
                  {politicsNews.slice(1, 4).map((article, idx) => renderCard(article, 'medium', idx, 'politics'))}
                  {politicsNews.slice(4, 10).map((article, idx) => renderCard(article, 'small', idx, 'politics'))}
                </div>
              </section>
            )}

            {businessNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-business">
                  <h2 className="section-title">
                    <span className="section-icon">💼</span>
                    Business
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/business')}>
                    View All →
                  </button>
                </div>
                <div className="grid-3col">
                  {businessNews.slice(0, 2).map((article, idx) => renderCard(article, 'medium', idx, 'business'))}
                  {businessNews.slice(2, 5).map((article, idx) => renderCard(article, 'small', idx, 'business'))}
                </div>
              </section>
            )}

            {countiesNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-global">
                  <h2 className="section-title">
                    <span className="section-icon">🌍</span>
                    Global
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/global')}>
                    View All →
                  </button>
                </div>
                <div className="grid-4col">
                  {countiesNews.slice(0, 1).map((article, idx) => renderCard(article, 'large', idx, 'global'))}
                  {countiesNews.slice(1, 3).map((article, idx) => renderCard(article, 'medium', idx, 'global'))}
                  {countiesNews.slice(3, 7).map((article, idx) => renderCard(article, 'small', idx, 'global'))}
                </div>
              </section>
            )}

            {opinionNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-vybe">
                  <h2 className="section-title">
                    <span className="section-icon">✨</span>
                    Vybe
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/vybe')}>
                    View All →
                  </button>
                </div>
                <div className="grid-4col">
                  {opinionNews.slice(0, 1).map((article, idx) => renderCard(article, 'large', idx, 'vybe'))}
                  {opinionNews.slice(1, 3).map((article, idx) => renderCard(article, 'medium', idx, 'vybe'))}
                  {opinionNews.slice(3, 7).map((article, idx) => renderCard(article, 'small', idx, 'vybe'))}
                </div>
              </section>
            )}

            {sportsNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-sports">
                  <h2 className="section-title">
                    <span className="section-icon">⚽</span>
                    Sports
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/sports')}>
                    View All →
                  </button>
                </div>
                <div className="grid-3col">
                  {sportsNews.slice(0, 2).map((article, idx) => renderCard(article, 'medium', idx, 'sports'))}
                  {sportsNews.slice(2, 5).map((article, idx) => renderCard(article, 'small', idx, 'sports'))}
                </div>
              </section>
            )}

            {technologyNews.length > 0 && (
              <section className="grid-section lazy-section">
                <div className="section-header section-header-tech">
                  <h2 className="section-title">
                    <span className="section-icon">💻</span>
                    Technology
                  </h2>
                  <button className="view-all-btn" onClick={() => router.push('/client/categories/technology')}>
                    View All →
                  </button>
                </div>
                <div className="grid-3col">
                  {technologyNews.slice(0, 2).map((article, idx) => renderCard(article, 'medium', idx, 'technology'))}
                  {technologyNews.slice(2, 5).map((article, idx) => renderCard(article, 'small', idx, 'technology'))}
                </div>
              </section>
            )}
          </div>

          <aside className="trending-sidebar desktop-only">
            <h3 className="trending-title">
              <span>🔥</span>
              Trending Now
            </h3>
            <div className="trending-list">
              {trendingNews.slice(0, 15).map((article, index) => renderThumbnail(article, index))}
            </div>
          </aside>
        </div>
      </main>

      <div className="mobile-fab-group mobile-only">
        <button 
          className={`mobile-fab mobile-fab-headlines ${showHeadlines ? 'active' : ''}`}
          onClick={() => {
            closeSidebar();
            setShowHeadlines(!showHeadlines);
          }}
          title="Headlines"
        >
          H
        </button>
        <button 
          className={`mobile-fab mobile-fab-trending ${showTrending ? 'active' : ''}`}
          onClick={() => {
            closeSidebar();
            setShowTrending(!showTrending);
          }}
          title="Trending"
        >
          T
        </button>
        <button 
          className={`mobile-fab mobile-fab-categories ${showCategories ? 'active' : ''}`}
          onClick={() => {
            closeSidebar();
            setShowCategories(!showCategories);
          }}
          title="Categories"
        >
          C
        </button>
        <button 
          className="mobile-fab mobile-fab-gallery"
          onClick={() => setShowGallery(true)}
          title="Gallery"
        >
          G
        </button>
        <button 
          className={`mobile-fab mobile-fab-footer ${showFooter ? 'active' : ''}`}
          onClick={() => {
            closeSidebar();
            setShowFooter(!showFooter);
          }}
          title="Footer Menu"
        >
          F
        </button>
      </div>

      {showHeadlines && (
        <>
          <div className="mobile-sidebar-overlay" onClick={closeSidebar} />
          <div className="mobile-sidebar mobile-sidebar-headlines slide-in-right">
            <div className="mobile-sidebar-header">
              <h3>Top Headlines</h3>
              <button className="mobile-sidebar-close" onClick={closeSidebar}>→</button>
            </div>
            <div className="mobile-sidebar-content">
              {headlines.slice(0, 10).map((headline, index) => {
                const key = headline.news_id ? `mobile-headline-${headline.news_id}` : `mobile-headline-${index}`;
                return (
                  <div 
                    key={key}
                    className="mobile-headline-item"
                    onClick={() => {
                      handleArticleClick(headline);
                      closeSidebar();
                    }}
                  >
                    <div className="mobile-headline-number">{index + 1}</div>
                    <div className="mobile-headline-content">
                      <div className="mobile-headline-title">{headline.title}</div>
                      <div className="mobile-headline-meta">
                        {headline.category_name} • {formatDate(headline.published_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showTrending && (
        <>
          <div className="mobile-sidebar-overlay" onClick={closeSidebar} />
          <div className="mobile-sidebar mobile-sidebar-trending slide-in-right">
            <div className="mobile-sidebar-header">
              <h3>Trending Now</h3>
              <button className="mobile-sidebar-close" onClick={closeSidebar}>→</button>
            </div>
            <div className="mobile-sidebar-content">
              {trendingNews.slice(0, 15).map((article, index) => {
                const key = article.news_id ? `mobile-trending-${article.news_id}` : `mobile-trending-${index}`;
                return (
                  <div 
                    key={key}
                    className="mobile-trending-item"
                    onClick={() => {
                      handleArticleClick(article);
                      closeSidebar();
                    }}
                  >
                    <div className="mobile-trending-thumb">
                      {article.image_url ? (
                        <img src={getImageUrl(article.image_url)} alt={article.title} loading="lazy" />
                      ) : (
                        <div className="image-placeholder">📰</div>
                      )}
                    </div>
                    <div className="mobile-trending-content">
                      <div className="mobile-trending-title">{article.title}</div>
                      <div className="mobile-trending-meta">
                        {formatDate(article.published_at)} • 👁 {formatNumber(article.views)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showCategories && (
        <>
          <div className="mobile-sidebar-overlay" onClick={closeSidebar} />
          <div className="mobile-sidebar mobile-sidebar-categories slide-in-right">
            <div className="mobile-sidebar-header">
              <h3>Categories</h3>
              <button className="mobile-sidebar-close" onClick={closeSidebar}>→</button>
            </div>
            <div className="mobile-sidebar-content">
              {HORIZONTAL_CATEGORIES.map((category) => (
                <button
                  key={category.slug}
                  className="mobile-category-btn"
                  onClick={() => {
                    router.push(`/client/categories/${category.slug}`);
                    closeSidebar();
                  }}
                >
                  <span className="mobile-category-icon">{category.icon}</span>
                  <span className="mobile-category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showFooter && (
        <>
          <div className="mobile-sidebar-overlay" onClick={closeSidebar} />
          <div className="mobile-sidebar mobile-sidebar-footer slide-in-right">
            <div className="mobile-sidebar-header">
              <h3>Menu</h3>
              <button className="mobile-sidebar-close" onClick={closeSidebar}>→</button>
            </div>
            <div className="mobile-sidebar-content">
              {FOOTER_ITEMS.map((item) => (
                <button
                  key={item.name}
                  className="mobile-footer-item"
                  onClick={closeSidebar}
                >
                  <span className="mobile-footer-icon">{item.icon}</span>
                  <span className="mobile-footer-name">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}