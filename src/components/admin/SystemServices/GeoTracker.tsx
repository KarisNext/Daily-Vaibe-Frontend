// frontend/src/components/admin/SystemServices/GeoTracker.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface GeoDevice {
  sessionId: string;
  category: string;
  county: string;
  town: string;
  visitCount: number;
  firstSeen: string;
  lastSeen: string;
  status: 'online' | 'recent' | 'today' | 'inactive';
}

interface RegionStats {
  category: string;
  county: string;
  uniqueSessions: number;
  uniqueTowns: number;
  totalVisits: number;
  lastActivity: string;
}

interface CategoryTotal {
  category: string;
  totalSessions: number;
  totalCounties: number;
  totalTowns: number;
  totalVisits: number;
  activeNow: number;
}

const GeoTracker: React.FC = () => {
  const [devices, setDevices] = useState<GeoDevice[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [activeDevices, setActiveDevices] = useState(0);
  const [totalDevices, setTotalDevices] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeoStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system-services/geo/stats');
      const data = await response.json();
      
      if (data.success) {
        const regions = data.byRegion || [];
        const categories = data.byCategory || [];
        
        setRegionStats(regions.map((r: any) => ({
          category: r.category,
          county: r.county,
          uniqueSessions: r.uniqueSessions || 0,
          uniqueTowns: r.uniqueTowns || 0,
          totalVisits: r.totalVisits || 0,
          lastActivity: r.lastActivity
        })));
        
        setCategoryTotals(categories.map((c: any) => ({
          category: c.category,
          totalSessions: c.totalSessions || 0,
          totalCounties: c.totalCounties || 0,
          totalTowns: c.totalTowns || 0,
          totalVisits: c.totalVisits || 0,
          activeNow: c.activeNow || 0
        })));
        
        setActiveDevices(data.totalActive || 0);
        
        const totalFromCategories = categories.reduce((sum: number, c: any) => sum + (c.totalSessions || 0), 0);
        setTotalDevices(totalFromCategories);
        
        setError(null);
      } else {
        setError('Failed to load geo statistics');
      }
    } catch (error) {
      console.error('Error fetching geo stats:', error);
      setError('Failed to fetch geo statistics');
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCounty !== 'all') params.append('county', selectedCounty);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/system-services/geo/devices?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const deviceList = data.devices || [];
        setDevices(deviceList.map((d: any) => ({
          sessionId: d.sessionId || d.session_id,
          category: d.category,
          county: d.county,
          town: d.town,
          visitCount: d.visitCount || d.visit_count || 0,
          firstSeen: d.firstSeen || d.first_seen,
          lastSeen: d.lastSeen || d.last_seen,
          status: d.status
        })));
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch device list');
    }
  }, [selectedCategory, selectedCounty]);

  const fetchActiveDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/system-services/geo/active');
      const data = await response.json();
      
      if (data.success) {
        setActiveDevices(data.total || 0);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching active devices:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchGeoStats(), fetchDevices(), fetchActiveDevices()]);
      setIsLoading(false);
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchGeoStats();
        fetchDevices();
        fetchActiveDevices();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [fetchGeoStats, fetchDevices, fetchActiveDevices, autoRefresh, selectedCategory, selectedCounty]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'online';
      case 'recent': return 'recent';
      case 'today': return 'today';
      default: return 'inactive';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'KENYA': return '🇰🇪';
      case 'EAST_AFRICA': return '🌍';
      case 'AFRICA': return '🌍';
      case 'GLOBAL': return '🌎';
      case 'UNKNOWN': return '❓';
      default: return '🌍';
    }
  };

  if (isLoading) {
    return (
      <div className="geo-tracker-loading">
        <div className="loading-spinner">🌍</div>
        <p>Loading Geographic Data...</p>
      </div>
    );
  }

  return (
    <div className="geo-tracker">
      <div className="tracker-header">
        <div className="header-info">
          <h2>🌍 Geographic Tracker</h2>
          <p>Real-time device tracking by location ({totalDevices} total devices)</p>
        </div>
        <div className="header-controls">
          <button
            className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🟢 Auto Refresh' : '⚪ Auto Refresh'}
          </button>
          <button className="refresh-btn" onClick={() => {
            fetchGeoStats();
            fetchDevices();
            fetchActiveDevices();
          }}>
            🔄 Refresh Data
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
        <div className="overview-card active">
          <div className="card-icon">🟢</div>
          <div className="card-content">
            <span className="card-label">Active Now</span>
            <span className="card-value">{activeDevices.toLocaleString()}</span>
            <span className="card-sublabel">Last 15 minutes</span>
          </div>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="overview-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <span className="card-label">No Data</span>
              <span className="card-value">0</span>
              <span className="card-sublabel">Visit pages to generate geo data</span>
            </div>
          </div>
        ) : (
          categoryTotals.map(cat => (
            <div key={cat.category} className="overview-card">
              <div className="card-icon">{getCategoryIcon(cat.category)}</div>
              <div className="card-content">
                <span className="card-label">{cat.category.replace('_', ' ')}</span>
                <span className="card-value">{cat.totalSessions.toLocaleString()}</span>
                <span className="card-sublabel">
                  {cat.totalCounties} regions • {cat.totalTowns} locations
                  {cat.activeNow > 0 && ` • ${cat.activeNow} active`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="tracker-filters-advanced">
        <div className="filters-header">
          <h3>🔍 Filter Devices</h3>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Category:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="KENYA">Kenya</option>
              <option value="EAST_AFRICA">East Africa</option>
              <option value="AFRICA">Africa</option>
              <option value="GLOBAL">Global</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          <div className="filter-group">
            <label>County/Region:</label>
            <select value={selectedCounty} onChange={(e) => setSelectedCounty(e.target.value)}>
              <option value="all">All Regions</option>
              {regionStats
                .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
                .map(r => (
                  <option key={`${r.category}-${r.county}`} value={r.county}>
                    {r.county} ({r.uniqueSessions})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {(selectedCategory !== 'all' || selectedCounty !== 'all') && (
          <div className="active-filters">
            {selectedCategory !== 'all' && (
              <div className="filter-chip">
                <span>Category: {selectedCategory}</span>
                <button className="filter-chip-remove" onClick={() => setSelectedCategory('all')}>×</button>
              </div>
            )}
            {selectedCounty !== 'all' && (
              <div className="filter-chip">
                <span>County: {selectedCounty}</span>
                <button className="filter-chip-remove" onClick={() => setSelectedCounty('all')}>×</button>
              </div>
            )}
          </div>
        )}
      </div>

      {regionStats.length > 0 && (
        <div className="region-stats-section">
          <h3>📊 Regional Statistics</h3>
          <div className="stats-grid">
            {regionStats
              .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
              .slice(0, 12)
              .map(stat => (
                <div key={`${stat.category}-${stat.county}`} className="stat-card">
                  <div className="stat-header">
                    <span className="stat-category">{getCategoryIcon(stat.category)}</span>
                    <span className="stat-county">{stat.county}</span>
                  </div>
                  <div className="stat-metrics">
                    <div className="metric">
                      <span className="metric-label">Sessions</span>
                      <span className="metric-value">{stat.uniqueSessions.toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Towns</span>
                      <span className="metric-value">{stat.uniqueTowns}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Visits</span>
                      <span className="metric-value">{stat.totalVisits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="devices-section">
        <div className="devices-header">
          <h3>📱 Device Sessions</h3>
          <span className="devices-count">{devices.length} devices</span>
        </div>
        
        {devices.length === 0 ? (
          <div className="no-devices">
            <div className="no-results-icon">🔍</div>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No device sessions found
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {selectedCategory !== 'all' || selectedCounty !== 'all' 
                ? 'Try adjusting your filters or visit some pages to generate geo data'
                : 'Visit pages on your site to start tracking geographic data'}
            </p>
          </div>
        ) : (
          <div className="devices-table-container">
            <table className="devices-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Category</th>
                  <th>County/Region</th>
                  <th>Town</th>
                  <th>Visits</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.sessionId}>
                    <td>
                      <span 
                        className={`status-indicator ${getStatusColor(device.status)}`}
                        title={device.status}
                      />
                    </td>
                    <td>
                      <span className="category-badge">
                        {getCategoryIcon(device.category)}
                        {' '}{device.category}
                      </span>
                    </td>
                    <td>{device.county || 'Unknown'}</td>
                    <td>{device.town || 'Unknown'}</td>
                    <td>{device.visitCount}</td>
                    <td>{formatDate(device.firstSeen)}</td>
                    <td>{formatDate(device.lastSeen)}</td>
                    <td>
                      <code className="session-id">
                        {device.sessionId.substring(0, 8)}...
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cleanup-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>About Geographic Tracking:</strong> This tracker monitors visitor locations based on CloudFlare headers 
          and categorizes them into Kenya (counties), East Africa, Africa, and Global regions. Active devices are those 
          seen in the last 15 minutes. Data refreshes automatically every 30 seconds when auto-refresh is enabled.
        </div>
      </div>
    </div>
  );
};

export default GeoTracker;