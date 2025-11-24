# 3-Level Sunburst Chart Implementation

## Overview
Replaced the pie/donut chart on the **Pools level** with a 3-level nested sunburst chart showing the hierarchy: Pools → Child Pools → Tenants.

## Chart Structure

### Layer 1 (Innermost - Pools)
- **Radius**: 15% - 35%
- **Content**: Parent pools (AIX-Pool, HST-Pool, ISST_Reserve, LINUX-Pool)
- **Dynamic**: Number of pools is read from data, not hardcoded
- **Color**: Base colors (dark shades)
  - Pool 1: Red family (#c23531)
  - Pool 2: Blue family (#2f4554)
  - Pool 3: Green family (#61a0a8)
  - Pool 4: Orange family (#d48265)

### Layer 2 (Middle - Child Pools + Buffer)
- **Radius**: 35% - 65%
- **Content**: Child pools within each parent pool + "Buffer" segment
- **Buffer**: Unallocated capacity = Pool Total Capacity - Sum of Child Pools
- **Color**: Medium shades of parent pool color

### Layer 3 (Outermost - Tenants)
- **Radius**: 65% - 90%
- **Content**: Tenants within each child pool
- **Buffer Layer 3**: Empty (no children) for Buffer segments
- **Color**: Light shades of parent pool color

## Visual Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Tenants (Outermost Ring)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Layer 2: Child Pools + Buffer (Middle Ring)     │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │  Layer 1: Pools (Innermost Ring)           │ │  │
│  │  │                                             │ │  │
│  │  │  AIX-Pool | HST-Pool | ISST | LINUX       │ │  │
│  │  │                                             │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │  Each pool divided into child pools + buffer    │  │
│  └───────────────────────────────────────────────────┘  │
│  Each child pool divided into tenants                   │
│  (Buffer segments have no tenant subdivision)           │
└─────────────────────────────────────────────────────────┘
```

## Backend Changes (`views.py`)

### New API Response Field: `sunburst_data`
Added hierarchical data structure to pools level response:

```python
sunburst_data = [
    {
        'name': 'AIX-Pool',
        'value': 2000,  # Total capacity in GB
        'children': [
            {
                'name': 'AIX-Child1',
                'value': 500,
                'children': [
                    {'name': 'Tenant A', 'value': 200},
                    {'name': 'Tenant B', 'value': 300}
                ]
            },
            {
                'name': 'Buffer',
                'value': 300,
                'children': []  # Empty for buffer
            }
        ]
    },
    # ... other pools
]
```

### Buffer Calculation
```python
# For each pool:
pool_total_capacity_gb = sum(all volumes in pool)
pool_allocated_gb = sum(child pools, excluding Lab Engineering)
pool_buffer_gb = pool_total_capacity_gb - pool_allocated_gb

# Buffer added as child pool with empty children array
if pool_buffer_gb > 0:
    children.append({
        'name': 'Buffer',
        'value': pool_buffer_gb,
        'children': []
    })
```

## Frontend Changes (`Dashboard.js`)

### New Functions

1. **`generateColorShades(baseColor, count, lightnessRange)`**
   - Generates color gradients from base color
   - Creates lighter shades for child levels

2. **`getSunburstChartOption()`**
   - Replaces `getDonutChartOption` for pools level
   - Returns ECharts sunburst configuration
   - Assigns colors hierarchically

### Chart Configuration

```javascript
{
  type: 'sunburst',
  data: coloredData,
  radius: ['15%', '90%'],
  levels: [
    {},  // Root (not visible)
    { r0: '15%', r: '35%' },  // Layer 1: Pools
    { r0: '35%', r: '65%' },  // Layer 2: Child Pools
    { r0: '65%', r: '90%' }   // Layer 3: Tenants
  ]
}
```

### Tooltips
Shows on hover:
```
Pool/Child Pool/Tenant Name
Capacity: X.XX TB (Y.YY GB)
```

### Labels
- All 3 layers display labels
- Font sizes: Layer 1 (14px), Layer 2 (12px), Layer 3 (10px)
- White text with black border for visibility

## Color Scheme

### Color Families (Dynamic Assignment)
```javascript
Pool 1: Red    (#c23531) → Medium Red → Light Red
Pool 2: Blue   (#2f4554) → Medium Blue → Light Blue
Pool 3: Green  (#61a0a8) → Medium Green → Light Green
Pool 4: Orange (#d48265) → Medium Orange → Light Orange
```

### Lightness Ranges
- **Pools (Layer 1)**: Base color (dark)
- **Child Pools (Layer 2)**: 40%-60% lightness
- **Tenants (Layer 3)**: 70%-90% lightness

## Key Features

✅ **Dynamic pool count** - Reads from data, no hardcoding
✅ **Buffer visualization** - Shows unallocated capacity in middle layer
✅ **Empty outer layer for buffer** - Buffer segments have no tenant subdivision
✅ **Color families** - Each pool has distinct color with hierarchical shading
✅ **All labels visible** - All 3 layers show segment names
✅ **Numerical tooltips** - Hover shows capacity in TB and GB
✅ **700px height** - Matches previous pie chart size requirement

## Files Modified

### Backend
- `/home/user/webapp/SAN_DASH/backend/analytics/views.py`
  - Added `sunburst_data` field to pools level response
  - Builds hierarchical structure: Pool → Child Pool → Tenant
  - Calculates buffer per pool

### Frontend
- `/home/user/webapp/SAN_DASH/frontend/src/components/Dashboard.js`
  - Added `sunburstColorFamilies` array
  - Added `generateColorShades()` function
  - Added `getSunburstChartOption()` function
  - Modified chart rendering logic to use sunburst for pools level

## Testing Checklist

Before pushing to GitHub, please test locally:

1. ✅ Sunburst chart displays on pools level
2. ✅ 3 layers visible: Pools (inner), Child Pools (middle), Tenants (outer)
3. ✅ Buffer segments appear in middle layer
4. ✅ Buffer segments have no outer layer (tenant subdivision)
5. ✅ All segments show labels
6. ✅ Hover shows numerical capacity values in TB and GB
7. ✅ Colors are distinct for each pool with hierarchical shading
8. ✅ Number of pools is dynamic (not hardcoded to 4)
9. ✅ Other drill levels (child pools, tenants, volumes) still use donut chart

## Next Steps

1. **Test locally on your Mac** with the files from sandbox
2. **Verify data accuracy** - check that buffer calculations match expected values
3. **Approve for GitHub push** - confirm ready to push to v1.0-branch

---

**Status**: ⏳ Ready for local testing
**Awaiting**: User approval before GitHub push
