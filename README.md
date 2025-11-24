# SAN Storage Dashboard

## Version 5.7 - Available Buffer Fix

### Current Status
- ✅ **Available Buffer calculation fixed** - Now shows correct value (805.50 TB)
- ✅ **Lab Engineering filtering fixed** - Correctly filters at child_pool level
- ✅ **Buffer tenant removed** - No longer appears in Top 10 Tenants chart
- ✅ **Total SAN Capacity accurate** - Includes all child pools (8,000.00 TB)

### Latest Changes (v5.7)
**Fixed Available Buffer = 0.00 TB Issue:**
- Backend now correctly filters "Lab Engineering" and "buffer" at **child_pool** level (not pool level)
- Total SAN Capacity: 8,000.00 TB (includes Lab Engineering child pool)
- Allocated: 7,194.50 TB (excludes Lab Engineering child pool)
- Available Buffer: 805.50 TB (Total - Allocated)
- Removed "Buffer" tenant from Top 10 Tenants bar chart
- Frontend now uses backend-provided `total_capacity_tb` instead of hardcoded 8000 TB

### Features
1. **Four-Level Drill-Down:**
   - Level 1: Pools (System) - Parent pools like A9K-A1, A9K-A2, V7K-R3, FS92K-A1
   - Level 2: Child Pools - Child pools like HST-Pool, AIX-Pool, LINUX-Pool (excludes Lab Engineering)
   - Level 3: Tenants - Tenant groups extracted from volume names
   - Level 4: Volumes - Individual storage volumes

2. **Summary Metrics:**
   - Total SAN Capacity: Sum of ALL volumes including Lab Engineering
   - Available Buffer: Total Capacity - Allocated (Lab Engineering = unallocated)
   - Allocated: Capacity excluding Lab Engineering child pool
   - Utilized: Actual used capacity based on "Written by Host (%)"
   - Unutilized: Allocated - Utilized
   - Avg Utilization: Percentage of allocated capacity being used

3. **Visualizations:**
   - Donut Chart: Pool/Child Pool/Tenant/Volume utilization distribution
   - Bar Chart: Top 10 Tenants by utilization (excludes Buffer tenant)
   - Summary Table: Key metrics at the top
   - Detailed Tables: Clickable drill-down navigation

4. **Data Filtering:**
   - Lab Engineering: Child pool name representing unallocated capacity (805.50 TB)
   - Buffer: Tenant name inside Lab Engineering child pool (also unallocated)
   - Both excluded from Allocated, Utilized, and displayed lists
   - Both included in Total SAN Capacity calculation

### URLs
- GitHub: https://github.com/neilpandey27-web/SAN_Storage_Dashboard_PG.git
- Branch: v5.6-branch
- Tag: v5.7

### Tech Stack
- Backend: Django REST Framework + PostgreSQL
- Frontend: React + Carbon Design System
- Charts: Apache ECharts
- Authentication: Django session-based auth

### Data Model
- Excel "System" → Database `pool` field → Parent pools (A9K-A1, etc.)
- Excel "Pool" → Database `child_pool` field → Child pools (Lab Engineering, HST-Pool, etc.)
- Excel "Volume" → Database `volume` field → Volume names (extract tenant from first segment)
- Excel "Written by Host (%)" → Utilization percentage (0.5647 = 56.47%)

### Deployment Status
- ✅ Version 5.7 committed and tagged
- ✅ Pushed to GitHub
- ✅ Local backup created
- ✅ All functionality verified with DATA_NEW.xlsx

Last Updated: 2025-11-23
