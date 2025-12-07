# Troubleshooting Guide - Issues Fixed

## Summary of Issues and Fixes

### 1. **Python 3.13 Compatibility Issues**

**Problem:**
- Pillow 10.2.0 failed to build on Python 3.13
- Pydantic-core had build errors with Python 3.13

**Fix:**
- Updated Pillow to `>=10.3.0` (which supports Python 3.13)
- Let pip install compatible versions automatically
- Installed core dependencies first, then optional ones

**Files Changed:**
- `backend/requirements.txt` - Updated Pillow version

---

### 2. **HTTPX Version Conflict**

**Problem:**
- `httpx==0.26.0` conflicted with Supabase requirement
- Supabase 2.3.0 requires `httpx<0.25.0 and >=0.24.0`
- Duplicate httpx entries in requirements.txt

**Fix:**
- Changed httpx to `>=0.24.0,<0.25.0` to match Supabase requirements
- Removed duplicate httpx entry

**Files Changed:**
- `backend/requirements.txt` - Fixed httpx version constraint

---

### 3. **Missing Email Validator**

**Problem:**
- Pydantic EmailStr requires `email-validator` package
- Error: `email-validator is not installed`

**Fix:**
- Installed `email-validator` and `pydantic[email]`

**Command:**
```bash
pip install 'pydantic[email]' email-validator
```

---

### 4. **Background Fetch Not Available on Web**

**Problem:**
- `expo-background-fetch` is a native module
- Error: "BackgroundFetch.registerTaskAsync is not available on web"

**Fix:**
- Made background sync registration conditional on platform
- Only registers on native platforms (iOS/Android), skips on web

**Files Changed:**
- `app/src/services/syncService.ts` - Added Platform check
- `app/app/_layout.tsx` - Added Platform check before registering

**Code:**
```typescript
if (Platform.OS !== 'web') {
  syncService.registerBackgroundSync();
}
```

---

### 5. **SQLite Not Available on Web**

**Problem:**
- `expo-sqlite` is a native module
- Error: "ExpoSQLiteNext.default.NativeDatabase is not a constructor"

**Fix:**
- Made SQLite imports conditional (only on native)
- Updated all database operations to handle web platform
- On web, hooks use API directly instead of local database

**Files Changed:**
- `app/src/db/database.ts` - Conditional SQLite import
- `app/src/db/recipeRepository.ts` - Platform checks in all methods
- `app/src/hooks/useRecipes.ts` - Use API directly on web

**Code Pattern:**
```typescript
if (Platform.OS === 'web') {
  return apiClient.getRecipes(); // Use API directly
}
return recipeRepository.getAllRecipes(userId); // Use local DB
```

---

### 6. **Expo SDK Version Mismatch**

**Problem:**
- Project was using Expo SDK 51
- Expo Go app installed was SDK 54
- Error: "Project is incompatible with this version of Expo Go"

**Fix:**
- Upgraded project to Expo SDK 54
- Updated all Expo packages to SDK 54 compatible versions
- Updated React to 19.1.0, React Native to 0.81.5

**Files Changed:**
- `app/package.json` - Updated all Expo and React versions

**Packages Updated:**
- expo: ~51.0.0 → ~54.0.0
- react: 18.2.0 → 19.1.0
- react-native: 0.74.0 → 0.81.5
- expo-router: ~3.5.0 → ~6.0.17
- All other Expo packages updated to SDK 54 versions

---

### 7. **Missing Asset Files**

**Problem:**
- app.json referenced `./assets/icon.png` and `./assets/splash.png`
- Files didn't exist
- Error: "Unable to resolve asset"

**Fix:**
- Removed icon and splash image references from app.json
- Expo will use default icons
- Created assets folder for future use

**Files Changed:**
- `app/app.json` - Removed icon and splash image paths
- Created `app/assets/` folder

---

### 8. **Missing expo-linking Package**

**Problem:**
- expo-router requires expo-linking
- Error: "Unable to resolve 'expo-linking'"

**Fix:**
- Installed expo-linking package

**Command:**
```bash
npm install expo-linking --legacy-peer-deps
```

---

### 9. **Package Version Warnings**

**Problem:**
- Multiple packages had version mismatches with Expo SDK 54
- Warnings about incompatible versions

**Fix:**
- Used `npx expo install --fix` to update packages
- Installed with `--legacy-peer-deps` to handle React 19 conflicts

**Command:**
```bash
npm install --legacy-peer-deps
npx expo install --fix
```

---

### 10. **Wrong Directory for Expo Commands**

**Problem:**
- User tried running `npx expo start` from `app/app/` directory
- Error: "package.json does not exist"

**Fix:**
- Explained correct directory structure
- Commands must be run from `app/` (project root), not `app/app/` (pages folder)

---

## Key Lessons Learned

1. **Platform-Specific Code**: Always check `Platform.OS` before using native modules
2. **Expo SDK Compatibility**: Keep Expo packages aligned with SDK version
3. **Dependency Conflicts**: Use `--legacy-peer-deps` when needed for React 19
4. **Web vs Native**: Some features (SQLite, Background Fetch) only work on native
5. **Directory Structure**: Run commands from project root, not subdirectories

## Current Status

✅ All issues resolved
✅ Backend running on port 8001
✅ Frontend compatible with Expo SDK 54
✅ Web platform support added
✅ Native platform support maintained

