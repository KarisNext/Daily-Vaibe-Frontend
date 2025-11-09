// src/components/client/pages/SubCategoryPageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber, getImageUrl, getCategoryColor, getCategoryIcon } from '../../../lib/clientData';
import Ribbon from '../components/Ribbon';
import Header from '../components/Header';
import Horizontal from '../components/Horizontal';
import Gallery from '../components/Gallery';

interface SubCategoryPageClientProps {
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

export default function SubCategoryPageClient({ initialData, slug }: SubCategoryPageClientProps) {
  const router = useRouter();
  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  
  const [categoryData, setCategoryData] = useState(initialData);
  const { category, news, pagination } = categoryData;

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
      const response = await fetch(`/api/client/category?slug=${slug}&page=${nextPage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const toggleExpand = (newsId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const getPreviewContent = (content: string, maxLength: number = 300) => {
    if (!content) return '';
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  const config = {
    color: getCategoryColor(slug),
    icon: getCategoryIcon(slug),
    name: category?.name || slug.charAt(0).toUpperCase() + slug.slice(1),
  };

  const recommendedNews = news.slice(0, 12);
  const ribbonNews = news.slice(0, 15);

  if (showGallery) {
    return <Gallery allNews={news} onArticleClick={handleArticleClick} />;
  }

  return (
    <div className="subcategory-page">
      <div className={`header-wrapper ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <Header currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      </div>
      <Horizontal activeCategory={slug} />

      {news.length > 0 && (
        <Ribbon 
          news={ribbonNews} 
          onArticleClick={handleArticleClick}
          title={`Latest in ${config.name}`}
        />
      )}

      <main className="main-container">
        {news.length > 0 ? (
          <div className="subcategory-layout">
            <aside className="subcategory-sidebar">
              <h3 className="sidebar-title-large">Recommended</h3>
              <div className="recommended-list">
                {recommendedNews.map((article: any) => (
                  <div key={article.news_id} className="recommended-card" onClick={() => handleArticleClick(article)}>
                    <div className="recommended-image">
                      {article.image_url ? (
                        <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                      ) : (
                        <div className="image-placeholder">{config.icon}</div>
                      )}
                    </div>
                    <div className="recommended-details">
                      <h4 className="recommended-title-text">{article.title}</h4>
                      <div className="recommended-meta-info">
                        <span className="author-info">By {article.first_name} {article.last_name}</span>
                        <span className="date-info">{formatDate(article.published_at)}</span>
                        <span className="views-info">{formatNumber(article.views)} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="subcategory-content">
              <div className="subcategory-grid">
                {news.map((article: any) => {
                  const isExpanded = expandedCards.has(article.news_id);
                  return (
                    <article key={article.news_id} className="subcategory-card">
                      <div className="subcategory-card-image" onClick={() => handleArticleClick(article)}>
                        {article.image_url ? (
                          <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                        ) : (
                          <div className="image-placeholder-large" style={{ color: config.color }}>
                            {config.icon}
                          </div>
                        )}
                      </div>
                      <div className="subcategory-card-body">
                        <h2 className="subcategory-card-title" onClick={() => handleArticleClick(article)}>
                          {article.title}
                        </h2>
                        {article.excerpt && (
                          <p className="subcategory-card-excerpt">{article.excerpt}</p>
                        )}
                        <div className={`subcategory-card-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          {isExpanded && article.content ? (
                            <div className="full-content">
                              {article.content.split('\n').map((paragraph: string, idx: number) => (
                                <p key={idx} dangerouslySetInnerHTML={{ __html: paragraph }} />
                              ))}
                            </div>
                          ) : (
                            <p className="preview-content">{getPreviewContent(article.content || article.excerpt || '')}</p>
                          )}
                        </div>
                        <button 
                          className="read-more-btn"
                          onClick={() => toggleExpand(article.news_id)}
                        >
                          {isExpanded ? 'Show Less' : 'Read More'}
                        </button>
                        <div className="subcategory-card-meta">
                          <div className="meta-left">
                            <span className="meta-author">By {article.first_name} {article.last_name}</span>
                            <span className="meta-date">{formatDate(article.published_at)}</span>
                          </div>
                          <div className="meta-right">
                            <span className="meta-likes">{formatNumber(article.likes_count)} likes</span>
                            <span className="meta-views">{formatNumber(article.views)} views</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
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
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)', color: config.color }}>
              {config.icon}
            </div>
            <h3>No articles found</h3>
            <p>There are currently no articles in the {config.name} category.</p>
            <button onClick={() => router.push('/client')} className="load-more-btn">
              Browse Other Categories
            </button>
          </div>
        )}
      </main>

      <button className="sidebar-hamburger" onClick={() => setShowSidebar(true)}>
        📚
      </button>

      {showSidebar && (
        <>
          <div className="mobile-sidebar-overlay active" onClick={() => setShowSidebar(false)} />
          <div className="mobile-sidebar-drawer">
            <button className="mobile-sidebar-close" onClick={() => setShowSidebar(false)}>×</button>
            <h3 className="sidebar-title-large">Recommended</h3>
            <div className="recommended-list">
              {recommendedNews.map((article: any) => (
                <div key={article.news_id} className="recommended-card" onClick={() => { handleArticleClick(article); setShowSidebar(false); }}>
                  <div className="recommended-image">
                    {article.image_url ? (
                      <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
                    ) : (
                      <div className="image-placeholder">{config.icon}</div>
                    )}
                  </div>
                  <div className="recommended-details">
                    <h4 className="recommended-title-text">{article.title}</h4>
                    <div className="recommended-meta-info">
                      <span className="author-info">By {article.first_name} {article.last_name}</span>
                      <span className="date-info">{formatDate(article.published_at)}</span>
                      <span className="views-info">{formatNumber(article.views)} views</span>
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
    </div>
  );
}