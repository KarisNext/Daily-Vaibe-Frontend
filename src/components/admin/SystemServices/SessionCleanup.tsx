'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface CleanupStats {
  publicSessions: number;
  expiredPublic: number;
  adminSessions: number;
  expiredAdmin: number;
  userSessions: number;
  expiredUser: number;
  sessionGeo: number;
  activeDevices: number;
  oldDevices: number;
}

interface SchedulerStatus {
  isRunning: boolean;
  lastRun: string | null;
  nextRun: string | null;
  interval: string;
}

const SessionCleanup: React.FC = () => {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsResponse, statusResponse] = await Promise.all([
        fetch('/api/admin/system-services/cleanup?action=stats', {
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch('/api/admin/system-services/cleanup?action=status', {
          credentials: 'include',
          cache: 'no-store'
        })
      ]);

      if (!statsResponse.ok || !statusResponse.ok) {
        throw new Error(`HTTP Error: Stats ${statsResponse.status}, Status ${statusResponse.status}`);
      }

      const statsData = await statsResponse.json();
      const statusData = await statusResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      } else {
        setError(statsData.message || 'Failed to load stats');
      }

      if (statusData.success) {
        setSchedulerStatus(statusData.status);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching cleanup data:', error);
      setError('Failed to load cleanup data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runManualCleanup = async (force: boolean = false) => {
    if (force && !confirm('⚠️ Force cleanup will delete sessions that expire within 7 days. Continue?')) {
      return;
    }

    setCleanupLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/system-services/cleanup?action=run-now&force=${force}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${force ? 'Force' : 'Manual'} cleanup completed!\n\nDeleted:\n- ${data.results.publicSessions} public sessions\n- ${data.results.userSessions} user sessions\n\nTime: ${data.results.duration}ms`);
        await fetchData();
      } else {
        throw new Error(data.message || 'Cleanup failed');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Manual cleanup error:', error);
      setError(`Cleanup failed: ${errorMessage}`);
      alert(`❌ Cleanup failed: ${errorMessage}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="geo-tracker-loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading Session Cleanup...</p>
      </div>
    );
  }

  return (
    <div className="geo-tracker">
      <div className="tracker-header">
        <div className="header-info">
          <h2>🗂️ Session Cleanup Service</h2>
          <p>Automated management of sessions and cookies</p>
        </div>
        <div className="header-controls">
          <button className="refresh-btn" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-banner-icon">⚠️</div>
          <div className="error-banner-content">{error}</div>
          <button className="error-banner-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="category-overview">
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-label">Public Sessions</span>
            <span className="card-value">{stats?.publicSessions?.toLocaleString() || 0}</span>
            <span className="card-sublabel">{stats?.expiredPublic || 0} expired</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">🔒</div>
          <div className="card-content">
            <span className="card-label">Admin Sessions</span>
            <span className="card-value">{stats?.adminSessions?.toLocaleString() || 0}</span>
            <span className="card-sublabel">Protected (not cleaned)</span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">🌍</div>
          <div className="card-content">
            <span className="card-label">Geo Data</span>
            <span className="card-value">{stats?.sessionGeo?.toLocaleString() || 0}</span>
            <span className="card-sublabel">{stats?.oldDevices || 0} devices 30+ days old</span>
          </div>
        </div>

        <div className="overview-card active">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <span className="card-label">Active Devices</span>
            <span className="card-value">{stats?.activeDevices?.toLocaleString() || 0}</span>
            <span className="card-sublabel">Last 7 days</span>
          </div>
        </div>
      </div>

      <div className="tracker-filters-advanced">
        <div className="filters-header">
          <h3>🕒 Cleanup Status</h3>
        </div>
        
        <div style={{ 
          padding: '1rem',
          background: 'var(--bg-content)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Expired Public Sessions
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats?.expiredPublic ? 'var(--status-warning)' : 'var(--admin-primary)' }}>
                {stats?.expiredPublic || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Expired User Sessions
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats?.expiredUser ? 'var(--status-warning)' : 'var(--admin-primary)' }}>
                {stats?.expiredUser || 0}
              </div>
            </div>
          </div>
          
          <div style={{ 
            padding: '0.75rem',
            background: 'rgba(0, 255, 136, 0.1)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <span className="status-indicator online" style={{ marginRight: '0.5rem' }} />
            {schedulerStatus?.lastRun 
              ? `Last run: ${new Date(schedulerStatus.lastRun).toLocaleString()}`
              : 'Ready for manual cleanup'}
          </div>
        </div>

        <div className="filters-header">
          <h3>🧹 Manual Cleanup</h3>
        </div>
        
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <button
            className="filter-apply-btn"
            onClick={() => runManualCleanup(false)}
            disabled={cleanupLoading}
            style={{ width: '100%' }}
          >
            {cleanupLoading ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
                <span> Running Cleanup...</span>
              </>
            ) : (
              <>🧹 Clean Expired Sessions ({(stats?.expiredPublic || 0) + (stats?.expiredUser || 0)})</>
            )}
          </button>

          <button
            className="filter-apply-btn"
            onClick={() => runManualCleanup(true)}
            disabled={cleanupLoading}
            style={{ 
              width: '100%',
              background: 'var(--status-warning)',
              borderColor: 'var(--status-warning)'
            }}
          >
            ⚠️ Force Cleanup (7+ days old)
          </button>
        </div>
      </div>

      <div className="cleanup-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>About Session Cleanup:</strong> Normal cleanup removes only expired sessions. Force cleanup removes sessions older than 7 days (useful when sessions have long expiration times). Admin sessions and geographic data are always preserved.
        </div>
      </div>
    </div>
  );
};

export default SessionCleanup;