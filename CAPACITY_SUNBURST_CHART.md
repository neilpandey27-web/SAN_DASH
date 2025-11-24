# Capacity Sunburst Chart Implementation

## Overview
Added a second sunburst chart on the **Pools level** showing the Total SAN Capacity breakdown, displayed side-by-side with the hierarchical sunburst chart.

## Chart Layout (Pools Level)

```
┌─────────────────────────────────────────────────────────────┐
│  Left Chart                    Right Chart                  │
│  ┌──────────────────────┐     ┌──────────────────────┐     │
│  │ Capacity Breakdown   │     │ Hierarchy Breakdown  │     │
│  │ Sunburst Chart       │     │ Sunburst Chart       │     │
│  └──────────────────────┘     └──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Capacity Sunburst Chart Structure

### Center (Total SAN Capacity)
- **Position**: Center circle (0% - 20% radius)
- **Content**: "Total SAN Capacity" label + value
- **Color**: Dark gray (#525252)
- **Size**: 20% of chart radius

### Layer 1 (Inner Ring: Available Buffer + Allocated)
- **Position**: 20% - 55% radius
- **Content**: 
  - **Available Buffer** (gray #a8a8a8) - Unallocated capacity
  - **Allocated** (blue #0f62fe) - Total allocated capacity
- **Labels**: Show name + capacity value

### Layer 2 (Outer Ring: Utilized + Unutilized)
- **Position**: 55% - 90% radius
- **Content**: Subdivision of "Allocated" segment only
  - **Utilized** (dark blue #0043ce) - Actually used capacity
  - **Unutilized** (light blue #78a9ff) - Allocated but not used
- **Note**: "Available Buffer" segment has NO outer layer (empty children)

## Visual Structure

```
┌─────────────────────────────────────────────┐
│         Capacity Sunburst Chart             │
│  ┌───────────────────────────────────────┐  │
│  │  Layer 2: Utilized + Unutilized       │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │ Layer 1: Buffer + Allocated     │  │  │
│  │  │  ┌───────────────────────────┐  │  │  │
│  │  │  │  Center: Total Capacity   │  │  │  │
│  │  │  │  (8,000.00 TB)           │  │  │  │
│  │  │  └───────────────────────────┘  │  │  │
│  │  │  Available Buffer | Allocated  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │  Allocated → Utilized + Unutilized    │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Data Flow

### Input Data (from summaryData)
```javascript
summaryData = {
  total_capacity: 8000.00,    // TB
  available_buffer: 805.50,   // TB
  allocated: 7194.50,         // TB
  utilized: 4500.00,          // TB (example)
  unutilized: 2694.50,        // TB (example)
}
```

### Hierarchical Structure
```javascript
{
  name: 'Total SAN Capacity',
  value: 8000000,  // GB
  children: [
    {
      name: 'Available Buffer',
      value: 805500,  // GB
      children: []    // No subdivision
    },
    {
      name: 'Allocated',
      value: 7194500,  // GB
      children: [
        {
          name: 'Utilized',
          value: 4500000  // GB
        },
        {
          name: 'Unutilized',
          value: 2694500  // GB
        }
      ]
    }
  ]
}
```

## Color Scheme

### Capacity Chart Colors
```javascript
Total SAN Capacity: #525252 (Dark Gray)
├─ Available Buffer: #a8a8a8 (Light Gray)
└─ Allocated: #0f62fe (IBM Blue)
   ├─ Utilized: #0043ce (Dark Blue)
   └─ Unutilized: #78a9ff (Light Blue)
```

### Hierarchy Chart Colors (Unchanged)
```javascript
Pool 1: Red family (#c23531 → lighter shades)
Pool 2: Blue family (#2f4554 → lighter shades)
Pool 3: Green family (#61a0a8 → lighter shades)
Pool 4: Orange family (#d48265 → lighter shades)
```

## Tooltip Content

Shows on hover:
```
Segment Name
Capacity: X.XX TB (Y.YY GB)
Percentage: Z.Z%
```

Example:
```
Allocated
Capacity: 7,194.50 TB (7,194,500.00 GB)
Percentage: 89.9%
```

## Key Features

✅ **Center label** - Shows "Total SAN Capacity" with total value
✅ **Logical hierarchy** - Center → Inner Ring → Outer Ring
✅ **Available Buffer visualization** - Shows unallocated capacity clearly
✅ **Allocated breakdown** - Shows how allocated capacity is utilized
✅ **Ancestor highlighting** - Hover highlights entire path
✅ **Responsive tooltips** - Shows capacity in both TB and GB
✅ **Side-by-side layout** - Both sunburst charts visible on pools level

## Implementation Details

### Frontend Changes (`Dashboard.js`)

#### New Function: `getCapacitySunburstOption()`
```javascript
const getCapacitySunburstOption = () => {
  if (level !== 'pools' || !summaryData) {
    return null;
  }

  const capacityData = [
    {
      name: 'Total SAN Capacity',
      value: totalCapacityGB,
      children: [
        {
          name: 'Available Buffer',
          value: availableBufferGB,
          children: []  // No subdivision
        },
        {
          name: 'Allocated',
          value: allocatedGB,
          children: [
            { name: 'Utilized', value: utilizedGB },
            { name: 'Unutilized', value: unutilizedGB }
          ]
        }
      ]
    }
  ];

  return {
    type: 'sunburst',
    data: capacityData,
    radius: ['20%', '90%'],
    // ... configuration
  };
};
```

#### Layout: Side-by-Side Grid
```javascript
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr', 
  gap: '20px' 
}}>
  {/* Left: Capacity Breakdown */}
  <Tile>
    <ReactECharts option={capacitySunburstOption} />
  </Tile>
  
  {/* Right: Hierarchy Breakdown */}
  <Tile>
    <ReactECharts option={sunburstOption} />
  </Tile>
</div>
```

## Comparison: Two Sunburst Charts

| Feature | Capacity Sunburst | Hierarchy Sunburst |
|---------|------------------|-------------------|
| **Purpose** | Show capacity allocation | Show organizational structure |
| **Center** | Total SAN Capacity | (Empty - starts with pools) |
| **Layer 1** | Buffer + Allocated | Pools (4 segments) |
| **Layer 2** | Utilized + Unutilized | Child Pools (dynamic) |
| **Layer 3** | N/A | Tenants (dynamic) |
| **Colors** | Blue family | 4 color families |
| **Data Source** | `summaryData` | `data.sunburst_data` |

## Files Modified

### Frontend
- `/home/user/webapp/SAN_DASH/frontend/src/components/Dashboard.js`
  - Added `getCapacitySunburstOption()` function
  - Updated chart rendering to show two sunburst charts side-by-side
  - Modified layout from single chart to 2-column grid

### Backend
- No backend changes required (uses existing `summaryData` from API)

## Testing Checklist

Before pushing to GitHub, please test locally:

1. ✅ Two sunburst charts display side-by-side on pools level
2. ✅ Left chart shows: Total SAN Capacity → Buffer/Allocated → Utilized/Unutilized
3. ✅ Right chart shows: Pools → Child Pools → Tenants
4. ✅ Center of left chart shows "Total SAN Capacity" label
5. ✅ Available Buffer has no outer ring (no children)
6. ✅ Allocated segment subdivides into Utilized + Unutilized
7. ✅ Hover highlights ancestor path in both charts
8. ✅ Tooltips show numerical values in TB and GB
9. ✅ Colors are appropriate (gray for buffer, blue for allocated)
10. ✅ Other drill levels (child pools, tenants, volumes) still use donut chart

## Visual Benefits

1. **Clear capacity overview** - Immediately see how total capacity is distributed
2. **Buffer visibility** - Available buffer stands out as a separate segment
3. **Utilization insight** - See how much allocated capacity is actually used
4. **Complementary views** - Capacity breakdown + organizational hierarchy
5. **Logical flow** - Center to outer rings shows natural hierarchy

---

**Status**: ⏳ Ready for local testing
**Awaiting**: User approval before GitHub push
