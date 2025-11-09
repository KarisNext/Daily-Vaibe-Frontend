'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/includes/Session';
import CreatePosts from '@/components/admin/CreatePosts';
import EditPosts from '@/components/admin/EditPosts';
import LogoutButton from '@/components/admin/Logout';
import RetrievePosts from '@/components/admin/RetrievePosts';
import SharePosts from '@/components/admin/SharePosts';
import Users from '@/components/admin/Users';
import SystemServices from '@/components/admin/SystemServices';
import AdminChat from '@/components/admin/AdminChat';
import UserProfile from '@/components/admin/UserProfile';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://vybeztribe.com'
  : 'http://localhost:5000';

const Analytics: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>Analytics Dashboard</h2>
      <p>Comprehensive analytics and reporting tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>User engagement metrics</li>
          <li>Content performance analytics</li>
          <li>Traffic and conversion tracking</li>
          <li>Real-time dashboard updates</li>
        </ul>
      </div>
    </div>
  </div>
);

const Boosts: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>Content Boosts</h2>
      <p>Promotion and content amplification tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>Sponsored content management</li>
          <li>Social media promotion</li>
          <li>Newsletter integration</li>
          <li>SEO optimization tools</li>
        </ul>
      </div>
    </div>
  </div>
);

const SEO: React.FC = () => (
  <div className="admin-placeholder">
    <div className="placeholder-content">
      <h2>SEO Management</h2>
      <p>Search engine optimization tools coming soon...</p>
      <div className="placeholder-features">
        <ul>
          <li>Keyword research and tracking</li>
          <li>Meta tag optimization</li>
          <li>Sitemap management</li>
          <li>Performance monitoring</li>
        </ul>
      </div>
    </div>
  </div>
);

interface AdminUser {
  admin_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  component: React.FC;
  description: string;
  requiredRoles: string[];
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('system-services');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>('');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [initComplete, setInitComplete] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading: sessionLoading, logout, error: sessionError } = useSession();

  const adminMenuItems: MenuItem[] = [
    { 
      id: 'system-services', 
      label: 'System Services', 
      icon: '⚙️', 
      component: SystemServices, 
      description: 'System monitoring and maintenance',
      requiredRoles: ['super_admin', 'admin']
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: '📊', 
      component: Analytics, 
      description: 'Dashboard overview and insights',
      requiredRoles: ['super_admin', 'admin', 'editor', 'moderator']
    },
    { 
      id: 'retrieve-posts', 
      label: 'All Posts', 
      icon: '📰', 
      component: RetrievePosts, 
      description: 'View and manage all posts',
      requiredRoles: ['super_admin', 'admin', 'editor', 'moderator']
    },
    { 
      id: 'create-posts', 
      label: 'Create Post', 
      icon: '✏️', 
      component: CreatePosts, 
      description: 'Create new content',
      requiredRoles: ['super_admin', 'admin', 'editor']
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: '👥', 
      component: Users, 
      description: 'Manage admin users',
      requiredRoles: ['super_admin', 'admin', 'editor', 'moderator']
    },
    { 
      id: 'share-posts', 
      label: 'Share Posts', 
      icon: '📤', 
      component: SharePosts, 
      description: 'Social media sharing tools',
      requiredRoles: ['super_admin', 'admin', 'editor']
    },
    { 
      id: 'boosts', 
      label: 'Boosts', 
      icon: '🚀', 
      component: Boosts, 
      description: 'Promote and amplify content',
      requiredRoles: ['super_admin', 'admin']
    },
    { 
      id: 'seo', 
      label: 'SEO', 
      icon: '🔍', 
      component: SEO, 
      description: 'Search optimization tools',
      requiredRoles: ['super_admin', 'admin', 'editor']
    },
  ];

  const hasAccess = useCallback((requiredRoles: string[]): boolean => {
    if (!adminUser) return false;
    return requiredRoles.includes(adminUser.role);
  }, [adminUser]);

  const filteredMenuItems = adminMenuItems.filter(item => hasAccess(item.requiredRoles));

  useEffect(() => {
    // Still loading session, wait
    if (sessionLoading) {
      return;
    }

    // Handle session errors - redirect to login without showing error
    if (sessionError || !isAuthenticated || !user) {
      // Silently redirect to login page
      setIsLoading(false);
      router.push('/auth/login');
      return;
    }

    // Check if user has authorized role
    const authorizedRoles = ['admin', 'super_admin', 'editor', 'moderator'];
    const isAuthorized = authorizedRoles.includes(user.role);

    if (!isAuthorized) {
      setAuthError(`Access denied. Role '${user.role}' is not authorized for admin access.`);
      setIsLoading(false);
      setTimeout(() => {
        router.push('/client');
      }, 3000);
      return;
    }

    // Set admin user and complete initialization
    setAdminUser({
      admin_id: user.admin_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role
    });
    
    setAuthError('');
    setIsLoading(false);
    setInitComplete(true);
  }, [sessionLoading, isAuthenticated, user, sessionError, router]);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const handleEditPost = useCallback((postId: number): void => {
    setEditingPostId(postId);
    setActiveTab('edit-post');
  }, []);

  const handleBackFromEdit = useCallback((): void => {
    setEditingPostId(null);
    setActiveTab('retrieve-posts');
  }, []);

  const handleNavigation = useCallback((tabId: string): void => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    setEditingPostId(null);
  }, []);

  const getActiveComponent = useCallback((): React.FC => {
    if (activeTab === 'edit-post' && editingPostId) {
      return () => (
        <EditPosts 
          newsId={editingPostId}
          onBack={handleBackFromEdit}
        />
      );
    }
    
    const menuItem = filteredMenuItems.find(item => item.id === activeTab);
    return menuItem?.component || SystemServices;
  }, [activeTab, editingPostId, handleBackFromEdit, filteredMenuItems]);

  // Show loading state
  if (sessionLoading || isLoading || !initComplete) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  // Show error for unauthorized access
  if (authError) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>{authError}</p>
          <p>Redirecting you to the appropriate page...</p>
          <button onClick={() => router.push('/client')}>Go to Home</button>
        </div>
      </div>
    );
  }

  // Final check for admin user
  if (!adminUser) {
    return (
      <div className="admin-error">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button onClick={() => router.push('/client')}>Return to Home</button>
        </div>
      </div>
    );
  }

  const ActiveComponent = getActiveComponent();

  return (
    <div className="admin-dashboard" data-theme="dark">
      <div className="mobile-header">
        <div className="mobile-brand">
          <h1>Daily Vaibe Admin</h1>
        </div>
        <div className="mobile-controls">
          <button
            className="mobile-profile-btn"
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
          >
            <span className="profile-avatar-mini">
              {adminUser.first_name.charAt(0)}
            </span>
          </button>
          <button
            className="mobile-chat-btn"
            onClick={() => setChatOpen(!chatOpen)}
            aria-label="Toggle chat"
          >
            <span className="chat-icon">💬</span>
          </button>
          <LogoutButton 
            onLogout={handleLogout}
            variant="icon"
            showText={false}
            className="mobile-logout-btn"
          />
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand">
            <h2>Daily Vaibe</h2>
            <span className="admin-badge">Admin</span>
          </div>
          <button 
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="admin-profile" onClick={() => setProfileOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="profile-avatar">
            <span>{adminUser.first_name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="profile-info">
            <h3>{`${adminUser.first_name} ${adminUser.last_name}`}</h3>
            <p>{adminUser.role.replace('_', ' ').toUpperCase()}</p>
            <small>Click to view profile</small>
          </div>
        </div>

        <nav className="admin-nav">
          <ul>
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.id)}
                  title={item.description}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="chat-toggle-btn"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <span className="chat-icon">💬</span>
            <span>Admin Chat</span>
          </button>
          <LogoutButton 
            onLogout={handleLogout}
            variant="full"
            showText={true}
            className="sidebar-logout-btn"
          />
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <header className="content-header">
            <div className="header-left">
              <h1>
                {activeTab === 'edit-post' ? 'Edit Post' : 
                 filteredMenuItems.find(item => item.id === activeTab)?.label || 'System Services'}
              </h1>
              {activeTab === 'edit-post' && (
                <button 
                  className="back-btn"
                  onClick={handleBackFromEdit}
                >
                  ← Back to Posts
                </button>
              )}
            </div>
            <div className="header-actions">
              <div className="admin-stats">
                <button
                  className="profile-trigger"
                  onClick={() => setProfileOpen(true)}
                  title="View your profile"
                >
                  <div className="profile-avatar-header">
                    <span>{adminUser.first_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="profile-name-header">{adminUser.first_name}</span>
                </button>
                <span className="stat-item">
                  <span className="stat-icon">🏷️</span>
                  <span>{adminUser.role}</span>
                </span>
                <span className="stat-item">
                  <span className="stat-icon">🕐</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </span>
              </div>
              <button
                className="desktop-chat-btn"
                onClick={() => setChatOpen(!chatOpen)}
              >
                💬 Chat
              </button>
              <LogoutButton 
                onLogout={handleLogout}
                variant="button"
                showText={true}
                className="desktop-logout-btn"
              />
            </div>
          </header>

          <div className="content-body">
            {React.createElement(ActiveComponent)}
          </div>
        </div>
      </main>

      {chatOpen && adminUser && (
        <AdminChat 
          currentAdmin={adminUser}
          onClose={() => setChatOpen(false)}
        />
      )}

      {profileOpen && (
        <UserProfile onClose={() => setProfileOpen(false)} />
      )}

      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSidebarOpen(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;