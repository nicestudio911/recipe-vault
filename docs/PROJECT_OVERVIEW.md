# Project Overview: nomnombook

## What is nomnombook?

**nomnombook** (formerly Recipe Vault) is a mobile-first recipe management application built with React Native (Expo) and a Python FastAPI backend. It allows users to collect, organize, and manage recipes with features like image upload, OCR text extraction, URL parsing, and Instagram import.

## Architecture

### Frontend (React Native / Expo)
- **Framework**: Expo SDK 54 with React Native
- **Location**: `app/` directory
- **Routing**: Expo Router (file-based routing)
- **State Management**: Zustand for auth and sync state
- **Data Fetching**: React Query (TanStack Query)
- **Database**: SQLite for offline storage (native platforms only)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images

### Backend (Python FastAPI)
- **Framework**: FastAPI
- **Location**: `backend/` directory
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase JWT tokens
- **Storage**: Supabase Storage
- **OCR**: OpenAI Vision API (for extracting recipes from images)
- **URL Parsing**: Trafilatura and BeautifulSoup

## Key Features

### 1. Authentication
- ✅ Email/password sign up and sign in
- ✅ Session management with auto-refresh
- ✅ Protected routes (auth guard)
- ✅ User profiles

### 2. Recipe Management
- ✅ Create recipes manually
- ✅ Edit recipes
- ✅ Delete recipes
- ✅ View recipe details
- ✅ Search recipes
- ✅ Recipe ingredients and steps
- ✅ Recipe tags
- ✅ Recipe images

### 3. Recipe Import Methods
- ✅ **Image Upload + OCR**: Upload a photo of a recipe, extract text using OpenAI Vision
- ✅ **URL Import**: Paste a recipe URL, automatically parse and extract recipe data
- ✅ **Instagram Import**: Import recipes from Instagram posts/links

### 4. Offline Support
- ✅ Local SQLite database for offline storage
- ✅ Background sync service
- ✅ Automatic sync when online
- ✅ Conflict resolution

### 5. Image Handling
- ✅ Upload recipe images
- ✅ Image storage in Supabase Storage
- ✅ Automatic image upload during sync
- ✅ Image preview in recipe cards

## Project Structure

```
recipe-vault/
├── app/                          # React Native frontend (Expo)
│   ├── app/                      # Expo Router pages
│   │   ├── (tabs)/               # Tab navigation screens
│   │   │   ├── index.tsx         # Home screen
│   │   │   ├── search.tsx        # Search screen
│   │   │   ├── my-recipes.tsx    # User's recipes
│   │   │   └── profile.tsx       # User profile
│   │   ├── auth/                 # Authentication screens
│   │   │   ├── login.tsx
│   │   │   └── signup.tsx
│   │   └── recipe/               # Recipe screens
│   │       ├── add.tsx           # Create recipe
│   │       ├── [id].tsx          # Recipe details
│   │       ├── edit/[id].tsx     # Edit recipe
│   │       ├── import-ocr.tsx    # OCR import
│   │       ├── import-url.tsx    # URL import
│   │       └── import-instagram.tsx
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── FeaturedRecipeCard.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── AddRecipeActionSheet.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── services/             # API and services
│   │   │   ├── api.ts            # API client
│   │   │   ├── supabase.ts       # Supabase client
│   │   │   └── syncService.ts    # Offline sync
│   │   ├── store/                # State management
│   │   │   ├── authStore.ts      # Auth state
│   │   │   └── syncStore.ts      # Sync state
│   │   ├── hooks/                # React hooks
│   │   │   ├── useRecipes.ts
│   │   │   ├── useOCR.ts
│   │   │   └── useSync.ts
│   │   ├── db/                   # Local database
│   │   │   ├── database.ts
│   │   │   └── recipeRepository.ts
│   │   └── types/                # TypeScript types
│   └── package.json
│
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/           # API endpoints
│   │   │       ├── recipes.py    # Recipe CRUD
│   │   │       ├── ocr.py        # OCR processing
│   │   │       ├── url_parser.py # URL parsing
│   │   │       └── auth.py       # Auth endpoints
│   │   ├── services/             # Business logic
│   │   │   ├── recipe_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── openai_ocr_service.py
│   │   │   ├── url_parser_service.py
│   │   │   └── storage_service.py
│   │   ├── models/               # Pydantic models
│   │   ├── core/                 # Configuration
│   │   │   ├── config.py
│   │   │   └── dependencies.py   # Auth dependencies
│   │   └── db/                   # Database
│   │       └── session.py        # Supabase client
│   ├── scripts/                  # Setup scripts
│   │   ├── setup_database.py
│   │   ├── setup_storage.py
│   │   └── fix_missing_users.py
│   └── requirements.txt
│
├── supabase/                     # Database schema
│   └── schema.sql                # PostgreSQL schema
│
└── docs/                         # Documentation
    ├── AUTH_SETUP.md
    ├── AUTH_IMPLEMENTATION_SUMMARY.md
    ├── NETWORK_SETUP.md
    ├── STORAGE_SETUP.md
    ├── DEBUGGING.md
    └── PROJECT_OVERVIEW.md
```

## Technology Stack

### Frontend
- **React Native** 0.81.5
- **Expo SDK** 54
- **Expo Router** 6.0.17 (file-based routing)
- **Zustand** (state management)
- **React Query** (data fetching/caching)
- **Axios** (HTTP client)
- **Expo SQLite** (local database)
- **Expo Image Picker** (image selection)
- **Expo File System** (file operations)

### Backend
- **FastAPI** (Python web framework)
- **Supabase** (PostgreSQL database + Auth + Storage)
- **OpenAI API** (Vision API for OCR)
- **Trafilatura** (URL content extraction)
- **BeautifulSoup** (HTML parsing)

### Infrastructure
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL database
  - Authentication (JWT)
  - Storage (for images)
  - Row Level Security (RLS)

## Data Flow

### Creating a Recipe
1. User fills out recipe form or imports from URL/image
2. On native: Recipe saved to local SQLite database with local ID
3. Sync service uploads image to Supabase Storage (if present)
4. Sync service creates recipe on server via API
5. Server generates UUID and returns recipe
6. Local database updated with server UUID
7. Recipe marked as synced

### Authentication Flow
1. User signs in/up via Supabase Auth
2. JWT token stored in AsyncStorage
3. Token automatically included in API requests
4. Backend validates token with Supabase
5. Token auto-refreshes when expired

### Offline Sync
1. Recipes created offline stored locally
2. Background sync service runs periodically
3. When online, syncs all unsynced recipes
4. Handles conflicts and errors gracefully

## Current Status

### ✅ Completed
- Authentication (sign up, sign in, sign out)
- Recipe CRUD operations
- Recipe import (OCR, URL, Instagram)
- Image upload and storage
- Offline support with local database
- Background sync service
- Error handling and boundaries
- UI/UX improvements

### 🔧 Recently Fixed
- Token refresh logic
- Image upload to Supabase Storage
- Local ID to UUID conversion during sync
- Error message formatting
- Deprecated API usage (FileSystem)
- Storage bucket creation

### 📋 Setup Required
- Database tables (run `supabase/schema.sql`)
- Storage bucket (`recipe-images`) - ✅ Created
- Storage policies (optional but recommended)
- Environment variables configured

## Environment Variables

### Frontend (`app/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://your-ip:8000
```

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

## Running the Project

### Frontend
```bash
cd app
npm install
npx expo start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Key Design Decisions

1. **Offline-First**: Local database for offline access, sync when online
2. **Supabase**: Chosen for auth, database, and storage in one platform
3. **OpenAI Vision**: More accurate than Tesseract for recipe OCR
4. **Expo Router**: File-based routing for simpler navigation
5. **React Query**: Automatic caching and background refetching
6. **Zustand**: Lightweight state management for auth and sync

## Next Steps / Future Enhancements

- [ ] Recipe sharing between users
- [ ] Recipe collections/folders
- [ ] Meal planning
- [ ] Shopping list generation
- [ ] Recipe ratings and reviews
- [ ] Social features (follow users, like recipes)
- [ ] Recipe export (PDF, text)
- [ ] Voice notes for recipes
- [ ] Recipe video support
- [ ] Advanced search and filters

