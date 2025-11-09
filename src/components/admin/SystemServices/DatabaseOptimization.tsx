// frontend/src/components/admin/SystemServices/DatabaseOptimization.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TableStats {
  schemaname: string;
  table_name: string;
  row_count: number;
  dead_rows: number;
  last_vacuum: string;
  last_autovacuum: string;
  last_analyze: string;
  last_autoanalyze: string;
}

interface IndexStats {
  schemaname: string;
  table_name: string;
  index_name: string;
  index_scans: number;
  tuples_read: number;
  tuples_fetched: number;
}

interface DatabaseStats {
  tables: TableStats[];
  indexes: IndexStats[];
  performance: any;
  totalTables: number;
  totalIndexes: number;
  cacheHitRatio: string;
}

const DatabaseOptimization: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [operationLoading, setOperationLoading] = useState<string>('');

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/database-optimization/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runVacuum = async (analyze: boolean = false) => {
    setOperationLoading('vacuum');
    try {
      const response = await fetch('/api/admin/database-optimization/vacuum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: selectedTable || undefined,
          analyze
        })
      });
      
      if (response.ok) {
        alert(`VACUUM ${analyze ? 'ANALYZE ' : ''}operation completed successfully`);
        await fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error running VACUUM:', error);
      alert('VACUUM operation failed');
    } finally {
      setOperationLoading('');
    }
  };

  const runReindex = async () => {
    setOperationLoading('reindex');
    try {
      const response = await fetch('/api/admin/database-optimization/reindex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: selectedIndex || undefined,
          table: selectedTable || undefined
        })
      });
      
      if (response.ok) {
        alert('Reindex operation completed successfully');
        await fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error running REINDEX:', error);
      alert('Reindex operation failed');
    } finally {
      setOperationLoading('');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="database-optimization">
        <div className="loading-spinner">🔄 Loading Database Statistics...</div>
      </div>
    );
  }

  return (
    <div className="database-optimization">
      <div className="module-header">
        <h2>🗃️ Database Optimization</h2>
        <p>Database maintenance, indexing, and performance optimization</p>
      </div>

      {/* Performance Overview */}
      <div className="performance-overview">
        <h3>Performance Overview</h3>
        <div className="performance-grid">
          <div className="perf-card">
            <span className="perf-label">Cache Hit Ratio</span>
            <span className="perf-value">{stats?.cacheHitRatio}%</span>
          </div>
          <div className="perf-card">
            <span className="perf-label">Total Tables</span>
            <span className="perf-value">{stats?.totalTables}</span>
          </div>
          <div className="perf-card">
            <span className="perf-label">Total Indexes</span>
            <span className="perf-value">{stats?.totalIndexes}</span>
          </div>
          <div className="perf-card">
            <span className="perf-label">Active Connections</span>
            <span className="perf-value">{stats?.performance?.connections}</span>
          </div>
        </div>
      </div>

      {/* Optimization Actions */}
      <div className="optimization-actions">
        <h3>Optimization Tools</h3>
        
        <div className="action-group">
          <div className="action-controls">
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="table-select"
            >
              <option value="">All Tables</option>
              {stats?.tables.map(table => (
                <option key={table.table_name} value={table.table_name}>
                  {table.table_name} ({table.row_count} rows)
                </option>
              ))}
            </select>
            
            <button
              onClick={() => runVacuum(false)}
              disabled={!!operationLoading}
              className="action-btn primary"
            >
              {operationLoading === 'vacuum' ? '🔄' : '🧹'} VACUUM
            </button>
            
            <button
              onClick={() => runVacuum(true)}
              disabled={!!operationLoading}
              className="action-btn secondary"
            >
              {operationLoading === 'vacuum' ? '🔄' : '📊'} VACUUM ANALYZE
            </button>
          </div>

          <div className="action-controls">
            <select 
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              className="index-select"
            >
              <option value="">All Indexes</option>
              {stats?.indexes.map(index => (
                <option key={index.index_name} value={index.index_name}>
                  {index.index_name} ({index.index_scans} scans)
                </option>
              ))}
            </select>
            
            <button
              onClick={runReindex}
              disabled={!!operationLoading}
              className="action-btn warning"
            >
              {operationLoading === 'reindex' ? '🔄' : '🔧'} REINDEX
            </button>
          </div>
        </div>
      </div>

      {/* Table Statistics */}
      <div className="table-statistics">
        <h3>Table Statistics</h3>
        <div className="table-list">
          {stats?.tables.slice(0, 10).map(table => (
            <div key={table.table_name} className="table-card">
              <div className="table-header">
                <span className="table-name">{table.table_name}</span>
                <span className="table-rows">{table.row_count.toLocaleString()} rows</span>
              </div>
              <div className="table-details">
                <span>Dead rows: {table.dead_rows}</span>
                <span>Last vacuum: {table.last_vacuum ? new Date(table.last_vacuum).toLocaleString() : 'Never'}</span>
                <span>Last analyze: {table.last_analyze ? new Date(table.last_analyze).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Index Statistics */}
      <div className="index-statistics">
        <h3>Top Indexes by Usage</h3>
        <div className="index-list">
          {stats?.indexes.slice(0, 10).map(index => (
            <div key={index.index_name} className="index-card">
              <div className="index-header">
                <span className="index-name">{index.index_name}</span>
                <span className="index-scans">{index.index_scans} scans</span>
              </div>
              <div className="index-details">
                <span>Table: {index.table_name}</span>
                <span>Tuples read: {index.tuples_read?.toLocaleString()}</span>
                <span>Tuples fetched: {index.tuples_fetched?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseOptimization;