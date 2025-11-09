// frontend/src/components/admin/ServicesOverview.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ServiceStats {
  publicSessions: number;
  adminSessions: number;
  userSessions: number;
  registeredDevices: number;
  activeDevices: number;
  onlineVisitors: number;
  totalArticles: number;
  totalUsers: number;
  totalAdmins: number;
  onlineClientUsers: number;
}

interface CleanupResults {
  publicSessions: number;
  adminSessions: number;
  userSessions: number;
  preservedDeviceInfo: number;
  errors: string[];
}

interface OnlineVisitor {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  region: string;
  country: string;
  lastActive: string;
  visitCount: number;
  county: string;
  town: string;
  isClientUser: boolean;
}

const ServicesOverview: React.FC = () => {
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [onlineVisitors, setOnlineVisitors] = useState<OnlineVisitor[]>([]);
  const [onlineClientUsers, setOnlineClientUsers] = useState<OnlineVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResults | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'clients'>('all');

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/servicesoverview/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setOnlineVisitors(data.onlineVisitors || []);
          
          const clientUsers = (data.onlineVisitors || []).filter((visitor: OnlineVisitor) => 
            visitor.isClientUser
          );
          setOnlineClientUsers(clientUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        publicSessions: 0,
        adminSessions: 0,
        userSessions: 0,
        registeredDevices: 0,
        activeDevices: 0,
        onlineVisitors: 0,
        onlineClientUsers: 0,
        totalArticles: 0,
        totalUsers: 0,
        totalAdmins: 0
      });
      setOnlineVisitors([]);
      setOnlineClientUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch('/api/admin/servicesoverview/cleanup', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setLastCleanup(data.results);
        await fetchStats();
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  const startCleanupScheduler = async () => {
    try {
      const response = await fetch('/api/admin/servicesoverview/cleanup/start', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Cleanup scheduler started');
      }
    } catch (error) {
      console.error('Error starting scheduler:', error);
    }
  };

  const stopCleanupScheduler = async () => {
    try {
      const response = await fetch('/api/admin/servicesoverview/cleanup/stop', {
        method: 'POST',
      });
      if (response.ok) {
        alert('Cleanup scheduler stopped');
      }
    } catch (error) {
      console.error('Error stopping scheduler:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh]);

  if (isLoading) {
    return (
      <div className="services-overview">
        <div className="loading-spinner">🔄 Loading Services Overview...</div>
      </div>
    );
  }

  return (
    <div className="services-overview">
      <div className="services-header">
        <h1>Services Overview</h1>
        <div className="services-controls">
          <button
            className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🟢 Auto Refresh' : '⚪ Auto Refresh'}
          </button>
          <button className="refresh-btn" onClick={fetchStats}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Online Visitors</h3>
            <span className="stat-value">{stats?.onlineVisitors || 0}</span>
            <span className="stat-label">Active in last 15 minutes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <h3>Client Users</h3>
            <span className="stat-value">{stats?.onlineClientUsers || 0}</span>
            <span className="stat-label">Registered users online</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Active Sessions</h3>
            <span className="stat-value">{stats?.publicSessions || 0}</span>
            <span className="stat-label">Public user sessions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>Registered Devices</h3>
            <span className="stat-value">{stats?.registeredDevices || 0}</span>
            <span className="stat-label">Actual devices in system</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <h3>Active Devices</h3>
            <span className="stat-value">{stats?.activeDevices || 0}</span>
            <span className="stat-label">Currently connected</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>Total Articles</h3>
            <span className="stat-value">{stats?.totalArticles || 0}</span>
            <span className="stat-label">Published content</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Registered Users</h3>
            <span className="stat-value">{stats?.totalUsers || 0}</span>
            <span className="stat-label">Platform users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <h3>Admin Users</h3>
            <span className="stat-value">{stats?.totalAdmins || 0}</span>
            <span className="stat-label">Administrative accounts</span>
          </div>
        </div>
      </div>

      <div className="cleanup-section">
        <h2>Session Cleanup Management</h2>
        <div className="cleanup-controls">
          <button
            className="cleanup-btn primary"
            onClick={runCleanup}
            disabled={cleanupLoading}
          >
            {cleanupLoading ? '🔄 Cleaning...' : '🧹 Run Cleanup Now'}
          </button>
          <button
            className="cleanup-btn secondary"
            onClick={startCleanupScheduler}
          >
            🕒 Start Auto Cleanup
          </button>
          <button
            className="cleanup-btn warning"
            onClick={stopCleanupScheduler}
          >
            ⏹️ Stop Auto Cleanup
          </button>
        </div>

        {lastCleanup && (
          <div className="cleanup-results">
            <h4>Last Cleanup Results</h4>
            <div className="results-grid">
              <span>Public Sessions: {lastCleanup.publicSessions}</span>
              <span>Admin Sessions: {lastCleanup.adminSessions}</span>
              <span>User Sessions: {lastCleanup.userSessions}</span>
              <span>Device Info Preserved: {lastCleanup.preservedDeviceInfo}</span>
            </div>
          </div>
        )}
      </div>

      <div className="visitors-section">
        <div className="visitors-header">
          <h2>
            Online Visitors ({activeTab === 'all' ? onlineVisitors.length : onlineClientUsers.length})
          </h2>
          <div className="visitors-tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Visitors ({onlineVisitors.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              Client Users ({onlineClientUsers.length})
            </button>
          </div>
        </div>

        <div className="visitors-list">
          {(activeTab === 'all' ? onlineVisitors : onlineClientUsers).length === 0 ? (
            <p className="no-visitors">
              No {activeTab === 'clients' ? 'client users' : 'visitors'} active in the last 15 minutes
            </p>
          ) : (
            (activeTab === 'all' ? onlineVisitors : onlineClientUsers).map((visitor, index) => (
              <div key={visitor.sessionId} className={`visitor-card ${visitor.isClientUser ? 'client-user' : ''}`}>
                <div className="visitor-header">
                  <span className="visitor-number">#{index + 1}</span>
                  <span className="visitor-device">{visitor.deviceType}</span>
                  <span className="visitor-type">
                    {visitor.isClientUser ? '👤 Client User' : '👥 Anonymous'}
                  </span>
                  <span className="visitor-region">
                    {visitor.county || 'Unknown'} {visitor.region ? `(${visitor.region})` : ''}
                  </span>
                </div>
                <div className="visitor-details">
                  <span className="visitor-ip">{visitor.ipAddress}</span>
                  <span className="visitor-location">
                    {visitor.county && visitor.town ? `${visitor.town}, ${visitor.county}` : 'Location unknown'}
                  </span>
                  <span className="visitor-visits">Visits: {visitor.visitCount}</span>
                  <span className="visitor-last-active">
                    Last active: {new Date(visitor.lastActive).toLocaleTimeString()}
                  </span>
                </div>
                <div className="visitor-user-agent">
                  {visitor.userAgent.substring(0, 80)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="system-info">
        <h2>System Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
          </div>
          <div className="info-item">
            <strong>Last Updated:</strong> {new Date().toLocaleString()}
          </div>
          <div className="info-item">
            <strong>Auto Refresh:</strong> {autoRefresh ? 'Enabled' : 'Disabled'}
          </div>
          <div className="info-item">
            <strong>Cleanup Scheduler:</strong> Active (6-hour intervals)
          </div>
          <div className="info-item">
            <strong>Geo Tracking:</strong> Active (Kenya counties mapping)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesOverview;