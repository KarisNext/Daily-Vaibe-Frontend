'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/includes/Session';

interface ProfileStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_engagement_rate: number;
  top_performing_post: {
    title: string;
    views: number;
    slug: string;
  } | null;
  recent_activity: Array<{
    action: string;
    target: string;
    timestamp: string;
  }>;
}

interface AdminProfile {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  permissions: string[];
  last_login: string;
  created_at: string;
}

const UserProfile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, csrfToken } = useSession();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'activity'>('overview');
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchProfileData();
    fetchRecentPosts();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/admin/userprofile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch(`/api/admin?author_id=${user?.admin_id}&limit=5`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentPosts(data.news || []);
      }
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const copyShareLink = (slug: string) => {
    const url = `${window.location.origin}/news/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: '#dc2626',
      admin: '#2563eb',
      editor: '#16a34a',
      moderator: '#9333ea'
    };
    return colors[role] || '#6b7280';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateEngagement = (post: any) => {
    const total = post.views || 0;
    if (total === 0) return 0;
    const engagement = (post.likes_count || 0) + (post.comments_count || 0) + (post.share_count || 0);
    return ((engagement / total) * 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="profile-modal-overlay">
        <div className="profile-modal">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !stats) {
    return null;
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>My Profile</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-avatar-large">
              <span>{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</span>
            </div>
            
            <div className="profile-info-card">
              <h3>{profile.first_name} {profile.last_name}</h3>
              <p className="profile-username">@{profile.username}</p>
              <span 
                className="profile-role-badge" 
                style={{ backgroundColor: getRoleColor(profile.role) }}
              >
                {profile.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-icon">📧</span>
                <div>
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📱</span>
                <div>
                  <label>Phone</label>
                  <p>{profile.phone}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🆔</span>
                <div>
                  <label>Admin ID</label>
                  <p>#{profile.admin_id}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🕐</span>
                <div>
                  <label>Last Login</label>
                  <p>{formatDate(profile.last_login)}</p>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📅</span>
                <div>
                  <label>Member Since</label>
                  <p>{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>

            {profile.permissions && profile.permissions.length > 0 && (
              <div className="profile-permissions">
                <h4>Permissions</h4>
                <div className="permissions-list">
                  {profile.permissions.map((perm, index) => (
                    <span key={index} className="permission-badge">
                      {perm.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="profile-main">
            <div className="profile-tabs">
              <button
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
              <button
                className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                📰 My Posts
              </button>
              <button
                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                📈 Activity
              </button>
            </div>

            <div className="profile-tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <div className="stats-grid">
                    <div className="stat-card primary">
                      <div className="stat-icon">📝</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.total_posts}</span>
                        <span className="stat-label">Total Posts</span>
                      </div>
                    </div>
                    <div className="stat-card success">
                      <div className="stat-icon">✅</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.published_posts}</span>
                        <span className="stat-label">Published</span>
                      </div>
                    </div>
                    <div className="stat-card warning">
                      <div className="stat-icon">📋</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.draft_posts}</span>
                        <span className="stat-label">Drafts</span>
                      </div>
                    </div>
                    <div className="stat-card info">
                      <div className="stat-icon">👁️</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.total_views.toLocaleString()}</span>
                        <span className="stat-label">Total Views</span>
                      </div>
                    </div>
                    <div className="stat-card accent">
                      <div className="stat-icon">❤️</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.total_likes}</span>
                        <span className="stat-label">Total Likes</span>
                      </div>
                    </div>
                    <div className="stat-card secondary">
                      <div className="stat-icon">💬</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.total_comments}</span>
                        <span className="stat-label">Comments</span>
                      </div>
                    </div>
                    <div className="stat-card purple">
                      <div className="stat-icon">📤</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.total_shares}</span>
                        <span className="stat-label">Shares</span>
                      </div>
                    </div>
                    <div className="stat-card gradient">
                      <div className="stat-icon">📊</div>
                      <div className="stat-data">
                        <span className="stat-value">{stats.avg_engagement_rate.toFixed(2)}%</span>
                        <span className="stat-label">Avg Engagement</span>
                      </div>
                    </div>
                  </div>

                  {stats.top_performing_post && (
                    <div className="top-post-card">
                      <h4>🏆 Top Performing Post</h4>
                      <div className="top-post-content">
                        <h5>{stats.top_performing_post.title}</h5>
                        <div className="top-post-stats">
                          <span>👁️ {stats.top_performing_post.views.toLocaleString()} views</span>
                          <button
                            className="share-link-btn"
                            onClick={() => copyShareLink(stats.top_performing_post!.slug)}
                          >
                            🔗 Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="posts-tab">
                  <div className="posts-header">
                    <h4>Recent Posts</h4>
                    <span className="posts-count">{recentPosts.length} posts</span>
                  </div>
                  <div className="posts-list">
                    {recentPosts.map((post) => (
                      <div key={post.news_id} className="post-item">
                        <div className="post-item-header">
                          <h5>{post.title}</h5>
                          <span className={`status-badge status-${post.status}`}>
                            {post.status}
                          </span>
                        </div>
                        <div className="post-item-meta">
                          <span>📅 {formatDate(post.published_at)}</span>
                          <span>📁 {post.category_name}</span>
                        </div>
                        <div className="post-item-stats">
                          <div className="stat-group">
                            <span>👁️ {post.views}</span>
                            <span>❤️ {post.likes_count}</span>
                            <span>💬 {post.comments_count}</span>
                            <span>📤 {post.share_count || 0}</span>
                          </div>
                          <div className="engagement-badge">
                            {calculateEngagement(post)}% engagement
                          </div>
                        </div>
                        <div className="post-item-actions">
                          <button
                            className="action-btn view"
                            onClick={() => window.open(`/news/${post.slug}`, '_blank')}
                          >
                            👁️ View
                          </button>
                          <button
                            className="action-btn share"
                            onClick={() => copyShareLink(post.slug)}
                          >
                            🔗 Share Link
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="activity-tab">
                  <h4>Recent Activity</h4>
                  <div className="activity-timeline">
                    {stats.recent_activity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-marker"></div>
                        <div className="activity-content">
                          <p className="activity-action">{activity.action}</p>
                          <p className="activity-target">{activity.target}</p>
                          <span className="activity-time">
                            {formatDate(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;