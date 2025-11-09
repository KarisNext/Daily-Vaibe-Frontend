// frontend/src/components/admin/SystemServices.tsx
'use client';

import React, { useState, useEffect } from 'react';
import SessionCleanup from './SystemServices/SessionCleanup';
import GeoTracker from './SystemServices/GeoTracker';
import CacheManagement from './SystemServices/CacheManagement';
import DatabaseOptimization from './SystemServices/DatabaseOptimization';
import SystemMonitoring from './SystemServices/SystemMonitoring';

type ServiceModule = 'overview' | 'session-cleanup' | 'geo-tracker' | 'cache-management' | 'database-optimization' | 'system-monitoring' | 'backup-recovery' | 'email-service' | 'logs-analytics';

interface ServiceConfig {
  id: ServiceModule;
  label: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'coming-soon';
  badge?: string;
  component?: React.ComponentType;
}

const SystemServices: React.FC = () => {
  const [activeService, setActiveService] = useState<ServiceModule>('overview');
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');
  const [navOpen, setNavOpen] = useState(false);

  const services: ServiceConfig[] = [
    {
      id: 'overview',
      label: 'Services Overview',
      description: 'Dashboard and system status',
      icon: '📊',
      status: 'active'
    },
    {
      id: 'session-cleanup',
      label: 'Session Cleanup',
      description: 'Cookie & session management',
      icon: '🧹',
      status: 'active',
      component: SessionCleanup
    },
    {
      id: 'geo-tracker',
      label: 'Geographic Tracker',
      description: 'Location-based device tracking',
      icon: '🌍',
      status: 'active',
      component: GeoTracker
    },
    {
      id: 'cache-management',
      label: 'Cache Management',
      description: 'CDN & memory cache control',
      icon: '⚡',
      status: 'active',
      component: CacheManagement
    },
    {
      id: 'database-optimization',
      label: 'Database Optimization',
      description: 'VACUUM, ANALYZE & indexing',
      icon: '🗃️',
      status: 'active',
      component: DatabaseOptimization
    },
    {
      id: 'system-monitoring',
      label: 'System Monitoring',
      description: 'Real-time performance metrics',
      icon: '📈',
      status: 'coming-soon',
      badge: 'NEW',
      component: SystemMonitoring
    },
    {
      id: 'backup-recovery',
      label: 'Backup & Recovery',
      description: 'Database backups & restoration',
      icon: '💾',
      status: 'coming-soon'
    },
    {
      id: 'email-service',
      label: 'Email Service',
      description: 'Email queue & delivery tracking',
      icon: '📧',
      status: 'coming-soon'
    },
    {
      id: 'logs-analytics',
      label: 'Logs & Analytics',
      description: 'System logs & error tracking',
      icon: '📝',
      status: 'coming-soon'
    }
  ];

  const activeServiceConfig = services.find(s => s.id === activeService);
  const ActiveComponent = activeServiceConfig?.component;

  useEffect(() => {
    setNavOpen(false);
  }, [activeService]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navOpen) {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navOpen]);

  const renderOverview = () => (
    <div className="geo-tracker">
      <div className="tracker-header">
        <div className="header-info">
          <h2>🎛️ System Services Dashboard</h2>
          <p>Comprehensive system management and automation dashboard</p>
        </div>
        <div className="header-controls">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.75rem',
            background: 'rgba(0, 255, 136, 0.15)',
            border: '2px solid var(--admin-primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--admin-primary)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <span className="status-indicator online"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      <div className="category-overview">
        <div className="overview-card active">
          <div className="card-icon">🧹</div>
          <div className="card-content">
            <span className="card-label">Session Cleanup</span>
            <span className="card-value">Active</span>
            <span className="card-sublabel">Auto-cleanup running</span>
          </div>
        </div>

        <div className="overview-card active">
          <div className="card-icon">🌍</div>
          <div className="card-content">
            <span className="card-label">Geo Tracker</span>
            <span className="card-value">Active</span>
            <span className="card-sublabel">Location tracking enabled</span>
          </div>
        </div>

        <div className="overview-card active">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <span className="card-label">Cache System</span>
            <span className="card-value">Optimal</span>
            <span className="card-sublabel">Hit rate: 95%</span>
          </div>
        </div>

        <div className="overview-card active">
          <div className="card-icon">🗃️</div>
          <div className="card-content">
            <span className="card-label">Database</span>
            <span className="card-value">Healthy</span>
            <span className="card-sublabel">Last optimized 2h ago</span>
          </div>
        </div>
      </div>

      <div className="region-stats-section">
        <h3>🚀 Active Services</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Click on any service to manage and configure
        </p>

        <div className="stats-grid">
          {services.filter(s => s.status === 'active' && s.id !== 'overview').map(service => (
            <button
              key={service.id}
              onClick={() => setActiveService(service.id)}
              className="stat-card"
              style={{ 
                cursor: 'pointer',
                border: '2px solid var(--border-primary)',
                background: 'var(--bg-content)',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div className="stat-header" style={{ 
                borderBottom: 'none', 
                paddingBottom: '0.5rem',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span className="stat-category" style={{ fontSize: '1.5rem' }}>{service.icon}</span>
                <span className="stat-county" style={{ flex: 1 }}>{service.label}</span>
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                lineHeight: 1.4
              }}>
                {service.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="devices-section">
        <div className="devices-header">
          <h3>🔮 Coming Soon</h3>
          <span className="devices-count">Services in development</span>
        </div>

        <div className="devices-cards">
          {services.filter(s => s.status === 'coming-soon').map(service => (
            <div key={service.id} className="device-card">
              <div className="device-card-header">
                <div className="device-card-status">
                  <span style={{ fontSize: '1.5rem' }}>{service.icon}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {service.label}
                  </span>
                </div>
                {service.badge && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(0, 212, 255, 0.2)',
                    color: 'var(--status-info)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 212, 255, 0.3)'
                  }}>
                    {service.badge}
                  </span>
                )}
              </div>
              <div style={{ 
                padding: '0.75rem 0',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}>
                {service.description}
              </div>
              
              <div style={{ 
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-primary)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                {service.id === 'backup-recovery' && (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                    <li>💾 Automated database backups</li>
                    <li>🔄 Point-in-time recovery</li>
                    <li>📦 Backup compression & encryption</li>
                    <li>☁️ Cloud storage integration</li>
                  </ul>
                )}
                {service.id === 'email-service' && (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                    <li>📧 Email queue management</li>
                    <li>📊 Delivery tracking & analytics</li>
                    <li>🔔 Failed delivery notifications</li>
                    <li>📝 Email template management</li>
                  </ul>
                )}
                {service.id === 'logs-analytics' && (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.8 }}>
                    <li>📝 Centralized log aggregation</li>
                    <li>🔍 Advanced search & filtering</li>
                    <li>⚠️ Error tracking & alerts</li>
                    <li>📊 Usage analytics & reports</li>
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cleanup-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <strong>System Services:</strong> This dashboard provides centralized management for all VybezTribe system services. 
          Each service runs independently and can be configured, monitored, and controlled from their respective panels. 
          Automatic schedulers handle routine maintenance tasks to ensure optimal system performance.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-content)',
      color: 'var(--text-primary)'
    }}>
      <header style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-card)',
        borderBottom: '2px solid var(--border-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            System Services
          </h1>
          <p style={{ 
            margin: '0.25rem 0 0 0',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            Comprehensive system management and automation dashboard
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: systemStatus === 'online' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 51, 102, 0.15)',
            border: `2px solid ${systemStatus === 'online' ? 'var(--admin-primary)' : 'var(--status-danger)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: systemStatus === 'online' ? 'var(--admin-primary)' : 'var(--status-danger)'
          }}>
            <span className={`status-indicator ${systemStatus === 'online' ? 'online' : 'inactive'}`}></span>
            <span>{systemStatus === 'online' ? 'System Online' : 'System Offline'}</span>
          </div>
          
          <button 
            onClick={() => setNavOpen(!navOpen)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-content)',
              border: '2px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: navOpen ? 'none' : 'block'
            }}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        flex: 1,
        position: 'relative'
      }}>
        <nav style={{
          width: navOpen ? '280px' : '0',
          background: 'var(--bg-card)',
          borderRight: '2px solid var(--border-primary)',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'width 0.3s ease',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          padding: navOpen ? '1rem' : '0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid var(--border-primary)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Navigation</h3>
            <button
              onClick={() => setNavOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Core Services
            </h4>
            {services.filter(s => ['overview', 'session-cleanup', 'geo-tracker', 'cache-management', 'database-optimization'].includes(s.id)).map(service => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                disabled={service.status === 'coming-soon'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: activeService === service.id ? 'rgba(0, 255, 136, 0.15)' : 'transparent',
                  border: activeService === service.id ? '2px solid var(--admin-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  color: activeService === service.id ? 'var(--admin-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: service.status === 'coming-soon' ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  opacity: service.status === 'coming-soon' ? 0.5 : 1
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{service.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>{service.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {service.description}
                  </div>
                </div>
                <span className={`status-indicator ${service.status === 'active' ? 'online' : service.status === 'coming-soon' ? 'recent' : 'inactive'}`}></span>
              </button>
            ))}
          </div>

          <div>
            <h4 style={{ 
              margin: '0 0 0.5rem 0',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Additional Services
            </h4>
            {services.filter(s => !['overview', 'session-cleanup', 'geo-tracker', 'cache-management', 'database-optimization'].includes(s.id)).map(service => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                disabled={service.status === 'coming-soon'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: activeService === service.id ? 'rgba(0, 255, 136, 0.15)' : 'transparent',
                  border: activeService === service.id ? '2px solid var(--admin-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  color: activeService === service.id ? 'var(--admin-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: service.status === 'coming-soon' ? 'not-allowed' : 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  opacity: service.status === 'coming-soon' ? 0.5 : 1
                }}
              >
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{service.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                    {service.label}
                    {service.badge && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.375rem',
                        background: 'rgba(0, 212, 255, 0.2)',
                        color: 'var(--status-info)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.6rem',
                        fontWeight: 700
                      }}>
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {service.description}
                  </div>
                </div>
                <span className={`status-indicator ${service.status === 'active' ? 'online' : service.status === 'coming-soon' ? 'recent' : 'inactive'}`}></span>
              </button>
            ))}
          </div>
        </nav>

        <main style={{ 
          flex: 1,
          padding: '0',
          minHeight: '100vh',
          marginLeft: navOpen ? '280px' : '0',
          transition: 'margin-left 0.3s ease'
        }}>
          {activeService === 'overview' && renderOverview()}
          
          {ActiveComponent && activeService !== 'overview' && (
            <React.Suspense fallback={
              <div className="geo-tracker-loading">
                <div className="loading-spinner">🔄</div>
                <p>Loading {activeServiceConfig?.label}...</p>
              </div>
            }>
              <ActiveComponent />
            </React.Suspense>
          )}
        </main>
      </div>

      {navOpen && (
        <div 
          onClick={() => setNavOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default SystemServices;