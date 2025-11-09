// src/components/client/pages/CategoryPageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber, getImageUrl, getCategoryColor, getCategoryIcon } from '../../../lib/clientData';
import Ribbon from '../components/Ribbon';
import Header from '../components/Header';
import Horizontal from '../components/Horizontal';
import Footer from '../components/Footer';
import Gallery from '../components/Gallery';

interface CategoryPageClientProps {
  initialData: {
    category: any;
    news: any[];
    pagination: {
      current_page: number;
      per_page: number;
      total_news: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
  slug: string;
}

const GROUP_SLUGS = ['live-world', 'counties', 'politics', 'business', 'opinion', 'sports', 'lifestyle', 'entertainment', 'tech'];

export default function CategoryPageClient({ initialData, slug }: CategoryPageClientProps) {
  const router = useRouter();
  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [categoryData, setCategoryData] = useState(initialData);
  const { category, news, pagination } = categoryData;

  const isGroup = GROUP_SLUGS.includes(slug);

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vybes-theme', theme);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vybes-theme') || 'white';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
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

  const handleArticleClick = (article: any) => {
    router.push(`/client/articles/${article.slug}`);
  };

  const handleLoadMore = async () => {
    if (!pagination.has_next || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = pagination.current_page + 1;
      const apiUrl = isGroup 
        ? `/api/client/category-group?group=${slug}&page=${nextPage}&limit=20`
        : `/api/client/category?slug=${slug}&type=news&page=${nextPage}&limit=20`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const newData = await response.json();
        setCategoryData(prev => ({
          ...newData,
          news: [...prev.news, ...newData.news],
        }));
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getExcerpt = (article: any) => {
    if (article.excerpt) return article.excerpt;
    if (article.content) {
      const plainText = article.content.replace(/<[^>]+>/g, '').trim();
      return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
    return '';
  };

  const config = {
    color: getCategoryColor(slug),
    icon: getCategoryIcon(slug),
    name: category?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
  };

  const olderNews = news.slice(Math.max(0, news.length - 10));
  const trendingNews = news.slice(0, 8);
  const ribbonNews = news.slice(0, 15);

  if (showGallery) {
    return <Gallery allNews={news} onArticleClick={handleArticleClick} />;
  }

  return (
    <div className="category-page">
      <div className={`header-wrapper ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <Header currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      </div>
      <Horizontal activeCategory={slug} />

      {news.length > 0 && (
        <Ribbon 
          news={ribbonNews} 
          onArticleClick={handleArticleClick}
          title={`Trending in ${config.name}`}
        />
      )}

      <main className="main-container">
        {news.length > 0 ? (
          <div className="category-page-layout">
            <aside className="category-left-sidebar">
              <h3 className="sidebar-title">Older Stories</h3>
              <div className="sidebar-article-list">
                {olderNews.map((article: any) => (
                  <div key={article.news_id} className="sidebar-article-item" onClick={() => handleArticleClick(article)}>
                    <div className="sidebar-thumbnail">
                      {article.image_url ? (
                        <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                      ) : (
                        <div className="image-placeholder" style={{ fontSize: '1rem' }}>{config.icon}</div>
                      )}
                    </div>
                    <div className="sidebar-article-content">
                      <div className="sidebar-article-title">{article.title}</div>
                      <div className="sidebar-article-meta">
                        <span>{formatDate(article.published_at)}</span>
                        <span>•</span>
                        <span>{formatNumber(article.views)} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="category-center-content">
              {news[0] && (
                <div className="category-hero" onClick={() => handleArticleClick(news[0])}>
                  <div className="category-hero-grid">
                    <div className="category-hero-image">
                      {news[0].image_url ? (
                        <img src={getImageUrl(news[0].image_url) || ''} alt={news[0].title} />
                      ) : (
                        <div className="image-placeholder" style={{ background: config.color, color: 'white', fontSize: '4rem' }}>
                          {config.icon}
                        </div>
                      )}
                    </div>
                    <div className="category-hero-content">
                      <div className="featured-badge" style={{ background: config.color }}>Featured</div>
                      <h2 className="category-hero-title">{news[0].title}</h2>
                      {getExcerpt(news[0]) && (
                        <p className="category-hero-excerpt">{getExcerpt(news[0])}</p>
                      )}
                      <div className="category-hero-meta">
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            By {news[0].first_name} {news[0].last_name}
                          </div>
                          <div>{formatDate(news[0].published_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>{formatNumber(news[0].likes_count)} likes</div>
                          <div>{formatNumber(news[0].views)} views</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="category-main-grid">
                {news.slice(1).map((article: any) => (
                  <article key={article.news_id} className="category-page-card" onClick={() => handleArticleClick(article)}>
                    <div className="article-card-image">
                      {article.image_url ? (
                        <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                      ) : (
                        <div className="image-placeholder" style={{ color: config.color, fontSize: '3rem' }}>
                          {config.icon}
                        </div>
                      )}
                    </div>
                    <div className="article-card-content">
                      <h3 className="article-card-title">{article.title}</h3>
                      {getExcerpt(article) && (
                        <p className="article-excerpt">{getExcerpt(article)}</p>
                      )}
                      <div className="article-meta">
                        <div className="article-author">
                          By {article.first_name} {article.last_name}
                        </div>
                        <div className="article-date">{formatDate(article.published_at)}</div>
                        <div className="article-stats">
                          <span>{formatNumber(article.likes_count)} likes</span>
                          <span>•</span>
                          <span>{formatNumber(article.views)} views</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pagination.has_next && (
                <div className="load-more-section">
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="load-more-btn"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More Articles'}
                  </button>
                </div>
              )}
            </div>

            <aside className="category-right-sidebar">
              <h3 className="sidebar-title">Trending Now</h3>
              <div className="sidebar-article-list">
                {trendingNews.map((article: any, index: number) => (
                  <div key={article.news_id} className="sidebar-article-item" onClick={() => handleArticleClick(article)}>
                    <div className="sidebar-thumbnail">
                      {article.image_url ? (
                        <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                      ) : (
                        <div className="image-placeholder" style={{ fontSize: '1rem' }}>{config.icon}</div>
                      )}
                    </div>
                    <div className="sidebar-article-content">
                      <div className="sidebar-article-title">{article.title}</div>
                      <div className="sidebar-article-meta">
                        <span>#{index + 1} Trending</span>
                        <span>•</span>
                        <span>{formatNumber(article.views)} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)', color: config.color }}>
              {config.icon}
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>
              No articles found
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 var(--spacing-2xl) 0' }}>
              There are currently no articles in the {config.name} category.
            </p>
            <button 
              onClick={() => router.push('/client')} 
              className="load-more-btn"
            >
              Browse Other Categories
            </button>
          </div>
        )}
      </main>

      <button className="sidebar-hamburger hamburger-left" onClick={() => setShowLeftSidebar(true)}>
        📚
      </button>

      <button className="sidebar-hamburger hamburger-right" onClick={() => setShowRightSidebar(true)}>
        🔥
      </button>

      {showLeftSidebar && (
        <>
          <div className="mobile-sidebar-overlay active" onClick={() => setShowLeftSidebar(false)} />
          <div className="mobile-sidebar-drawer left">
            <button className="mobile-sidebar-close" onClick={() => setShowLeftSidebar(false)}>×</button>
            <h3 className="sidebar-title">Older Stories</h3>
            <div className="sidebar-article-list">
              {olderNews.map((article: any) => (
                <div key={article.news_id} className="sidebar-article-item" onClick={() => { handleArticleClick(article); setShowLeftSidebar(false); }}>
                  <div className="sidebar-thumbnail">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder" style={{ fontSize: '1rem' }}>{config.icon}</div>
                    )}
                  </div>
                  <div className="sidebar-article-content">
                    <div className="sidebar-article-title">{article.title}</div>
                    <div className="sidebar-article-meta">
                      <span>{formatDate(article.published_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showRightSidebar && (
        <>
          <div className="mobile-sidebar-overlay active" onClick={() => setShowRightSidebar(false)} />
          <div className="mobile-sidebar-drawer right">
            <button className="mobile-sidebar-close" onClick={() => setShowRightSidebar(false)}>×</button>
            <h3 className="sidebar-title">Trending Now</h3>
            <div className="sidebar-article-list">
              {trendingNews.map((article: any, index: number) => (
                <div key={article.news_id} className="sidebar-article-item" onClick={() => { handleArticleClick(article); setShowRightSidebar(false); }}>
                  <div className="sidebar-thumbnail">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder" style={{ fontSize: '1rem' }}>{config.icon}</div>
                    )}
                  </div>
                  <div className="sidebar-article-content">
                    <div className="sidebar-article-title">{article.title}</div>
                    <div className="sidebar-article-meta">
                      <span>#{index + 1} Trending</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button className="stories-btn" onClick={() => setShowGallery(true)} title="View Gallery">
        <div className="stories-icon">📸</div>
        <div className="stories-text">Stories</div>
      </button>

      <Footer />
    </div>
  );
}