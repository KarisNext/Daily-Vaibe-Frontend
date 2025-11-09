'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatNumber, getImageUrl } from '../../../lib/clientData';
import { useArticle } from '../hooks/useArticle';
import Gallery from '../components/Gallery';
import Ribbon from '../components/Ribbon';
import Header from '../components/Header';
import Horizontal from '../components/Horizontal';
import Footer from '../components/Footer';

interface ArticleImage {
  url: string;
  caption?: string;
  position: number; // Position in article flow
}

interface SocialVideo {
  platform: 'facebook' | 'twitter' | 'youtube';
  url: string;
  position: number;
}

interface ArticlePageClientProps {
  initialData: any;
}

export default function ArticlePageClient({ initialData }: ArticlePageClientProps) {
  const router = useRouter();
  const { trackView, trackLike } = useArticle();
  const [showGallery, setShowGallery] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('white');
  const [likeCount, setLikeCount] = useState(initialData.article.likes_count);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { article, related_articles } = initialData;

  // Parse additional images and videos from article metadata
  const additionalImages: ArticleImage[] = article.additional_images || [];
  const socialVideos: SocialVideo[] = article.social_videos || [];

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

  useEffect(() => {
    if (article?.slug && !hasTrackedView) {
      const timer = setTimeout(() => {
        trackView(article.slug);
        setHasTrackedView(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [article?.slug, hasTrackedView, trackView]);

  const handleRelatedClick = (relatedArticle: any) => {
    router.push(`/client/articles/${relatedArticle.slug}`);
  };

  const handleLikeClick = async () => {
    setLikeCount((prev: number) => prev + 1);
    await trackLike(article.slug);
  };

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = article.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
  };

  const extractVideoId = (url: string, platform: string): string | null => {
    try {
      if (platform === 'youtube') {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
      } else if (platform === 'facebook') {
        // Facebook video URL parsing
        const fbMatch = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
        return fbMatch ? fbMatch[1] : null;
      } else if (platform === 'twitter') {
        // Twitter video is embedded via full URL
        return url;
      }
    } catch (e) {
      console.error('Error extracting video ID:', e);
    }
    return null;
  };

  const renderSocialVideo = (video: SocialVideo) => {
    const videoId = extractVideoId(video.url, video.platform);
    
    if (!videoId) return null;

    return (
      <div className="social-video-embed" style={{ margin: '2rem 0', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
        {video.platform === 'youtube' && (
          <iframe
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        {video.platform === 'facebook' && (
          <iframe
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false`}
            allowFullScreen
          />
        )}
        {video.platform === 'twitter' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-secondary)' }}>
            <blockquote className="twitter-tweet" style={{ width: '100%' }}>
              <a href={videoId}>View Tweet</a>
            </blockquote>
          </div>
        )}
      </div>
    );
  };

  const renderArticleImage = (image: ArticleImage) => {
    return (
      <div className="article-inline-image" style={{ margin: '2rem 0' }}>
        <img 
          src={getImageUrl(image.url) || ''} 
          alt={image.caption || 'Article image'} 
          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
        />
        {image.caption && (
          <p style={{ 
            fontSize: '0.85rem', 
            color: 'var(--text-secondary)', 
            fontStyle: 'italic', 
            marginTop: '0.5rem', 
            textAlign: 'center' 
          }}>
            {image.caption}
          </p>
        )}
      </div>
    );
  };

  const renderArticleContent = (content: string) => {
    if (!content) return null;

    const paragraphs = content.split('\n').filter(p => p.trim());
    const contentElements: JSX.Element[] = [];
    
    paragraphs.forEach((paragraph, index) => {
      let processedParagraph = paragraph
        .replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, '<blockquote style="background: var(--background-secondary); border-left: 4px solid var(--primary-color); padding: 1.5rem; margin: 2rem 0; font-size: 1.05rem; font-style: italic; color: var(--text-secondary); border-radius: 4px;">$1</blockquote>')
        .replace(/\[HIGHLIGHT\](.*?)\[\/HIGHLIGHT\]/g, '<mark style="background: var(--primary-color); color: white; padding: 0.2rem 0.4rem; border-radius: 3px; font-weight: 600;">$1</mark>')
        .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong style="font-weight: 700; color: var(--text-primary);">$1</strong>')
        .replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, '<em style="font-style: italic;">$1</em>')
        .replace(/\[HEADING\](.*?)\[\/HEADING\]/g, '<h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 2rem 0 1rem; font-family: var(--font-heading);">$1</h3>');

      contentElements.push(
        <p key={`para-${index}`} style={{ fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: processedParagraph }} />
      );

      // Insert images at specific positions
      const imageAtPosition = additionalImages.find(img => img.position === index + 1);
      if (imageAtPosition) {
        contentElements.push(
          <div key={`img-${index}`}>
            {renderArticleImage(imageAtPosition)}
          </div>
        );
      }

      // Insert videos at specific positions
      const videoAtPosition = socialVideos.find(vid => vid.position === index + 1);
      if (videoAtPosition) {
        contentElements.push(
          <div key={`vid-${index}`}>
            {renderSocialVideo(videoAtPosition)}
          </div>
        );
      }

      // Insert ad placeholder every 4 paragraphs (Tuko style)
      if ((index + 1) % 4 === 0 && index < paragraphs.length - 1) {
        contentElements.push(
          <div key={`ad-${index}`} className="article-ad-slot" style={{
            background: 'var(--background-secondary)',
            padding: '2rem',
            margin: '2rem 0',
            borderRadius: '8px',
            textAlign: 'center',
            border: '2px dashed var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            📢 Advertisement Space
          </div>
        );
      }
    });

    return contentElements;
  };

  // Group related articles by category
  const categorizeRelatedArticles = () => {
    const categories: { [key: string]: any[] } = {};
    related_articles.forEach((article: any) => {
      const category = article.category_name || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      if (categories[category].length < 3) {
        categories[category].push(article);
      }
    });
    return categories;
  };

  const categorizedArticles = categorizeRelatedArticles();

  if (showGallery) {
    return <Gallery allNews={related_articles} onArticleClick={handleRelatedClick} />;
  }

  const trendingArticles = related_articles.slice(0, 12);

  return (
    <div>
      <div className={`header-wrapper ${isHeaderVisible ? 'visible' : 'hidden'}`}>
        <Header currentTheme={currentTheme} onThemeChange={handleThemeChange} />
      </div>
      <Horizontal activeCategory={article.category_slug} />

      <main className="main-container">
        <div className="article-page-layout">
          <div className="article-main-column">
            {article.image_url && (
              <div className="article-featured-image">
                <img src={getImageUrl(article.image_url) || ''} alt={article.title} />
              </div>
            )}

            <article className="article-content-wrapper">
              <div className="article-category-badge">
                {article.category_name}
              </div>

              <h1 className="article-title-main">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="article-excerpt-box">
                  {article.excerpt}
                </p>
              )}
              
              <div className="article-meta-bar">
                <span className="article-author-name">By {article.first_name} {article.last_name}</span>
                <span>{formatDate(article.published_at)}</span>
                <span>{formatNumber(article.views)} views</span>
                <button onClick={handleLikeClick} className="article-like-btn">
                  ❤️ {formatNumber(likeCount)}
                </button>
              </div>

              <div className="article-body-content">
                {renderArticleContent(article.content)}
              </div>

              <div className="article-social-share">
                <span className="share-label">Share:</span>
                <button className="share-btn facebook" onClick={() => handleShare('facebook')}>📘 Facebook</button>
                <button className="share-btn twitter" onClick={() => handleShare('twitter')}>🦜 Twitter</button>
                <button className="share-btn whatsapp" onClick={() => handleShare('whatsapp')}>💬 WhatsApp</button>
                <button className="share-btn linkedin" onClick={() => handleShare('linkedin')}>💼 LinkedIn</button>
              </div>
            </article>

            {/* Related Articles by Category - Tuko Style */}
            <section className="related-by-category" style={{ marginTop: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-primary)' }}>
                More Stories You'll Love
              </h2>
              
              {Object.entries(categorizedArticles).slice(0, 3).map(([category, articles], catIndex) => (
                <div key={category} style={{ marginBottom: '3rem' }}>
                  <h3 style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 600, 
                    marginBottom: '1.5rem', 
                    color: 'var(--primary-color)',
                    borderBottom: '2px solid var(--primary-color)',
                    paddingBottom: '0.5rem'
                  }}>
                    {category} ({articles.length})
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {articles.map((relatedArticle: any, index: number) => (
                      <div 
                        key={relatedArticle.news_id}
                        onClick={() => handleRelatedClick(relatedArticle)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '200px 1fr',
                          gap: '1rem',
                          padding: '1rem',
                          background: 'var(--background-secondary)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: index === 2 ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(5px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ width: '200px', height: '120px', borderRadius: '6px', overflow: 'hidden' }}>
                          {relatedArticle.image_url ? (
                            <img 
                              src={getImageUrl(relatedArticle.image_url) || ''} 
                              alt={relatedArticle.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              📰
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            {relatedArticle.title}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                            {relatedArticle.excerpt?.substring(0, 100)}...
                          </p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {formatDate(relatedArticle.published_at)} • {formatNumber(relatedArticle.views)} views
                          </div>
                          {index === 2 && (
                            <button style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem 1rem',
                              background: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}>
                              Read More
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Trending Marquee after each category section */}
                  {catIndex < 2 && (
                    <div style={{
                      background: 'var(--primary-color)',
                      color: 'white',
                      padding: '1rem',
                      margin: '2rem 0',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        animation: 'marquee 20s linear infinite',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ fontWeight: 700, marginRight: '2rem' }}>🔥 TRENDING NOW:</span>
                        {trendingArticles.slice(0, 5).map((trending: any) => (
                          <span 
                            key={trending.news_id} 
                            onClick={() => handleRelatedClick(trending)}
                            style={{ marginRight: '3rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {trending.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>

            {related_articles.length > 6 && (
              <section className="compact-news-gallery">
                <h3 className="compact-gallery-title">More From Our Network</h3>
                <div className="compact-gallery-grid">
                  {related_articles.slice(6, 18).map((story: any) => (
                    <div key={story.news_id} onClick={() => handleRelatedClick(story)} className="compact-gallery-item">
                      <div className="compact-gallery-image">
                        {story.image_url ? (
                          <img src={getImageUrl(story.image_url) || ''} alt={story.title} />
                        ) : (
                          <div className="image-placeholder" style={{ width: '100%', height: '100%' }}>📰</div>
                        )}
                      </div>
                      <div className="compact-gallery-overlay">
                        <div className="compact-gallery-category">{story.category_name}</div>
                        <div className="compact-gallery-title-text">{story.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="article-sidebar">
            <div className="recommended-box">
              <h3 className="section-title">Recommended</h3>
              {related_articles.slice(0, 6).map((recommended: any) => (
                <div key={recommended.news_id} onClick={() => handleRelatedClick(recommended)} className="recommended-item">
                  {recommended.image_url && (
                    <div className="recommended-thumbnail">
                      <img src={getImageUrl(recommended.image_url) || ''} alt={recommended.title} />
                    </div>
                  )}
                  <div className="recommended-content">
                    <h4 className="recommended-title">{recommended.title}</h4>
                    <div className="recommended-meta">{recommended.category_name} • {formatDate(recommended.published_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <Ribbon 
        news={trendingArticles} 
        onArticleClick={handleRelatedClick}
        title="You May Also Like"
      />

      <button className="stories-btn" onClick={() => setShowGallery(true)} title="View Gallery">
        <div className="stories-icon">📸</div>
        <div className="stories-text">Stories</div>
      </button>

      <Footer />

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}