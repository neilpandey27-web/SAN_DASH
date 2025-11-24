# 🌿 Branching & Versioning Strategy

## 📋 Overview

This project uses a **version-based branching strategy** where all development work happens on version branches, and the `main` branch remains stable.

---

## 🔀 Branch Structure

### Main Branch
- **Branch:** `main`
- **Purpose:** Stable, production-ready code only
- **Protected:** No direct pushes from automation/AI
- **Updates:** Only through manual merges/pull requests

### Version Branches
- **Branches:** `v1.0-branch`, `v2.0-branch`, `v3.0-branch`, etc.
- **Purpose:** Active development for each version
- **Workflow:** All new features and fixes go here first
- **Versioning:** Major version numbers (1.0, 2.0, 3.0, etc.)

---

## 🚀 Workflow

### When Making Changes:

1. **Create new version branch** (e.g., `v2.0-branch`)
2. **Make all changes** on that branch
3. **Commit and push** to the version branch
4. **Tag the branch** with version tag (e.g., `v2.0`)
5. **You manually review** and merge to `main` when ready

### Example:

```bash
# Create v2.0 branch for new features
git checkout -b v2.0-branch

# Make changes...
git add .
git commit -m "Add new feature X"

# Push to version branch (NOT main)
git push origin v2.0-branch

# Tag the version
git tag -a v2.0 -m "Version 2.0 - New features"
git push origin v2.0

# You decide when to merge to main via pull request
```

---

## 🏷️ Current Versions

| Version | Branch | Status | Description |
|---------|--------|--------|-------------|
| v1.0 | `v1.0-branch` | ✅ Active | Initial release with admin tools |
| v2.0 | `v2.0-branch` | 🔜 Next | Future updates |

---

## ✅ Benefits

- ✅ **Main stays clean** - Only merged, tested code
- ✅ **Easy rollback** - Each version is a branch
- ✅ **Clear history** - Version branches show progression
- ✅ **Safe testing** - Test on version branches first
- ✅ **No accidents** - Automation never touches main directly

---

## 📝 Rules for AI/Automation

1. **NEVER push directly to `main`**
2. **ALWAYS work on version branches** (v1.0-branch, v2.0-branch, etc.)
3. **CREATE new version branch** for each major update
4. **TAG each version** with appropriate version number
5. **PUSH version branches and tags** to GitHub
6. **LEAVE merging to main** for manual review

---

## 🔄 Merging to Main (Manual Process)

When you're ready to merge a version to main:

### Option 1: Via GitHub Pull Request (Recommended)
1. Go to: https://github.com/neilpandey27-web/SAN_Storage_Dashboard_P
2. Click "Pull requests" → "New pull request"
3. Base: `main` ← Compare: `v1.0-branch` (or version branch)
4. Review changes
5. Merge pull request

### Option 2: Via Command Line
```bash
git checkout main
git merge v1.0-branch
git push origin main
```

---

## 📊 Version Numbering

- **1.0** - Initial release
- **2.0** - Major feature additions or significant changes
- **3.0** - Next major update
- **4.0** - And so on...

Each major version gets its own branch.

---

## 🎯 Quick Reference

**For AI/Automation:**
- ❌ Never: `git push origin main`
- ✅ Always: `git push origin v{X.0}-branch`

**For You (Manual):**
- ✅ Review version branches
- ✅ Merge to main when ready
- ✅ Deploy from main branch

---

**Last Updated:** 2025-11-22  
**Current Version:** v1.0
