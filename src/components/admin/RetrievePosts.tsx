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
  status: string;
  views: number;
  likes_count: number;
  comments_count: number;
  published_at: string;
  first_name?: string;
  last_name?: string;
  featured?: boolean;
}

interface Category {
  category_id: number;
  name: string;
  slug: string;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_news: number;
  has_next: boolean;
  has_prev: boolean;
}

interface StatsData {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  archived_posts: number;
  featured_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const RetrievePosts: React.FC = () => {
  const { csrfToken } = useSession();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryManager, setCategoryManager] = useState<CategoryManager | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState('DESC');
  
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  const fetchNews = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        order: sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter.length > 0) params.append('category_ids', JSON.stringify(categoryFilter));

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
        setStats(data.stats || null);
        setPagination(data.pagination || null);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [csrfToken, searchTerm, statusFilter, categoryFilter, sortOrder]);

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

  const handleSelectPost = (postId: number) => {
    setSelectedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === news.length && news.length > 0) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(news.map(item => item.news_id));
    }
  };

  const handleDelete = (postId: number) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/${postToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken || '' }
      });

      if (response.ok) {
        fetchNews(pagination?.current_page || 1);
        setShowDeleteModal(false);
        setPostToDelete(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setShowBulkModal(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedPosts.length === 0) return;
    
    try {
      if (bulkAction === 'delete') {
        for (const postId of selectedPosts) {
          await fetch(`/api/admin/${postId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'X-CSRF-Token': csrfToken || '' }
          });
        }
      }
      fetchNews(pagination?.current_page || 1);
      setSelectedPosts([]);
      setShowBulkModal(false);
      setBulkAction('');
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
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
    <div className="retrieve-posts">
      <div className="retrieve-header">
        <div className="header-left">
          <h1>Manage Posts</h1>
          {stats && (
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-value">{formatNumber(stats.total_posts)}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(stats.published_posts)}</span>
                <span className="stat-label">Published</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(stats.draft_posts)}</span>
                <span className="stat-label">Drafts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(stats.total_views)}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatNumber(stats.total_likes)}</span>
                <span className="stat-label">Likes</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <div className="filters">
            <form onSubmit={(e) => { e.preventDefault(); fetchNews(1); }}>
              <input
                type="text"
                placeholder="Search by title..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              className="filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="DESC">Latest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
          
          <a href="/admin/posts/new" className="new-post-btn">
            New Post
          </a>
        </div>
      </div>

      <div className="category-filter-horizontal">
        <div className="filter-header">
          <h3>📂 Filter by Main Categories</h3>
          <div className="filter-stats">
            <span className="count-badge">{categoryFilter.length} selected</span>
            {categoryFilter.length > 0 && (
              <button onClick={() => setCategoryFilter([])} className="clear-btn">Clear All</button>
            )}
          </div>
        </div>

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
      </div>

      {selectedPosts.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
          </div>
          <div className="bulk-buttons">
            <button className="bulk-btn publish" onClick={() => handleBulkAction('publish')}>
              Publish
            </button>
            <button className="bulk-btn draft" onClick={() => handleBulkAction('draft')}>
              Draft
            </button>
            <button className="bulk-btn archive" onClick={() => handleBulkAction('archive')}>
              Archive
            </button>
            <button className="bulk-btn delete" onClick={() => handleBulkAction('delete')}>
              Delete
            </button>
            <button className="clear-selection" onClick={() => setSelectedPosts([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="posts-table">
        <div className="table-header">
          <div className="column-select">
            <input
              type="checkbox"
              className="select-all-checkbox"
              checked={selectedPosts.length === news.length && news.length > 0}
              onChange={handleSelectAll}
            />
          </div>
          <div className="column-content">Post Details</div>
          <div className="column-stats">Engagement Stats</div>
          <div className="column-actions">Actions</div>
        </div>

        {news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          news.map(item => (
            <div
              key={item.news_id}
              className={`post-row ${selectedPosts.includes(item.news_id) ? 'selected' : ''}`}
            >
              <div className="column-select">
                <input
                  type="checkbox"
                  className="post-checkbox"
                  checked={selectedPosts.includes(item.news_id)}
                  onChange={() => handleSelectPost(item.news_id)}
                />
              </div>
              
              <div className="column-content">
                <div className="post-image">
                  {item.image_url ? (
                    <img src={`http://localhost:5000${item.image_url}`} alt={item.title} />
                  ) : (
                    <div className="image-placeholder">📰</div>
                  )}
                  {item.featured && (
                    <div className="featured-indicator">⭐</div>
                  )}
                </div>
                
                <div className="post-details">
                  <h3 className="post-title">{item.title}</h3>
                  {item.excerpt && <p className="post-excerpt">{item.excerpt}</p>}
                  
                  <div className="post-meta">
                    <div className="badges">
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                      {item.category_name && (
                        <span className="category-tag">{item.category_name}</span>
                      )}
                    </div>
                    
                    <div className="author-info">
                      {item.first_name && <span className="author">By {item.first_name} {item.last_name}</span>}
                      <span className="date">
                        {new Date(item.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="column-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.views)}</span>
                    <span className="stat-label">Views</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.likes_count)}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(item.comments_count)}</span>
                    <span className="stat-label">Comments</span>
                  </div>
                </div>
              </div>
              
              <div className="column-actions">
                <div className="action-buttons">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => window.location.href = `/admin/posts/edit/${item.news_id}`}
                    title="Edit Post"
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn preview-btn"
                    onClick={() => window.open(`/news/${item.slug}`, '_blank')}
                    title="View Article"
                  >
                    View
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item.news_id)}
                    title="Delete Post"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => fetchNews(pagination.current_page - 1)}
            disabled={!pagination.has_prev}
          >
            Previous
          </button>
          <div className="page-info">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
          <button
            className="page-btn"
            onClick={() => fetchNews(pagination.current_page + 1)}
            disabled={!pagination.has_next}
          >
            Next
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="warning-message">
                This will permanently remove the post and all associated data.
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Bulk Action</h3>
              <button className="close-btn" onClick={() => setShowBulkModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to {bulkAction} {selectedPosts.length} selected post
                {selectedPosts.length !== 1 ? 's' : ''}?
              </p>
              {bulkAction === 'delete' && (
                <div className="warning-message">
                  This action will permanently delete the selected posts and cannot be undone.
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowBulkModal(false)}>
                Cancel
              </button>
              <button
                className={`confirm-btn ${bulkAction === 'delete' ? 'danger' : ''}`}
                onClick={confirmBulkAction}
              >
                Confirm {bulkAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrievePosts;