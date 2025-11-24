# v5.0 Installation Instructions - ECharts Migration

## Overview
This update replaces Chart.js with Apache ECharts to get **real connector lines** from labels to pie chart segments.

---

## Files Changed
1. **frontend/src/components/Dashboard.js** - Rewritten to use ECharts
2. **frontend/package.json** - Updated dependencies

---

## What's New in v5.0

### ✅ **ECharts Features:**
- **Real connector lines** (labelLine) pointing from labels to segments
- **All labels visible** - No 5% threshold, every segment labeled
- **Distinct inner ring colors** - Purple, Pink, Red, Green (NO blue/gray reuse)
- **Better label positioning** - Smarter automatic placement

### ✅ **Maintained Features:**
- PB unit support (GB | TB | PB buttons)
- Bar chart with value labels (size 16, bold)
- No bar chart legend
- All 4 drill-down levels work (pools → child_pools → tenants → volumes)

---

## Installation Steps

### **Step 1: Backup Current Files (IMPORTANT!)**
```bash
# On your local machine
cd /path/to/SAN_Storage_Dashboard_PG

# Backup current Dashboard.js
cp frontend/src/components/Dashboard.js frontend/src/components/Dashboard_v4_backup.js

# Backup current package.json
cp frontend/package.json frontend/package_v4_backup.json

echo "✅ Backup complete"
```

### **Step 2: Copy New Files**
```bash
# Copy the new Dashboard.js from this session
# Location: /home/user/Dashboard_v5_ECharts.js
# Destination: frontend/src/components/Dashboard.js

# Copy the new package.json from this session
# Location: /home/user/package_v5.json
# Destination: frontend/package.json
```

### **Step 3: Install New Dependencies**
```bash
# Remove old Chart.js packages
docker-compose exec frontend npm uninstall chart.js chartjs-plugin-datalabels react-chartjs-2

# Install ECharts packages
docker-compose exec frontend npm install echarts@^5.4.3 echarts-for-react@^3.0.2

# Verify installation
docker-compose exec frontend npm list echarts echarts-for-react
```

**Expected output:**
```
storage-analytics-frontend@0.1.0
├── echarts@5.4.3
└── echarts-for-react@3.0.2
```

### **Step 4: Rebuild Frontend**
```bash
# Clear old build
docker-compose exec frontend rm -rf build node_modules/.cache

# Rebuild
docker-compose exec frontend npm run build
```

### **Step 5: Restart Containers**
```bash
# Restart frontend container
docker-compose restart frontend

# Wait 10 seconds
sleep 10

# Check status
docker-compose ps
```

### **Step 6: Test the Application**
```bash
# Open browser to: http://localhost:3000
# Or your configured URL

# What to verify:
# ✅ Donut chart shows connector lines from labels to segments
# ✅ Small segments (green, blue) have visible labels
# ✅ Inner ring colors are distinct (no blue like outer ring)
# ✅ Bar chart shows values on top of bars
# ✅ Unit toggle works (GB | TB | PB)
# ✅ Drill-down functionality works
```

---

## Rollback Instructions (If Needed)

If something goes wrong, rollback to v4.0:

```bash
# Restore v4.0 files
cp frontend/src/components/Dashboard_v4_backup.js frontend/src/components/Dashboard.js
cp frontend/package_v4_backup.json frontend/package.json

# Reinstall old dependencies
docker-compose exec frontend npm install

# Rebuild
docker-compose exec frontend npm run build

# Restart
docker-compose restart frontend
```

---

## Dependency Changes

### **Removed (v4.0):**
```json
"chart.js": "^4.4.1",
"chartjs-plugin-datalabels": "^2.2.0",
"react-chartjs-2": "^5.2.0"
```

### **Added (v5.0):**
```json
"echarts": "^5.4.3",
"echarts-for-react": "^3.0.2"
```

---

## Key Code Changes

### **Before (Chart.js):**
```javascript
import { Doughnut, Bar } from 'react-chartjs-2';

<Doughnut data={donutData} options={...} />
<Bar data={barData} options={...} />
```

### **After (ECharts):**
```javascript
import ReactECharts from 'echarts-for-react';

<ReactECharts option={donutOption} style={{ height: '400px' }} />
<ReactECharts option={barOption} style={{ height: '400px' }} />
```

---

## Connector Line Configuration

ECharts provides **real connector lines** via `labelLine` property:

```javascript
labelLine: {
  show: true,        // Enable connector lines
  length: 15,        // First segment length
  length2: 10,       // Second segment length
  lineStyle: {
    width: 2         // Line thickness
  }
}
```

This is the key feature that Chart.js couldn't provide!

---

## Troubleshooting

### **Issue: "Cannot find module 'echarts'"**
**Solution:**
```bash
docker-compose exec frontend npm install echarts echarts-for-react
docker-compose restart frontend
```

### **Issue: "Chart not rendering"**
**Solution:**
```bash
# Clear cache and rebuild
docker-compose exec frontend rm -rf node_modules/.cache
docker-compose exec frontend npm run build
docker-compose restart frontend
```

### **Issue: "Labels overlapping"**
**Solution:**
ECharts auto-adjusts labels. If issues persist, check browser console for errors.

### **Issue: "Colors don't match design"**
**Solution:**
Colors are defined in Dashboard.js lines 200-213. Verify `innerRingColors` array.

---

## Performance Notes

- **ECharts is slightly larger** than Chart.js (~1.5MB vs ~500KB)
- **Rendering is faster** - Hardware-accelerated SVG
- **Better label collision detection** - Automatic positioning
- **More features available** - Rich ecosystem

---

## Next Steps After Installation

1. ✅ Test all 4 drill-down levels (pools → child_pools → tenants → volumes)
2. ✅ Test unit switching (GB | TB | PB)
3. ✅ Verify connector lines are visible
4. ✅ Check small segment labels are shown
5. ✅ Test on different screen sizes (responsive)

---

## Summary

**Frontend-only change:**
- ✅ No backend modifications required
- ✅ API endpoints unchanged
- ✅ Database untouched
- ✅ Only Dashboard.js and package.json modified

**Benefits:**
- ✅ Real connector lines (Chart.js couldn't do this)
- ✅ Better label positioning
- ✅ All labels visible (no 5% threshold needed)
- ✅ More professional appearance

**Time to complete:** ~10 minutes

---

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs frontend`
2. Check browser console for errors
3. Verify npm packages: `docker-compose exec frontend npm list`
4. Try rollback procedure above

---

**Ready to proceed? Confirm, and I'll update the sandbox!** 🚀
