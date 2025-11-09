'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/includes/Session';
import { CategoryManager, getCategoryGroupColor, getCategoryGroupIcon } from './CategoryManager';

interface NewsItem {
  news_id: number;
  title: string;
  excerpt: string;
  slug: string;
  category_name: string;
  category_ids?: number[];
  image_url: string;
  published_at: string;
  first_name?: string;
  last_name?: string;
  tags?: string;
  views: number;
  likes_count: number;
  comments_count: number;
}

interface Category {
  category_id: number;
  name: string;
  slug: string;
}

const SharePosts: React.FC = () => {
  const { csrfToken } = useSession();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryManager, setCategoryManager] = useState<CategoryManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('published_at');
  
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsItem | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'published',
        limit: '50',
        order: 'DESC'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter.length > 0) params.append('category_ids', JSON.stringify(categoryFilter));
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/admin?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, searchTerm, categoryFilter, sortBy]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [csrfToken]);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [fetchNews, fetchCategories]);

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryManager(new CategoryManager(categories, categoryFilter));
    }
  }, [categories, categoryFilter]);

  const handleCategoryToggle = (categoryId: number) => {
    setCategoryFilter(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const generateShareUrl = (slug: string, platform: string) => {
    const baseUrl = `${window.location.origin}/news/${slug}`;
    const utmParams = new URLSearchParams({
      utm_source: platform,
      utm_medium: 'social',
      utm_campaign: 'admin_share'
    });
    return `${baseUrl}?${utmParams.toString()}`;
  };

  const generateHashtags = (post: NewsItem): string[] => {
    const tags = [];
    if (post.category_name) {
      tags.push(`#${post.category_name.replace(/\s+/g, '')}`);
    }
    if (post.tags) {
      const postTags = post.tags.split(',').map(tag => `#${tag.trim().replace(/\s+/g, '')}`);
      tags.push(...postTags.slice(0, 3));
    }
    return tags;
  };

  const generateShareText = (post: NewsItem, platform: string): string => {
    const hashtags = generateHashtags(post).join(' ');
    const url = generateShareUrl(post.slug, platform);
    
    switch (platform) {
      case 'twitter':
        const twitterText = post.title.length > 200 ? `${post.title.substring(0, 200)}...` : post.title;
        return `🔥 ${twitterText} ${hashtags} ${url}`;
        
      case 'facebook':
        return `${post.title}\n\n${post.excerpt}\n\nRead more: ${url}\n\n${hashtags}`;
        
      case 'linkedin':
        return `${post.title}\n\n${post.excerpt}\n\nRead the full article: ${url}\n\n${hashtags}`;
        
      case 'whatsapp':
        return `📰 ${post.title}\n\n${post.excerpt}\n\nRead more: ${url}`;
        
      default:
        return `${post.title} - ${url}`;
    }
  };

  const handleCopyLink = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'copy');
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(post.slug);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const shareOnFacebook = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'facebook');
    const shareText = generateShareText(post, 'facebook');
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnTwitter = (post: NewsItem) => {
    const shareText = generateShareText(post, 'twitter');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnLinkedIn = (post: NewsItem) => {
    const url = generateShareUrl(post.slug, 'linkedin');
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnWhatsApp = (post: NewsItem) => {
    const shareText = generateShareText(post, 'whatsapp');
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const openShareModal = (post: NewsItem) => {
    setSelectedPost(post);
    setCustomMessage(generateShareText(post, 'custom'));
    setShowShareModal(true);
  };

  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleBulkShare = (platform: string) => {
    if (selectedPosts.length === 0) return;
    
    selectedPosts.forEach(postId => {
      const post = news.find(p => p.news_id === postId);
      if (post) {
        switch (platform) {
          case 'facebook': shareOnFacebook(post); break;
          case 'twitter': shareOnTwitter(post); break;
          case 'linkedin': shareOnLinkedIn(post); break;
          case 'whatsapp': shareOnWhatsApp(post); break;
        }
      }
    });
    
    setSelectedPosts([]);
  };

  if (isLoading) {
    return (
      <div className="retrieve-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="retrieve-posts share-posts">
      {/* Header */}
      <div className="retrieve-header">
        <div className="header-left">
          <h1>📢 Share Posts</h1>
          <div className="quick-stats">
            <span className="stat-item">Published: {news.length}</span>
            <span className="stat-item">Selected: {selectedPosts.length}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="filters">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
              <option value="published_at">Latest</option>
              <option value="views">Most Views</option>
              <option value="likes_count">Most Likes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Dropdown */}
      <div className="category-filter-horizontal">
        <div className="filter-header">
          <h3>📂 Filter by Categories</h3>
          <div className="filter-stats">
            <span className="count-badge">{categoryFilter.length} selected</span>
            {categoryFilter.length > 0 && (
              <button onClick={() => setCategoryFilter([])} className="clear-btn">Clear All</button>
            )}
            <button 
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} 
              className="clear-btn"
            >
              {showCategoryDropdown ? '▲ Hide' : '▼ Show'}
            </button>
          </div>
        </div>

        {showCategoryDropdown && (
          <div className="category-groups-grid">
            {categoryManager?.getMainCategories().map(mainCat => {
              const mainCategories = categoryManager?.getAllCategoriesForMain(mainCat) || [];
              const selectedCount = mainCategories.filter(c => categoryFilter.includes(c.category_id)).length;
              
              return (
                <div key={mainCat} className="category-group-card">
                  <div className="group-header" style={{ borderLeftColor: getCategoryGroupColor(mainCat) }}>
                    <span className="group-icon">{getCategoryGroupIcon(mainCat)}</span>
                    <span className="group-name">{mainCat}</span>
                    <span className="group-stats">
                      {selectedCount}/{mainCategories.length}
                    </span>
                  </div>
                  <div className="group-categories">
                    {mainCategories.map(category => {
                      const isSelected = categoryFilter.includes(category.category_id);
                      return (
                        <label key={category.category_id} className={`category-chip ${isSelected ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCategoryToggle(category.category_id)}
                          />
                          <span>{category.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedPosts.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-info">{selectedPosts.length} posts selected</span>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkShare('facebook')} className="bulk-btn facebook-btn">
              📘 Facebook
            </button>
            <button onClick={() => handleBulkShare('twitter')} className="bulk-btn twitter-btn">
              𝕏 Twitter/X
            </button>
            <button onClick={() => handleBulkShare('linkedin')} className="bulk-btn linkedin-btn">
              💼 LinkedIn
            </button>
            <button onClick={() => handleBulkShare('whatsapp')} className="bulk-btn">
              💬 WhatsApp
            </button>
            <button onClick={() => setSelectedPosts([])} className="clear-selection">
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="posts-table">
        <div className="table-header">
          <div className="column-select">
            <input 
              type="checkbox" 
              className="select-all-checkbox"
              onChange={(e) => setSelectedPosts(e.target.checked ? news.map(n => n.news_id) : [])} 
            />
          </div>
          <div className="column-content">Post</div>
          <div className="column-stats">Engagement</div>
          <div className="column-actions">Share</div>
        </div>

        {news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>No posts found</h3>
            <p>Publish some posts to start sharing</p>
          </div>
        ) : (
          news.map(post => (
            <div key={post.news_id} className={`post-row ${selectedPosts.includes(post.news_id) ? 'selected' : ''}`}>
              <div className="column-select">
                <input
                  type="checkbox"
                  className="post-checkbox"
                  checked={selectedPosts.includes(post.news_id)}
                  onChange={() => handleSelectPost(post.news_id)}
                />
              </div>
              
              <div className="column-content">
                <div className="post-image">
                  {post.image_url ? (
                    <img src={`http://localhost:5000${post.image_url}`} alt={post.title} />
                  ) : (
                    <div className="image-placeholder">📰</div>
                  )}
                </div>
                
                <div className="post-details">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-meta">
                    <div className="badges">
                      <span className="category-tag">{post.category_name}</span>
                    </div>
                    <div className="author-info">
                      <span className="author">{post.first_name} {post.last_name}</span>
                      <span>•</span>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="column-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{post.views}</span>
                    <span className="stat-label">Views</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{post.likes_count}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{post.comments_count}</span>
                    <span className="stat-label">Comments</span>
                  </div>
                </div>
              </div>
              
              <div className="column-actions">
                <div className="action-buttons">
                  <button onClick={() => shareOnFacebook(post)} className="action-btn facebook-btn" title="Share on Facebook">
                    📘 Facebook
                  </button>
                  <button onClick={() => shareOnTwitter(post)} className="action-btn twitter-btn" title="Share on Twitter">
                    𝕏 Twitter
                  </button>
                  <button onClick={() => shareOnLinkedIn(post)} className="action-btn linkedin-btn" title="Share on LinkedIn">
                    💼 LinkedIn
                  </button>
                  <button onClick={() => shareOnWhatsApp(post)} className="action-btn" title="Share on WhatsApp">
                    💬 WhatsApp
                  </button>
                  <button onClick={() => handleCopyLink(post)} className="action-btn" title="Copy Link">
                    {copiedLink === post.slug ? '✓ Copied' : '🔗 Copy Link'}
                  </button>
                  <button onClick={() => openShareModal(post)} className="action-btn" title="Custom Share">
                    ⚙️ Custom
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Custom Share Message</h3>
              <button onClick={() => setShowShareModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <h4 className="post-title">{selectedPost.title}</h4>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="search-input"
                style={{ width: '100%', resize: 'vertical', marginTop: '1rem' }}
              />
              <div className="badges" style={{ marginTop: '1rem' }}>
                {generateHashtags(selectedPost).map((tag, i) => (
                  <span key={i} className="category-tag">{tag}</span>
                ))}
              </div>
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: 'var(--bg-content)', 
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                wordBreak: 'break-all'
              }}>
                {generateShareUrl(selectedPost.slug, 'custom')}
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowShareModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${customMessage}\n\n${generateShareUrl(selectedPost.slug, 'custom')}`);
                  setShowShareModal(false);
                }}
                className="confirm-btn"
              >
                Copy Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharePosts;