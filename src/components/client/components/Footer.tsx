// src/components/client/components/Footer.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCategoryFooter } from '../hooks/useCategoryFooter';
import { useCookies } from '../hooks/useCookies';
import CookieBanner from './CookieBanner';

const categoryIcons: { [key: string]: string } = {
  'Live & World': '🌍',
  'Counties': '🏢',
  'Business': '💼',
  'Opinion': '💭',
  'Sports': '⚽',
  'Life & Style': '🎭',
  'Entertainment': '🎉',
  'Technology': '💻',
  'Politics': '🏛️',
};

const GROUP_TO_CATEGORY_MAP: { [key: string]: string } = {
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

interface Article {
  slug: string;
  image_url?: string;
  views?: number;
  title?: string;
}

export default function Footer() {
  const router = useRouter();
  const { groups, isLoading, error } = useCategoryFooter();
  const { showBanner, openManageModal } = useCookies();
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subCategoryImages, setSubCategoryImages] = useState<{ [key: string]: Article[] }>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const topAdsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const bottomAdsRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!groups.length || imagesLoaded) return;

    const loadImages = async () => {
      const imagePromises = groups.flatMap(group =>
        group.categories.map(async (category) => {
          try {
            const response = await fetch(
              `/api/client/category?slug=${category.slug}&type=news&limit=12`,
              { credentials: 'include' }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.news) {
                return {
                  slug: category.slug,
                  articles: data.news.filter((article: Article) => article.image_url).slice(0, 12)
                };
              }
            }
          } catch (error) {
            console.error(`Failed to fetch images for ${category.slug}:`, error);
          }
          return null;
        })
      );

      const results = await Promise.all(imagePromises);
      const imagesMap: { [key: string]: Article[] } = {};
      
      results.forEach(result => {
        if (result) {
          imagesMap[result.slug] = result.articles;
        }
      });

      setSubCategoryImages(imagesMap);
      setImagesLoaded(true);
    };

    const timer = setTimeout(loadImages, 500);
    return () => clearTimeout(timer);
  }, [groups, imagesLoaded]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id));
          }
        });
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const refs = [topAdsRef.current, categoriesRef.current, bottomAdsRef.current, brandRef.current];
    refs.forEach(ref => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });
  }, [groups]);

  useEffect(() => {
    const timer = setTimeout(() => setShowCookieSettings(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSubCategoryClick = useCallback((slug: string) => {
    setMobileMenuOpen(false);
    router.push(`/client/sub-categories/${slug}`);
  }, [router]);

  const handleCategoryGroupClick = useCallback((groupTitle: string) => {
    const categorySlug = GROUP_TO_CATEGORY_MAP[groupTitle];
    if (categorySlug) {
      setMobileMenuOpen(false);
      router.push(`/client/categories/${categorySlug}`);
    }
  }, [router]);

  const handleArticleClick = useCallback((slug: string) => {
    router.push(`/client/articles/${slug}`);
  }, [router]);

  const getIconForGroup = useCallback((title: string): string => {
    return categoryIcons[title] || '📰';
  }, []);

  const { topArticles, bottomArticles } = useMemo(() => {
    const allArticles = Object.values(subCategoryImages).flat();
    return {
      topArticles: [...allArticles, ...allArticles],
      bottomArticles: [...allArticles, ...allArticles]
    };
  }, [subCategoryImages]);

  if (isLoading) {
    return (
      <footer className="comprehensive-footer">
        <div className="footer-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </footer>
    );
  }

  return (
    <>
      <footer className="comprehensive-footer">
        {error && (
          <div className="footer-error">
            <p>⚠️ {error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry
            </button>
          </div>
        )}

        <div 
          id="top-ads-section" 
          ref={topAdsRef}
          className="footer-top-ads"
        >
          <div className="top-ads-marquee">
            {visibleSections.has('top-ads-section') && topArticles.length > 0 ? (
              topArticles.map((article, index) => (
                <div
                  key={`top-${article.slug}-${index}`}
                  className="top-ad-slot"
                  onClick={() => handleArticleClick(article.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(article.slug)}
                  style={{ 
                    backgroundImage: article.image_url ? `url(${article.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label={`View article: ${article.title || 'Untitled'}`}
                >
                  <div className="article-overlay">
                    <span className="article-views">👁️ {article.views || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={`top-placeholder-${i}`} className="top-ad-slot">
                  <span>Loading...</span>
                </div>
              ))
            )}
          </div>
        </div>

        {groups.length > 0 && (
          <div 
            id="categories-section"
            ref={categoriesRef}
            className="footer-categories-section"
          >
            <div className="footer-mega-grid">
              {visibleSections.has('categories-section') && groups.map((group, idx) => (
                <div key={`${group.title}-${idx}`} className="footer-section">
                  <div 
                    className="footer-section-header clickable"
                    onClick={() => handleCategoryGroupClick(group.title)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryGroupClick(group.title)}
                    aria-label={`Navigate to ${group.title} category`}
                  >
                    <span className="footer-icon" aria-hidden="true">
                      {getIconForGroup(group.title)}
                    </span>
                    <h3 className="footer-section-title">{group.title}</h3>
                    <span className="main-category-indicator" aria-hidden="true">→</span>
                  </div>
                  
                  <ul className="footer-links-list">
                    {group.categories.map((category) => (
                      <li key={category.category_id}>
                        <button
                          onClick={() => handleSubCategoryClick(category.slug)}
                          className="footer-link-item"
                          aria-label={`Navigate to ${category.name} sub-category`}
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div 
          id="bottom-ads-section"
          ref={bottomAdsRef}
          className="footer-bottom-ads"
        >
          <div className="bottom-ads-marquee">
            {visibleSections.has('bottom-ads-section') && bottomArticles.length > 0 ? (
              bottomArticles.map((article, index) => (
                <div
                  key={`bottom-${article.slug}-${index}`}
                  className="bottom-ad-slot"
                  onClick={() => handleArticleClick(article.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(article.slug)}
                  style={{ 
                    backgroundImage: article.image_url ? `url(${article.image_url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  aria-label={`View article: ${article.title || 'Untitled'}`}
                >
                  <div className="article-overlay">
                    <span className="article-views">👁️ {article.views || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={`bottom-placeholder-${i}`} className="bottom-ad-slot">
                  <span>Loading...</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div 
          id="brand-section"
          ref={brandRef}
          className="footer-brand-section"
        >
          <div className="footer-brand">
            <h2 className="footer-brand-title">Daily Vaibe</h2>
            <p className="footer-brand-tagline">Catch Up with the Latest on Vaiba</p>
            <div className="footer-socials" role="list" aria-label="Social media links">
              <a href="https://facebook.com" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">📘</a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">🦅</a>
              <a href="https://instagram.com" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">📷</a>
              <a href="https://linkedin.com" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">💼</a>
              <a href="https://youtube.com" className="social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">📺</a>
            </div>
          </div>

          <div className="footer-newsletter">
            <h4 className="newsletter-title">Stay Informed</h4>
            <p className="newsletter-description">
              Get daily breaking news and exclusive stories from across Africa.
            </p>
            <form 
              className="newsletter-form" 
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <input 
                type="email" 
                placeholder="Your email address" 
                className="newsletter-input"
                required
                aria-label="Email address for newsletter"
              />
              <button type="submit" className="newsletter-submit">Subscribe</button>
            </form>
          </div>

          <div className="footer-apps">
            <h4 className="apps-title">Download Our App</h4>
            <div className="app-badges" role="list" aria-label="App download links">
              <a href="#" className="app-badge" aria-label="Download iOS App">
                <span aria-hidden="true">📱</span>
                <span>iOS App</span>
              </a>
              <a href="#" className="app-badge" aria-label="Download Android App">
                <span aria-hidden="true">🤖</span>
                <span>Android App</span>
              </a>
              <a href="#" className="app-badge" aria-label="Access Web Version">
                <span aria-hidden="true">💻</span>
                <span>Web Version</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <nav className="footer-legal-links" aria-label="Legal and site links">
            <button onClick={() => router.push('/privacy')} className="legal-link">Privacy Policy</button>
            <span className="legal-separator" aria-hidden="true">•</span>
            <button onClick={() => router.push('/terms')} className="legal-link">Terms of Service</button>
            <span className="legal-separator" aria-hidden="true">•</span>
            <button onClick={() => router.push('/contact')} className="legal-link">Contact Us</button>
            <span className="legal-separator" aria-hidden="true">•</span>
            <button onClick={() => router.push('/about')} className="legal-link">About Us</button>
            <span className="legal-separator" aria-hidden="true">•</span>
            <button onClick={() => router.push('/careers')} className="legal-link">Careers</button>
            {!showBanner && (
              <>
                <span className="legal-separator" aria-hidden="true">•</span>
                <button onClick={openManageModal} className="legal-link">Cookie Settings</button>
              </>
            )}
          </nav>
          
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} Daily Vaibe.</p>
            <p className="made-in-africa">For Africa🌍 with ❤</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="footer-mobile-menu-trigger"
          aria-label="Open Categories Menu"
          aria-expanded={mobileMenuOpen}
        >
          📂
        </button>

        {showCookieSettings && showBanner && (
          <button 
            onClick={openManageModal}
            className="cookie-settings-trigger"
            title="Manage Cookie Preferences"
            aria-label="Manage Cookie Preferences"
          >
            🍪
          </button>
        )}
      </footer>

      {mobileMenuOpen && (
        <>
          <div 
            className="footer-mobile-menu-overlay active"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav 
            className="footer-mobile-menu active"
            role="navigation"
            aria-label="Mobile categories menu"
          >
            <div className="footer-mobile-menu-header">
              <h2 className="footer-mobile-menu-title">📂 Categories</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="footer-mobile-menu-close"
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>
            
            <div className="footer-mobile-menu-grid">
              {groups.map((group, idx) => (
                <div key={`mobile-${group.title}-${idx}`} className="footer-mobile-section">
                  <div 
                    className="footer-mobile-section-header"
                    onClick={() => handleCategoryGroupClick(group.title)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleCategoryGroupClick(group.title)}
                  >
                    <span className="footer-mobile-icon" aria-hidden="true">
                      {getIconForGroup(group.title)}
                    </span>
                    <h3 className="footer-mobile-section-title">{group.title}</h3>
                    <span className="main-category-indicator" aria-hidden="true">→</span>
                  </div>
                  
                  <ul className="footer-mobile-links-list">
                    {group.categories.slice(0, 8).map((category) => (
                      <li key={category.category_id}>
                        <button
                          onClick={() => handleSubCategoryClick(category.slug)}
                          className="footer-mobile-link-item"
                        >
                          {category.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </>
      )}

      <CookieBanner />

      <style jsx>{`
        .article-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          padding: 8px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .article-views {
          color: white;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .top-ad-slot,
        .bottom-ad-slot {
          position: relative;
        }

        .footer-error {
          padding: 20px;
          text-align: center;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          margin: 15px;
        }

        .footer-error p {
          color: #c00;
          margin: 0 0 10px 0;
          font-weight: 600;
        }

        .retry-button {
          padding: 8px 16px;
          background: #c00;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .retry-button:hover {
          background: #a00;
        }

        .main-category-indicator {
          margin-left: auto;
          opacity: 0.7;
          font-size: 1.2em;
        }

        .footer-section-header.clickable:hover .main-category-indicator {
          opacity: 1;
          transform: translateX(4px);
          transition: all 0.2s ease;
        }
      `}</style>
    </>
  );
}