// frontend/src/components/admin/SystemServices/CacheManagement.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface CacheStats {
  redis: {
    connected: boolean;
    keys: number;
    memory: string;
    hitRate: string;
    commands: number;
    uptime: string;
  };
  cdn: {
    enabled: boolean;
    zones: number;
    hits: number;
    bandwidth: string;
    cacheHitRatio: string;
  };
  memory: {
    size: string;
    entries: number;
    hitRate: string;
    maxSize: string;
  };
  performance: {
    averageResponseTime: string;
    cacheEfficiency: string;
    memoryUsage: string;
  };
}

interface PurgeResult {
  success: boolean;
  message: string;
  purgedItems?: number;
}

const CacheManagement: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purging, setPurging] = useState<string>('');
  const [lastPurge, setLastPurge] = useState<PurgeResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cache-management/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purgeCache = async (type: string, key?: string) => {
    setPurging(type);
    try {
      const response = await fetch('/api/admin/cache-management/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, key })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastPurge({
          success: true,
          message: data.message,
          purgedItems: data.purgedItems
        });
        await fetchStats(); // Refresh stats after purge
      } else {
        throw new Error('Purge failed');
      }
    } catch (error) {
      console.error('Error purging cache:', error);
      setLastPurge({
        success: false,
        message: 'Cache purge failed. Please try again.'
      });
    } finally {
      setPurging('');
    }
  };

  const flushAllCaches = async () => {
    setPurging('all');
    try {
      // Purge multiple cache types
      await Promise.all([
        purgeCache('all'),
        purgeCache('news'),
        purgeCache('cdn')
      ]);
    } finally {
      setPurging('');
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh]);

  if (isLoading) {
    return (
      <div className="cache-management">
        <div className="loading-spinner">🔄 Loading Cache Statistics...</div>
      </div>
    );
  }

  return (
    <div className="cache-management">
      {/* Header Controls */}
      <div className="cache-header">
        <div className="header-info">
          <h2>⚡ Cache Management</h2>
          <p>Content delivery network and cache optimization</p>
        </div>
        <div className="header-controls">
          <button
            className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🟢 Auto Refresh' : '⚪ Auto Refresh'}
          </button>
          <button className="refresh-btn" onClick={fetchStats}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Cache Statistics Grid */}
      <div className="cache-stats-grid">
        {/* Redis Cache */}
        <div className="cache-stat-card redis">
          <div className="stat-header">
            <span className="stat-icon">🔴</span>
            <h3>Redis Cache</h3>
            <span className={`status-badge ${stats?.redis.connected ? 'connected' : 'disconnected'}`}>
              {stats?.redis.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Keys</span>
              <span className="stat-value">{stats?.redis.keys || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory</span>
              <span className="stat-value">{stats?.redis.memory || '0 MB'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hit Rate</span>
              <span className="stat-value">{stats?.redis.hitRate || '0%'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Uptime</span>
              <span className="stat-value">{stats?.redis.uptime || 'N/A'}</span>
            </div>
          </div>
          <div className="stat-actions">
            <button
              onClick={() => purgeCache('redis')}
              disabled={!!purging}
              className="action-btn warning"
            >
              {purging === 'redis' ? '🔄' : '🧹'} Flush Redis
            </button>
          </div>
        </div>

        {/* CDN Cache */}
        <div className="cache-stat-card cdn">
          <div className="stat-header">
            <span className="stat-icon">🌐</span>
            <h3>CDN Cache</h3>
            <span className={`status-badge ${stats?.cdn.enabled ? 'enabled' : 'disabled'}`}>
              {stats?.cdn.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Zones</span>
              <span className="stat-value">{stats?.cdn.zones || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hits</span>
              <span className="stat-value">{stats?.cdn.hits?.toLocaleString() || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bandwidth</span>
              <span className="stat-value">{stats?.cdn.bandwidth || '0 MB'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hit Ratio</span>
              <span className="stat-value">{stats?.cdn.cacheHitRatio || '0%'}</span>
            </div>
          </div>
          <div className="stat-actions">
            <button
              onClick={() => purgeCache('cdn')}
              disabled={!!purging}
              className="action-btn warning"
            >
              {purging === 'cdn' ? '🔄' : '🌐'} Purge CDN
            </button>
          </div>
        </div>

        {/* Memory Cache */}
        <div className="cache-stat-card memory">
          <div className="stat-header">
            <span className="stat-icon">💾</span>
            <h3>Memory Cache</h3>
            <span className="status-badge active">Active</span>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Entries</span>
              <span className="stat-value">{stats?.memory.entries || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Size</span>
              <span className="stat-value">{stats?.memory.size || '0 MB'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Size</span>
              <span className="stat-value">{stats?.memory.maxSize || '0 MB'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Hit Rate</span>
              <span className="stat-value">{stats?.memory.hitRate || '0%'}</span>
            </div>
          </div>
          <div className="stat-actions">
            <button
              onClick={() => purgeCache('memory')}
              disabled={!!purging}
              className="action-btn warning"
            >
              {purging === 'memory' ? '🔄' : '💾'} Clear Memory
            </button>
          </div>
        </div>

        {/* Performance */}
        <div className="cache-stat-card performance">
          <div className="stat-header">
            <span className="stat-icon">🚀</span>
            <h3>Performance</h3>
            <span className="status-badge optimized">Optimized</span>
          </div>
          <div className="stat-content">
            <div className="stat-item">
              <span className="stat-label">Avg Response</span>
              <span className="stat-value">{stats?.performance?.averageResponseTime || '0ms'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Efficiency</span>
              <span className="stat-value">{stats?.performance?.cacheEfficiency || '0%'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory Usage</span>
              <span className="stat-value">{stats?.performance?.memoryUsage || '0%'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Status</span>
              <span className="stat-value optimal">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Purge Actions */}
      <div className="quick-purge-section">
        <h3>Quick Purge Actions</h3>
        <div className="purge-actions-grid">
          <button
            onClick={() => purgeCache('news')}
            disabled={!!purging}
            className="purge-btn primary"
          >
            {purging === 'news' ? '🔄' : '📰'} News Cache
          </button>
          <button
            onClick={() => purgeCache('images')}
            disabled={!!purging}
            className="purge-btn secondary"
          >
            {purging === 'images' ? '🔄' : '🖼️'} Image Cache
          </button>
          <button
            onClick={() => purgeCache('users')}
            disabled={!!purging}
            className="purge-btn info"
          >
            {purging === 'users' ? '🔄' : '👥'} User Data
          </button>
          <button
            onClick={() => purgeCache('sessions')}
            disabled={!!purging}
            className="purge-btn warning"
          >
            {purging === 'sessions' ? '🔄' : '🔐'} Sessions
          </button>
          <button
            onClick={flushAllCaches}
            disabled={!!purging}
            className="purge-btn danger"
          >
            {purging === 'all' ? '🔄' : '💥'} All Caches
          </button>
        </div>
      </div>

      {/* Custom Purge */}
      <div className="custom-purge-section">
        <h3>Custom Cache Purge</h3>
        <div className="custom-purge-controls">
          <input
            type="text"
            placeholder="Enter cache key pattern (e.g., news:*, user:123:*)"
            className="key-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value) {
                  purgeCache('key', target.value);
                  target.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('.key-input') as HTMLInputElement;
              if (input?.value) {
                purgeCache('key', input.value);
                input.value = '';
              }
            }}
            disabled={!!purging}
            className="purge-btn custom"
          >
            {purging === 'key' ? '🔄' : '🔍'} Purge by Key
          </button>
        </div>
      </div>

      {/* Last Purge Result */}
      {lastPurge && (
        <div className={`purge-result ${lastPurge.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <span className="result-icon">
              {lastPurge.success ? '✅' : '❌'}
            </span>
            <span className="result-message">{lastPurge.message}</span>
          </div>
          {lastPurge.purgedItems && (
            <div className="result-details">
              Purged items: {lastPurge.purgedItems}
            </div>
          )}
          <div className="result-timestamp">
            {new Date().toLocaleString()}
          </div>
        </div>
      )}

      {/* Cache Configuration */}
      <div className="cache-config-section">
        <h3>Cache Configuration</h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Redis TTL (seconds)</label>
            <div className="config-control">
              <input type="number" defaultValue="3600" />
              <button className="config-save-btn">💾 Save</button>
            </div>
          </div>
          <div className="config-item">
            <label>Memory Cache Size</label>
            <div className="config-control">
              <select defaultValue="100">
                <option value="50">50 MB</option>
                <option value="100">100 MB</option>
                <option value="200">200 MB</option>
                <option value="500">500 MB</option>
              </select>
              <button className="config-save-btn">💾 Save</button>
            </div>
          </div>
          <div className="config-item">
            <label>CDN Cache Duration</label>
            <div className="config-control">
              <select defaultValue="86400">
                <option value="3600">1 Hour</option>
                <option value="21600">6 Hours</option>
                <option value="86400">1 Day</option>
                <option value="604800">1 Week</option>
              </select>
              <button className="config-save-btn">💾 Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Analytics */}
      <div className="cache-analytics">
        <h3>Cache Performance Analytics</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <span className="analytics-label">Total Cache Hits</span>
            <span className="analytics-value">1,234,567</span>
            <span className="analytics-trend up">↑ 12%</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-label">Cache Misses</span>
            <span className="analytics-value">23,456</span>
            <span className="analytics-trend down">↓ 5%</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-label">Memory Usage</span>
            <span className="analytics-value">45%</span>
            <span className="analytics-trend stable">→ Stable</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-label">Avg Save Time</span>
            <span className="analytics-value">2.3ms</span>
            <span className="analytics-trend up">↑ 8%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheManagement;