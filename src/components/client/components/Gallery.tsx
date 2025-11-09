'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NewsItem {
  news_id: string;
  title: string;
  image_url: string;
  category_name: string;
  category_slug?: string;
  first_name: string;
  last_name: string;
  published_at: string;
  views: number;
  likes_count?: number;
  excerpt?: string;
  content?: string;
}

interface GalleryProps {
  allNews: NewsItem[];
  onArticleClick?: (article: NewsItem) => void;
  currentTheme?: string;
}

const Gallery: React.FC<GalleryProps> = ({ 
  allNews = [], 
  onArticleClick,
  currentTheme = 'white'
}) => {
  const router = useRouter();
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const [filteredItems, setFilteredItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('masonry');
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [sortBy, setSortBy] = useState('recent');
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (galleryRef.current) {
      observer.observe(galleryRef.current);
    }

    return () => {
      if (galleryRef.current) {
        observer.unobserve(galleryRef.current);
      }
    };
  }, [isVisible]);

  // Filter and sort news items
  useEffect(() => {
    let filtered = allNews.filter(item => item.image_url && item.image_url.trim() !== '');
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.category_slug === selectedCategory || 
        item.category_name.toLowerCase() === selectedCategory
      );
    }
    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } else if (sortBy === 'views') {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'likes') {
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    }
    
    setFilteredItems(filtered.slice(0, itemsPerPage));
  }, [selectedCategory, sortBy, allNews, itemsPerPage]);

  const categories = [
    { slug: 'all', name: 'All Stories', icon: '🌍', color: 'var(--primary-color)' },
    { slug: 'politics', name: 'Politics', icon: '🏛️', color: '#dc2626' },
    { slug: 'counties', name: 'Counties', icon: '🏙️', color: '#059669' },
    { slug: 'opinion', name: 'Opinion', icon: '💭', color: '#7c3aed' },
    { slug: 'business', name: 'Business', icon: '💼', color: '#ea580c' },
    { slug: 'sports', name: 'Sports', icon: '⚽', color: '#0891b2' },
    { slug: 'technology', name: 'Technology', icon: '💻', color: '#6366f1' }
  ];

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `/${imageUrl.replace(/^\//, '')}`;
  };

  const getCategoryColor = (slug?: string) => {
    if (!slug) return 'var(--primary-color)';
    const category = categories.find(c => c.slug === slug.toLowerCase());
    return category?.color || 'var(--primary-color)';
  };

  const getTimeSince = (date: string) => {
    const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const getAgeInHours = (date: string) => {
    return Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
  };

  const getTierClass = (item: NewsItem) => {
    const age = getAgeInHours(item.published_at);
    if (age < 24) return 'tier-hero';
    if (age < 72) return 'tier-large';
    if (age < 168) return 'tier-medium';
    return 'tier-small';
  };

  const getExcerpt = (article: NewsItem) => {
    if (article.excerpt) return article.excerpt;
    if (article.content) {
      const plainText = article.content.replace(/<[^>]+>/g, '').trim();
      return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }
    return '';
  };

  const handleArticleClick = (article: NewsItem) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      router.push(`/client/articles/${article.news_id}`);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  };

  if (allNews.length === 0) {
    return (
      <div className="gallery-empty-state">
        <div className="empty-icon">📸</div>
        <h3>No Images Available</h3>
        <p>Check back later for new visual content.</p>
      </div>
    );
  }

  return (
    <div className="gallery-component" ref={galleryRef}>
      {/* Static Header */}
      <div className="gallery-header-section">
        <div className="gallery-header-content">
          <h2 className="gallery-main-title">📸 Visual Stories Gallery</h2>
          <p className="gallery-subtitle">
            Explore {filteredItems.length} compelling stories through powerful imagery
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="gallery-controls-bar">
        {/* Category Pills */}
        <div className="gallery-category-pills">
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
              style={{
                '--pill-color': selectedCategory === cat.slug ? cat.color : undefined
              } as React.CSSProperties}
            >
              <span className="pill-icon">{cat.icon}</span>
              <span className="pill-text">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Controls Row */}
        <div className="gallery-controls-row">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="gallery-control-select"
          >
            <option value="recent">⏰ Most Recent</option>
            <option value="views">👁️ Most Viewed</option>
            <option value="likes">❤️ Most Liked</option>
          </select>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="gallery-control-select"
          >
            <option value="masonry">🎨 Masonry View</option>
            <option value="grid">📐 Grid View</option>
            <option value="list">📋 List View</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="gallery-control-select"
          >
            <option value={12}>Show 12</option>
            <option value={24}>Show 24</option>
            <option value={36}>Show 36</option>
            <option value={48}>Show 48</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className={`gallery-grid-container view-${viewMode} ${isVisible ? 'animate' : ''}`}>
        {filteredItems.map((item, index) => {
          const tier = getTierClass(item);
          const isHero = tier === 'tier-hero';
          const isLarge = tier === 'tier-large';
          const isMedium = tier === 'tier-medium';

          return (
            <article
              key={`${item.news_id}-${index}`}
              className={`gallery-card ${tier}`}
              onClick={() => setSelectedItem(item)}
            >
              {/* Image Container */}
              <div className="gallery-card-image">
                <img
                  src={getImageUrl(item.image_url)}
                  alt={item.title}
                  loading="lazy"
                  onError={handleImageError}
                />
                
                {/* Category Badge */}
                <div 
                  className="gallery-category-badge"
                  style={{ background: getCategoryColor(item.category_slug) }}
                >
                  {item.category_name}
                </div>

                {/* Time Badge for Hero */}
                {isHero && (
                  <div className="gallery-time-badge">
                    ⏰ {getTimeSince(item.published_at)}
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="gallery-image-overlay"></div>
              </div>

              {/* Content */}
              <div className="gallery-card-content">
                <h3 className="gallery-card-title">
                  {item.title}
                </h3>

                {(isHero || isLarge || viewMode === 'list') && getExcerpt(item) && (
                  <p className="gallery-card-excerpt">
                    {getExcerpt(item)}
                  </p>
                )}

                <div className="gallery-card-meta">
                  <div className="meta-stats">
                    <span className="stat-item">
                      👁️ {Math.floor((item.views || 0) / 1000)}K
                    </span>
                    {item.likes_count && (
                      <span className="stat-item">
                        ❤️ {Math.floor(item.likes_count / 1000)}K
                      </span>
                    )}
                  </div>
                  <span className="meta-time">{getTimeSince(item.published_at)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Load More */}
      {filteredItems.length < allNews.length && (
        <div className="gallery-load-more">
          <button 
            onClick={() => setItemsPerPage(prev => prev + 12)}
            className="load-more-btn"
          >
            Load More Stories
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <div 
          className="gallery-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="gallery-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="gallery-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <img
              src={getImageUrl(selectedItem.image_url)}
              alt={selectedItem.title}
              className="gallery-modal-image"
            />

            <div className="gallery-modal-body">
              <div 
                className="gallery-modal-badge"
                style={{ background: getCategoryColor(selectedItem.category_slug) }}
              >
                {selectedItem.category_name}
              </div>

              <h2 className="gallery-modal-title">
                {selectedItem.title}
              </h2>

              {getExcerpt(selectedItem) && (
                <p className="gallery-modal-excerpt">
                  {getExcerpt(selectedItem)}
                </p>
              )}

              <div className="gallery-modal-meta">
                <div className="modal-meta-item">
                  <div className="modal-meta-label">Author</div>
                  <div className="modal-meta-value">
                    {selectedItem.first_name} {selectedItem.last_name}
                  </div>
                </div>
                <div className="modal-meta-item">
                  <div className="modal-meta-label">Published</div>
                  <div className="modal-meta-value">
                    {getTimeSince(selectedItem.published_at)}
                  </div>
                </div>
                <div className="modal-meta-item">
                  <div className="modal-meta-label">Views</div>
                  <div className="modal-meta-value">
                    {(selectedItem.views || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                className="gallery-modal-cta"
                onClick={() => handleArticleClick(selectedItem)}
                style={{ background: getCategoryColor(selectedItem.category_slug) }}
              >
                📖 Read Full Article →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;