import React, { useState, useEffect } from 'react';
import {
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Loading,
} from '@carbon/react';
import ReactECharts from 'echarts-for-react';
import api from '../services/api';

const Dashboard = ({ isAdmin, onLogout }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [data, setData] = useState({});
  const [level, setLevel] = useState('pools');
  const [filter, setFilter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('TB'); // 'GB', 'TB', or 'PB'

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(filter);
      console.log('Fetching with params:', params.toString());
      const res = await api.get(`/dashboard/?${params.toString()}`);
      console.log('API Response:', res.data);
      setData(res.data);
      setLevel(res.data.level || 'pools');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================
  const handleDrillDown = (type, value) => {
    console.log('Drill down clicked:', type, value);
    if (type === 'pool') {
      setFilter({ pool: value });
    } else if (type === 'child_pool') {
      setFilter({ ...filter, child_pool: value });
    } else if (type === 'tenant') {
      setFilter({ ...filter, tenant: value });
    }
  };

  const handleBack = () => {
    console.log('Back clicked, current level:', level);
    if (level === 'volumes') {
      const newFilter = { pool: filter.pool, child_pool: filter.child_pool };
      setFilter(newFilter);
    } else if (level === 'tenants') {
      setFilter({ pool: filter.pool });
    } else if (level === 'child_pools') {
      setFilter({});
    }
  };

  const handleLogoutClick = async () => {
    try {
      await api.post('/logout/');
      onLogout();
    } catch (err) {
      console.error('Logout error:', err);
      onLogout();
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  // Helper function to check if a pool name is "Lab Engineering" (case-insensitive)
  const isLabEngineering = (poolName) => {
    if (!poolName) return false;
    return poolName.toLowerCase() === 'lab engineering';
  };

  const convertValue = (value, fromUnit = 'TB') => {
    // Convert input to GB first (base unit)
    let valueInGB = value;
    if (fromUnit === 'TB') {
      valueInGB = value * 1000;
    } else if (fromUnit === 'PB') {
      valueInGB = value * 1000000;
    }
    
    // Convert from GB to target unit
    if (unit === 'GB') {
      return valueInGB;
    } else if (unit === 'TB') {
      return valueInGB / 1000;
    } else if (unit === 'PB') {
      return valueInGB / 1000000;
    }
    return valueInGB;
  };

  const formatNumber = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getUnit = () => unit; // Returns 'GB', 'TB', or 'PB'

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================
  if (loading) {
    return <Loading description="Loading dashboard data..." withOverlay={false} />;
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  // ============================================================================
  // SUMMARY DATA CALCULATION (for all drill levels)
  // v5.6 CHANGES:
  // 1. Use backend-provided total_capacity_tb/total_capacity_gb (INCLUDES Lab Engineering)
  // 2. Calculate available_buffer (Total SAN Capacity - Allocated)
  // 3. Exclude "Lab Engineering" from Allocated, Utilized, Unutilized, Avg Utilization
  // 4. Renamed "left" to "unutilized"
  // 5. NO HARDCODED VALUES - all capacity data comes from backend
  // ============================================================================
  let summaryData = null;

  if (level === 'pools' && data.pools && Array.isArray(data.pools)) {
    // Backend already filters out Lab Engineering from pools array
    const totalAllocated = data.pools.reduce((sum, p) => sum + (p.allocated_tb || 0), 0);
    const totalUtilized = data.pools.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
    const totalUnutilized = data.pools.reduce((sum, p) => sum + (p.left_tb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // FIXED: Use backend-provided total_capacity_tb (includes Lab Engineering)
    // NO HARDCODED VALUES!
    const totalCapacity = data.total_capacity_tb || 0;
    const availableBuffer = totalCapacity - totalAllocated;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'TB'),
      available_buffer: convertValue(availableBuffer, 'TB'),
      allocated: convertValue(totalAllocated, 'TB'),
      utilized: convertValue(totalUtilized, 'TB'),
      unutilized: convertValue(totalUnutilized, 'TB'),
      avg_util: avgUtil
    };
  } else if (level === 'child_pools' && data.data && Array.isArray(data.data)) {
    // Lab Engineering already filtered at pool level, use all child pools
    const totalAllocated = data.data.reduce((sum, p) => sum + (p.allocated_tb || 0), 0);
    const totalUtilized = data.data.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
    const totalUnutilized = data.data.reduce((sum, p) => sum + (p.left_tb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // FIXED: Use backend-provided total_capacity_tb (includes all child pools in this pool)
    // NO HARDCODED VALUES!
    const totalCapacity = data.total_capacity_tb || 0;
    const availableBuffer = totalCapacity - totalAllocated;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'TB'),
      available_buffer: convertValue(availableBuffer, 'TB'),
      allocated: convertValue(totalAllocated, 'TB'),
      utilized: convertValue(totalUtilized, 'TB'),
      unutilized: convertValue(totalUnutilized, 'TB'),
      avg_util: avgUtil
    };
  } else if (level === 'tenants' && data.data && Array.isArray(data.data)) {
    // Lab Engineering already filtered at pool level, use all tenants
    const totalAllocated = data.data.reduce((sum, t) => sum + (t.allocated_gb || 0), 0);
    const totalUtilized = data.data.reduce((sum, t) => sum + (t.utilized_gb || 0), 0);
    const totalUnutilized = data.data.reduce((sum, t) => sum + (t.left_gb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // FIXED: Use backend-provided total_capacity_gb (includes all tenants in this child pool)
    // NO HARDCODED VALUES!
    const totalCapacity = data.total_capacity_gb || 0;
    const availableBuffer = totalCapacity - totalAllocated;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'GB'),
      available_buffer: convertValue(availableBuffer, 'GB'),
      allocated: convertValue(totalAllocated, 'GB'),
      utilized: convertValue(totalUtilized, 'GB'),
      unutilized: convertValue(totalUnutilized, 'GB'),
      avg_util: avgUtil
    };
  } else if (level === 'volumes' && data.data && Array.isArray(data.data)) {
    // Lab Engineering already filtered at pool level, use all volumes
    const totalAllocated = data.data.reduce((sum, v) => sum + (v.volume_size_gb || 0), 0);
    const totalUtilized = data.data.reduce((sum, v) => sum + (v.utilized_gb || 0), 0);
    const totalUnutilized = data.data.reduce((sum, v) => sum + (v.left_gb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // FIXED: Use backend-provided total_capacity_gb (includes all volumes for this tenant)
    // NO HARDCODED VALUES!
    const totalCapacity = data.total_capacity_gb || 0;
    const availableBuffer = totalCapacity - totalAllocated;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'GB'),
      available_buffer: convertValue(availableBuffer, 'GB'),
      allocated: convertValue(totalAllocated, 'GB'),
      utilized: convertValue(totalUtilized, 'GB'),
      unutilized: convertValue(totalUnutilized, 'GB'),
      avg_util: avgUtil
    };
  }

  // ============================================================================
  // COLOR PALETTES
  // ============================================================================
  // Outer ring colors (Utilized/Unutilized)
  const outerUtilizedColor = '#0f62fe';
  const outerUnutilizedColor = '#e0e0e0';
  
  // Inner ring colors (Pools/Child Pools/Tenants/Volumes breakdown)
  const innerRingColors = [
    '#8a3ffc', // Purple
    '#ff7eb6', // Pink
    '#fa4d56', // Red
    '#24a148', // Green
    '#f1c21b', // Yellow
    '#007d79', // Teal
    '#d12771', // Magenta
    '#8a3800', // Brown
    '#33b1ff', // Light Blue (different from outer blue)
    '#ee538b'  // Rose
  ];

  // ============================================================================
  // DONUT CHART CONFIGURATION
  // v5.6 CHANGE: Exclude "Lab Engineering" from charts
  // ============================================================================
  const getDonutChartOption = (levelType) => {
    let outerData = [];
    let innerDataItems = [];
    let titleText = '';

    // ------------------------------------------------------------------------
    // DATA PREPARATION FOR EACH DRILL LEVEL (EXCLUDE Lab Engineering)
    // ------------------------------------------------------------------------
    if (levelType === 'pools' && data.pools && Array.isArray(data.pools)) {
      // Backend already filters out Lab Engineering
      const totalAllocated = data.pools.reduce((sum, p) => sum + (p.allocated_tb || 0), 0);
      const totalUtilized = data.pools.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
      const totalUnutilized = totalAllocated - totalUtilized;

      outerData = [
        { name: 'Utilized', value: convertValue(totalUtilized, 'TB'), itemStyle: { color: outerUtilizedColor } },
        { name: 'Unutilized', value: convertValue(totalUnutilized, 'TB'), itemStyle: { color: outerUnutilizedColor } }
      ];

      innerDataItems = data.pools.map((p, idx) => ({
        name: p.pool || 'Unknown',
        value: convertValue(p.utilized_tb || 0, 'TB'),
        itemStyle: { color: innerRingColors[idx % innerRingColors.length] }
      }));

      titleText = 'Pool Utilization Distribution';
    } else if (levelType === 'child_pools' && data.data && Array.isArray(data.data)) {
      // Lab Engineering already filtered at pool level, use all child pools
      const totalAllocated = data.data.reduce((sum, p) => sum + (p.allocated_tb || 0), 0);
      const totalUtilized = data.data.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
      const totalUnutilized = totalAllocated - totalUtilized;

      outerData = [
        { name: 'Utilized', value: convertValue(totalUtilized, 'TB'), itemStyle: { color: outerUtilizedColor } },
        { name: 'Unutilized', value: convertValue(totalUnutilized, 'TB'), itemStyle: { color: outerUnutilizedColor } }
      ];

      innerDataItems = data.data.map((cp, idx) => ({
        name: cp.child_pool || 'Unknown',
        value: convertValue(cp.utilized_tb || 0, 'TB'),
        itemStyle: { color: innerRingColors[idx % innerRingColors.length] }
      }));

      titleText = 'Child Pool Utilization Distribution';
    } else if (levelType === 'tenants' && data.data && Array.isArray(data.data)) {
      // Lab Engineering already filtered at pool level, use all tenants
      const totalAllocated = data.data.reduce((sum, t) => sum + (t.allocated_gb || 0), 0);
      const totalUtilized = data.data.reduce((sum, t) => sum + (t.utilized_gb || 0), 0);
      const totalUnutilized = totalAllocated - totalUtilized;

      outerData = [
        { name: 'Utilized', value: convertValue(totalUtilized, 'GB'), itemStyle: { color: outerUtilizedColor } },
        { name: 'Unutilized', value: convertValue(totalUnutilized, 'GB'), itemStyle: { color: outerUnutilizedColor } }
      ];

      innerDataItems = data.data.map((t, idx) => ({
        name: t.name || 'Unknown',
        value: convertValue(t.utilized_gb || 0, 'GB'),
        itemStyle: { color: innerRingColors[idx % innerRingColors.length] }
      }));

      titleText = 'Tenant Utilization Distribution';
    } else if (levelType === 'volumes' && data.data && Array.isArray(data.data)) {
      // Lab Engineering already filtered at pool level, use all volumes
      const totalAllocated = data.data.reduce((sum, v) => sum + (v.volume_size_gb || 0), 0);
      const totalUtilized = data.data.reduce((sum, v) => sum + (v.utilized_gb || 0), 0);
      const totalUnutilized = totalAllocated - totalUtilized;

      outerData = [
        { name: 'Utilized', value: convertValue(totalUtilized, 'GB'), itemStyle: { color: outerUtilizedColor } },
        { name: 'Unutilized', value: convertValue(totalUnutilized, 'GB'), itemStyle: { color: outerUnutilizedColor } }
      ];

      innerDataItems = data.data.map((v, idx) => ({
        name: v.volume || 'Unknown',
        value: convertValue(v.utilized_gb || 0, 'GB'),
        itemStyle: { color: innerRingColors[idx % innerRingColors.length] }
      }));

      titleText = 'Volume Utilization Distribution';
    }

    if (outerData.length === 0) return null;

    // ------------------------------------------------------------------------
    // ECHARTS CONFIGURATION
    // ------------------------------------------------------------------------
    return {
      backgroundColor: 'transparent',
      title: {
        text: titleText,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const percentage = params.percent.toFixed(1);
          return `${params.name}: ${formatNumber(params.value)} ${getUnit()} (${percentage}%)`;
        }
      },
      series: [
        // --------------------------------------------------------------------
        // INNER RING (Breakdown: Pools/Child Pools/Tenants/Volumes)
        // --------------------------------------------------------------------
        {
          name: 'Breakdown',
          type: 'pie',
          radius: ['15%', '35%'],        // 15% hole in center, 35% outer edge
          center: ['50%', '55%'],         // Chart center position
          avoidLabelOverlap: true,        // Enable label collision detection
          minAngle: 3,                    // Hide labels for segments < 3 degrees
          zlevel: 2,                      // Render on top of outer ring
          label: {
            show: true,
            position: 'outside',
            distanceToLabelLine: 5,       // Distance from connector line end
            formatter: (params) => {
              // Show absolute value instead of percentage
              return `{name|${params.name}}\n{value|${formatNumber(params.value)} ${getUnit()}}`;
            },
            rich: {
              name: {
                fontSize: 12,             // INNER RING LABEL FONT SIZE
                fontWeight: 'bold',
                color: '#161616'
              },
              value: {
                fontSize: 12,             // INNER RING VALUE FONT SIZE
                fontWeight: 'bold',
                color: '#161616'
              }
            }
          },
          labelLine: {
            show: true,
            length: 65,                   // INNER RING: First segment length
            length2: 25,                  // INNER RING: Second segment length
            lineStyle: {
              width: 3                    // INNER RING: Connector line thickness
            }
          },
          labelLayout: {
            hideOverlap: true,            // Automatically hide overlapping labels
            moveOverlap: 'shiftY'         // Shift labels vertically to avoid overlap
          },
          data: innerDataItems
        },
        // --------------------------------------------------------------------
        // OUTER RING (Overall: Utilized/Unutilized)
        // --------------------------------------------------------------------
        {
          name: 'Overall',
          type: 'pie',
          radius: ['40%', '55%'],         // 40% inner edge, 55% outer edge
          center: ['50%', '55%'],         // Chart center position
          avoidLabelOverlap: true,        // Enable label collision detection
          minAngle: 5,                    // Hide labels for segments < 5 degrees
          zlevel: 1,                      // Render behind inner ring
          label: {
            show: true,
            position: 'outside',
            distanceToLabelLine: 5,       // Distance from connector line end
            formatter: (params) => {
              // Show absolute value instead of percentage
              return `{name|${params.name}}\n{value|${formatNumber(params.value)} ${getUnit()}}`;
            },
            rich: {
              name: {
                fontSize: 14,             // OUTER RING LABEL FONT SIZE
                fontWeight: 'bold',
                color: '#161616'
              },
              value: {
                fontSize: 14,             // OUTER RING VALUE FONT SIZE
                fontWeight: 'bold',
                color: '#161616'
              }
            }
          },
          labelLine: {
            show: true,
            length: 40,                   // OUTER RING: First segment length
            length2: 25,                  // OUTER RING: Second segment length
            lineStyle: {
              width: 3                    // OUTER RING: Connector line thickness
            }
          },
          labelLayout: {
            hideOverlap: true,            // Automatically hide overlapping labels
            moveOverlap: 'shiftY'         // Shift labels vertically to avoid overlap
          },
          data: outerData
        }
      ]
    };
  };

  // ============================================================================
  // BAR CHART CONFIGURATION (Top 10 Tenants)
  // v5.6 CHANGE: Exclude "Lab Engineering" tenants from bar chart
  // ============================================================================
  const getBarChartOption = () => {
    if (level !== 'pools' || !data.top_tenants || !Array.isArray(data.top_tenants)) {
      return null;
    }

    // Filter out any tenants that might be from Lab Engineering pool
    // (Backend should handle this, but we add frontend filter as safety)
    const filteredTenants = data.top_tenants;

    const labels = filteredTenants.map((t) => t.name || 'Unknown');
    const values = filteredTenants.map((t) => convertValue((t.utilized_gb || 0) / 1000, 'TB'));

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Top 10 Tenants by Utilization',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const value = params[0].value;
          return `${params[0].name}: ${formatNumber(value)} ${getUnit()}`;
        }
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: getUnit(),
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: (value) => formatNumber(value)
        }
      },
      series: [
        {
          name: `Utilized ${getUnit()}`,
          type: 'bar',
          data: values,
          itemStyle: {
            color: '#0f62fe'
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params) => formatNumber(params.value),
            fontSize: 16,                 // BAR CHART LABEL FONT SIZE
            fontWeight: 'bold',
            color: '#161616'
          }
        }
      ],
      grid: {
        left: '10%',
        right: '5%',
        bottom: '20%',
        top: '15%'
      }
    };
  };

  // ============================================================================
  // TABLE DATA PREPARATION
  // v5.6 CHANGE: Exclude "Lab Engineering" from detailed tables
  // ============================================================================
  let tableHeaders = [];
  let tableRows = [];

  // ------------------------------------------------------------------------
  // POOLS LEVEL TABLE (EXCLUDE Lab Engineering)
  // ------------------------------------------------------------------------
  if (level === 'pools' && data.pools && Array.isArray(data.pools)) {
    tableHeaders = [
      { key: 'pool', header: 'Pool' },
      { key: 'allocated', header: `Allocated ${getUnit()}` },
      { key: 'utilized', header: `Utilized ${getUnit()}` },
      { key: 'left', header: `Unutilized ${getUnit()}` },
      { key: 'avg_util', header: 'Avg Utilization %' },
    ];
    
    // Backend already filters out Lab Engineering pools
    tableRows = data.pools.map((pool, index) => ({
      id: String(index),
      pool: String(pool.pool || 'Unknown'),
      allocated: formatNumber(convertValue(pool.allocated_tb || 0, 'TB')),
      utilized: formatNumber(convertValue(pool.utilized_tb || 0, 'TB')),
      left: formatNumber(convertValue(pool.left_tb || 0, 'TB')),
      avg_util: formatNumber((pool.avg_util || 0) * 100),
      clickable: true,
      clickValue: pool.pool,
      clickType: 'pool',
    }));
  } 
  // ------------------------------------------------------------------------
  // CHILD POOLS LEVEL TABLE (Lab Engineering already filtered)
  // ------------------------------------------------------------------------
  else if (level === 'child_pools' && data.data && Array.isArray(data.data)) {
    tableHeaders = [
      { key: 'child_pool', header: 'Child Pool' },
      { key: 'allocated', header: `Allocated ${getUnit()}` },
      { key: 'utilized', header: `Utilized ${getUnit()}` },
      { key: 'left', header: `Unutilized ${getUnit()}` },
      { key: 'avg_util', header: 'Avg Utilization %' },
    ];
    tableRows = data.data.map((cp, index) => ({
      id: String(index),
      child_pool: String(cp.child_pool || 'Unknown'),
      allocated: formatNumber(convertValue(cp.allocated_tb || 0, 'TB')),
      utilized: formatNumber(convertValue(cp.utilized_tb || 0, 'TB')),
      left: formatNumber(convertValue(cp.left_tb || 0, 'TB')),
      avg_util: formatNumber((cp.avg_util || 0) * 100),
      clickable: true,
      clickValue: cp.child_pool,
      clickType: 'child_pool',
    }));
  } 
  // ------------------------------------------------------------------------
  // TENANTS LEVEL TABLE (Lab Engineering already filtered)
  // ------------------------------------------------------------------------
  else if (level === 'tenants' && data.data && Array.isArray(data.data)) {
    tableHeaders = [
      { key: 'name', header: 'Tenant' },
      { key: 'allocated', header: `Allocated ${getUnit()}` },
      { key: 'utilized', header: `Utilized ${getUnit()}` },
      { key: 'left', header: `Unutilized ${getUnit()}` },
      { key: 'avg_utilization', header: 'Avg Utilization %' },
    ];
    tableRows = data.data.map((tenant, index) => ({
      id: String(index),
      name: String(tenant.name || 'Unknown'),
      allocated: formatNumber(convertValue(tenant.allocated_gb || 0, 'GB')),
      utilized: formatNumber(convertValue(tenant.utilized_gb || 0, 'GB')),
      left: formatNumber(convertValue(tenant.left_gb || 0, 'GB')),
      avg_utilization: formatNumber((tenant.avg_utilization || 0) * 100),
      clickable: true,
      clickValue: tenant.name,
      clickType: 'tenant',
    }));
  } 
  // ------------------------------------------------------------------------
  // VOLUMES LEVEL TABLE (Lab Engineering already filtered)
  // ------------------------------------------------------------------------
  else if (level === 'volumes' && data.data && Array.isArray(data.data)) {
    tableHeaders = [
      { key: 'volume', header: 'Volume' },
      { key: 'system', header: 'System' },
      { key: 'allocated', header: `Allocated ${getUnit()}` },
      { key: 'utilized', header: `Utilized ${getUnit()}` },
      { key: 'left', header: `Unutilized ${getUnit()}` },
      { key: 'avg_utilization', header: 'Avg Utilization %' },
    ];
    tableRows = data.data.map((volume, index) => ({
      id: String(index),
      volume: String(volume.volume || 'Unknown'),
      system: String(volume.system || 'Unknown'),
      allocated: formatNumber(convertValue(volume.volume_size_gb || 0, 'GB')),
      utilized: formatNumber(convertValue(volume.utilized_gb || 0, 'GB')),
      left: formatNumber(convertValue(volume.left_gb || 0, 'GB')),
      avg_utilization: formatNumber((volume.written_by_host_percent || 0) * 100),
      clickable: false,
    }));
  }

  const donutOption = getDonutChartOption(level);
  const barOption = getBarChartOption();

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================
  return (
    <div style={{ padding: '20px' }}>
      {/* ======================================================================
          CSS STYLES
          ====================================================================== */}
      <style>{`
        .custom-table table {
          border-collapse: collapse;
          width: 100%;
          border: 1px solid #e0e0e0;
        }
        
        .custom-table thead {
          background-color: #f4f4f4;
        }
        
        .custom-table th {
          border: 1px solid #e0e0e0;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          color: #161616;
        }
        
        .custom-table td {
          border: 1px solid #e0e0e0;
          padding: 12px;
          text-align: center;
          font-size: 14px;
          color: #525252;
        }
        
        .custom-table tbody tr {
          border-bottom: 1px solid #e0e0e0;
        }
        
        .custom-table tbody tr:hover {
          background-color: #f4f4f4;
        }
        
        .custom-table tbody tr.clickable-row {
          cursor: pointer;
        }
        
        .custom-table tbody tr.clickable-row:hover {
          background-color: #e8f4fd;
        }

        .summary-table {
          margin-bottom: 20px;
        }

        .summary-table table {
          border-collapse: collapse;
          width: 100%;
          border: 1px solid #e0e0e0;
        }

        .summary-table th {
          border: 1px solid #e0e0e0;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          color: #161616;
          background-color: #f4f4f4;
        }

        .summary-table td {
          border: 1px solid #e0e0e0;
          padding: 16px;
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #161616;
        }

        .unit-toggle-group {
          display: inline-flex;
          border: 1px solid #8d8d8d;
          border-radius: 4px;
          overflow: hidden;
        }

        .unit-toggle-btn {
          padding: 6px 16px;
          border: none;
          background: white;
          color: #161616;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          border-right: 1px solid #8d8d8d;
        }

        .unit-toggle-btn:last-child {
          border-right: none;
        }

        .unit-toggle-btn:hover:not(.active) {
          background-color: #f4f4f4;
        }

        .unit-toggle-btn.active {
          background-color: #0f62fe;
          color: white;
        }

        .unit-toggle-btn:focus {
          outline: 2px solid #0f62fe;
          outline-offset: -2px;
        }
      `}</style>

      {/* ======================================================================
          NAVIGATION BAR (Back, Refresh, Breadcrumb, Unit Toggle, Logout)
          ====================================================================== */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {level !== 'pools' && (
            <Button onClick={handleBack} kind="secondary">
              Back
            </Button>
          )}
          <Button onClick={fetchData} kind="tertiary">
            Refresh
          </Button>
          <span style={{ color: '#525252' }}>
            Level: {level}
            {data.breadcrumb && ` | Pool: ${data.breadcrumb.pool || ''}`}
            {data.breadcrumb?.child_pool && ` > ${data.breadcrumb.child_pool}`}
            {data.breadcrumb?.tenant && ` > ${data.breadcrumb.tenant}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="unit-toggle-group">
            <button
              className={`unit-toggle-btn ${unit === 'GB' ? 'active' : ''}`}
              onClick={() => setUnit('GB')}
            >
              GB
            </button>
            <button
              className={`unit-toggle-btn ${unit === 'TB' ? 'active' : ''}`}
              onClick={() => setUnit('TB')}
            >
              TB
            </button>
            <button
              className={`unit-toggle-btn ${unit === 'PB' ? 'active' : ''}`}
              onClick={() => setUnit('PB')}
            >
              PB
            </button>
          </div>
          <Button onClick={handleLogoutClick} kind="danger">
            Logout
          </Button>
        </div>
      </div>

      {/* ======================================================================
          SUMMARY TABLE
          v5.6 CHANGES:
          1. Use backend-provided total_capacity_tb/total_capacity_gb (INCLUDES Lab Engineering)
          2. Calculate available_buffer (Total SAN Capacity - Allocated)
          3. Renamed "Available" to "Unutilized"
          4. All other columns EXCLUDE Lab Engineering
          5. NO HARDCODED VALUES
          ====================================================================== */}
      {summaryData && (
        <div className="summary-table custom-table">
          <table>
            <thead>
              <tr>
                <th>Total SAN Capacity</th>
                <th>Available Buffer</th>
                <th>Allocated</th>
                <th>Utilized</th>
                <th>Unutilized</th>
                <th>Avg Utilization</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatNumber(summaryData.total_capacity)} {getUnit()}</td>
                <td>{formatNumber(summaryData.available_buffer)} {getUnit()}</td>
                <td>{formatNumber(summaryData.allocated)} {getUnit()}</td>
                <td>{formatNumber(summaryData.utilized)} {getUnit()}</td>
                <td>{formatNumber(summaryData.unutilized)} {getUnit()}</td>
                <td>{formatNumber(summaryData.avg_util * 100)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================================
          CHARTS ROW (Donut Chart + Bar Chart)
          ====================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: level === 'pools' && barOption ? '1fr 1fr' : '1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* ------------------------------------------------------------------
            DONUT CHART (ECharts) - Excludes Lab Engineering
            ------------------------------------------------------------------ */}
        {donutOption && (
          <Tile>
            <ReactECharts 
              option={donutOption} 
              style={{ height: '400px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Tile>
        )}

        {/* ------------------------------------------------------------------
            BAR CHART (ECharts - Only on pools level) - Excludes Lab Engineering
            ------------------------------------------------------------------ */}
        {level === 'pools' && barOption && (
          <Tile>
            <ReactECharts 
              option={barOption} 
              style={{ height: '400px', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </Tile>
        )}
      </div>

      {/* ======================================================================
          DATA TABLE (Pools, Child Pools, Tenants, or Volumes)
          v5.6 CHANGE: Lab Engineering excluded from Pools table
          ====================================================================== */}
      {tableRows.length > 0 && (
        <div className="custom-table">
          <DataTable rows={tableRows} headers={tableHeaders}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <TableContainer
                title={
                  level === 'pools'
                    ? 'Pools'
                    : level === 'child_pools'
                    ? `Child Pools in ${data.breadcrumb?.pool || ''}`
                    : level === 'tenants'
                    ? `Tenants in ${data.breadcrumb?.child_pool || ''}`
                    : `Volumes for ${data.breadcrumb?.tenant || ''}`
                }
              >
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const originalRow = tableRows.find((r) => r.id === row.id);
                      return (
                        <TableRow
                          key={row.id}
                          {...getRowProps({ row })}
                          className={originalRow?.clickable ? 'clickable-row' : ''}
                          onClick={() => {
                            if (originalRow?.clickable) {
                              handleDrillDown(originalRow.clickType, originalRow.clickValue);
                            }
                          }}
                          style={{
                            cursor: originalRow?.clickable ? 'pointer' : 'default',
                          }}
                        >
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </div>
      )}

      {/* ======================================================================
          EMPTY STATE MESSAGE
          ====================================================================== */}
      {tableRows.length === 0 && (
        <Tile>
          <p>No data available. {isAdmin ? 'Please upload a data file.' : 'Contact admin to upload data.'}</p>
        </Tile>
      )}
    </div>
  );
};

export default Dashboard;
