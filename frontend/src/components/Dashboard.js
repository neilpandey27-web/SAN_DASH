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
    // Backend now provides allocated_tb and available_buffer_tb directly
    const totalAllocated = data.allocated_tb || 0;
    const totalUtilized = data.pools.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
    const totalUnutilized = data.pools.reduce((sum, p) => sum + (p.left_tb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // Use backend-provided values (includes Lab Engineering in total, excludes from allocated)
    const totalCapacity = data.total_capacity_tb || 0;
    const availableBuffer = data.available_buffer_tb || 0;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'TB'),
      available_buffer: convertValue(availableBuffer, 'TB'),
      allocated: convertValue(totalAllocated, 'TB'),
      utilized: convertValue(totalUtilized, 'TB'),
      unutilized: convertValue(totalUnutilized, 'TB'),
      avg_util: avgUtil
    };
  } else if (level === 'child_pools' && data.data && Array.isArray(data.data)) {
    // Backend now provides allocated_tb and available_buffer_tb directly
    const totalAllocated = data.allocated_tb || 0;
    const totalUtilized = data.data.reduce((sum, p) => sum + (p.utilized_tb || 0), 0);
    const totalUnutilized = data.data.reduce((sum, p) => sum + (p.left_tb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // Use backend-provided values (includes Lab Engineering in total, excludes from allocated)
    const totalCapacity = data.total_capacity_tb || 0;
    const availableBuffer = data.available_buffer_tb || 0;

    summaryData = {
      total_capacity: convertValue(totalCapacity, 'TB'),
      available_buffer: convertValue(availableBuffer, 'TB'),
      allocated: convertValue(totalAllocated, 'TB'),
      utilized: convertValue(totalUtilized, 'TB'),
      unutilized: convertValue(totalUnutilized, 'TB'),
      avg_util: avgUtil
    };
  } else if (level === 'tenants' && data.data && Array.isArray(data.data)) {
    // Backend now provides allocated_gb and available_buffer_gb directly
    const totalAllocated = data.allocated_gb || 0;
    const totalUtilized = data.data.reduce((sum, t) => sum + (t.utilized_gb || 0), 0);
    const totalUnutilized = data.data.reduce((sum, t) => sum + (t.left_gb || 0), 0);
    const avgUtil = totalAllocated > 0 ? (totalUtilized / totalAllocated) : 0;
    
    // Use backend-provided values (includes Buffer in total, excludes from allocated)
    const totalCapacity = data.total_capacity_gb || 0;
    const availableBuffer = data.available_buffer_gb || 0;

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
  // CAPACITY SUNBURST CHART (Total SAN Capacity Breakdown)
  // Center: Total SAN Capacity
  // Layer 1 (Inner): Available Buffer + Allocated
  // Layer 2 (Middle): Allocated → Utilized + Unutilized (Buffer has no Layer 2)
  // Layer 3 (Outer): Detail layer on top of Utilized/Unutilized (Buffer has gap)
  // ============================================================================
  const getCapacitySunburstOption = () => {
    if (level !== 'pools' || !summaryData) {
      return null;
    }

    // Get values in GB for accurate calculations
    const totalCapacityGB = summaryData.total_capacity * (unit === 'TB' ? 1000 : unit === 'GB' ? 1 : 1000000);
    const availableBufferGB = summaryData.available_buffer * (unit === 'TB' ? 1000 : unit === 'GB' ? 1 : 1000000);
    const allocatedGB = summaryData.allocated * (unit === 'TB' ? 1000 : unit === 'GB' ? 1 : 1000000);
    const utilizedGB = summaryData.utilized * (unit === 'TB' ? 1000 : unit === 'GB' ? 1 : 1000000);
    const unutilizedGB = summaryData.unutilized * (unit === 'TB' ? 1000 : unit === 'GB' ? 1 : 1000000);

    const capacityData = [
      {
        name: 'Total SAN Capacity',
        value: totalCapacityGB,
        itemStyle: { color: '#525252' },
        children: [
          {
            name: 'Available Buffer',
            value: availableBufferGB,
            itemStyle: { color: '#a8a8a8' },  // Gray for buffer
            children: []  // No Layer 2 or Layer 3 - creates visual gap
          },
          {
            name: 'Allocated',
            value: allocatedGB,
            itemStyle: { color: '#0f62fe' },  // Blue for allocated
            children: [
              {
                name: 'Utilized',
                value: utilizedGB,
                itemStyle: { color: '#0043ce' },  // Dark blue for Layer 2
                children: [
                  {
                    name: 'Utilized Detail',
                    value: utilizedGB,
                    itemStyle: { color: '#002d9c' }  // Even darker blue for Layer 3
                  }
                ]
              },
              {
                name: 'Unutilized',
                value: unutilizedGB,
                itemStyle: { color: '#78a9ff' },  // Light blue for Layer 2
                children: [
                  {
                    name: 'Unutilized Detail',
                    value: unutilizedGB,
                    itemStyle: { color: '#a6c8ff' }  // Even lighter blue for Layer 3
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'Total SAN Capacity Breakdown',
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
          const valueInTB = (params.value / 1000).toFixed(2);
          const valueInGB = params.value.toFixed(2);
          const percentage = ((params.value / totalCapacityGB) * 100).toFixed(1);
          // Don't show "Detail" in tooltip
          const displayName = params.name.replace(' Detail', '');
          return `${displayName}<br/>Capacity: ${formatNumber(parseFloat(valueInTB))} TB (${formatNumber(parseFloat(valueInGB))} GB)<br/>Percentage: ${percentage}%`;
        }
      },
      series: [
        {
          type: 'sunburst',
          data: capacityData,
          radius: ['15%', '90%'],
          center: ['50%', '55%'],
          sort: null,
          highlightPolicy: 'ancestor',
          itemStyle: {
            borderWidth: 2,  // Match Layer 4 border width
            borderColor: '#fff'
          },
          emphasis: {
            focus: 'descendant',  // Highlight all children when hovering parent (matches Layer 4 behavior)
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 3,  // Match Layer 4 border width on hover
              borderColor: '#fff'
            }
          },
          label: {
            show: true,
            formatter: (params) => {
              if (params.depth === 0) {
                // Center label: Total SAN Capacity
                return `{center|${params.name}}\n{value|${formatNumber(convertValue(params.value / 1000, 'TB'))} ${getUnit()}}`;
              }
              // Don't show "Detail" in labels - just show parent name
              if (params.name.includes('Detail')) {
                return '';  // Hide detail layer labels
              }
              return params.name;
            },
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            textBorderColor: 'rgba(0, 0, 0, 0.5)',
            textBorderWidth: 2,
            rich: {
              center: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#fff'
              },
              value: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#fff'
              }
            }
          },
          levels: [
            {
              // Center: Total SAN Capacity
              r0: 0,
              r: '15%',
              label: {
                position: 'inside',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#fff'
              }
            },
            {
              // Layer 1: Available Buffer + Allocated
              r0: '15%',
              r: '45%',
              label: {
                rotate: 0,
                fontSize: 14,
                fontWeight: 'bold',
                formatter: (params) => {
                  const valueInTB = (params.value / 1000).toFixed(2);
                  return `${params.name}\n${formatNumber(parseFloat(valueInTB))} ${getUnit()}`;
                }
              }
            },
            {
              // Layer 2: Utilized + Unutilized (middle ring with labels)
              r0: '45%',
              r: '70%',
              label: {
                rotate: 0,
                fontSize: 12,
                formatter: (params) => {
                  const valueInTB = (params.value / 1000).toFixed(2);
                  return `${params.name}\n${formatNumber(parseFloat(valueInTB))} ${getUnit()}`;
                }
              }
            },
            {
              // Layer 3: Detail layer (outer ring, no labels)
              r0: '70%',
              r: '90%',
              label: {
                show: false  // Hide labels for detail layer
              }
            }
          ]
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

  // Use sunburst chart for pools level Layer 2
  const capacitySunburstOption = level === 'pools' ? getCapacitySunburstOption() : null;
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
          LAYER 2: CAPACITY SUNBURST + BAR CHART (Pools Level) or PIE/DONUT CHART (Other Levels)
          ====================================================================== */}
      {/* Pools Level: Show capacity sunburst and bar chart side by side */}
      {level === 'pools' && (capacitySunburstOption || barOption) && (
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left: Capacity Breakdown Sunburst */}
          {capacitySunburstOption && (
            <Tile>
              <ReactECharts 
                option={capacitySunburstOption} 
                style={{ height: '700px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </Tile>
          )}
          
          {/* Right: Top 10 Tenants Bar Chart */}
          {barOption && (
            <Tile>
              <ReactECharts 
                option={barOption} 
                style={{ height: '700px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </Tile>
          )}
        </div>
      )}
      


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
