# Recipe Vault Architecture

## Overview

Recipe Vault is a full-stack mobile application built with an offline-first architecture. The app allows users to manage recipes with support for multiple import methods and seamless synchronization.

## Tech Stack

### Frontend
- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type safety
- **Expo Router**: File-based routing
- **React Query**: Server state management and caching
- **Zustand**: Client state management
- **Expo SQLite**: Local database for offline storage

### Backend
- **FastAPI**: High-performance Python web framework
- **Supabase**: Backend-as-a-Service (Postgres, Auth, Storage)
- **Tesseract OCR**: Image text extraction
- **Trafilatura**: Web content extraction

## Architecture Patterns

### Clean Architecture

The project follows clean architecture principles with clear separation of concerns:

```
mobile/
├── app/              # Presentation layer (screens, routing)
├── src/
│   ├── components/   # UI components
│   ├── hooks/        # Custom React hooks
│   ├── services/     # External service integrations
│   ├── store/        # State management (Zustand)
│   ├── db/           # Data access layer (SQLite)
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions

backend/
├── app/
│   ├── routers/      # API endpoints
│   ├── services/     # Business logic
│   ├── models/       # Data models (Pydantic)
│   ├── dependencies/ # Dependency injection
│   └── database.py   # Database connection
```

### Offline-First Architecture

1. **Local-First**: All data is stored locally in SQLite
2. **Background Sync**: Changes sync to Supabase when online
3. **Conflict Resolution**: Last-write-wins strategy
4. **Optimistic Updates**: UI updates immediately, syncs in background

### Data Flow

```
User Action → Local DB (SQLite) → Background Sync → Supabase
                ↓
         React Query Cache
                ↓
            UI Update
```

## Key Features

### Recipe Import Methods

1. **Manual Input**: User enters recipe details manually
2. **URL Import**: Parses recipe from web URL
3. **OCR Import**: Extracts recipe from image using Tesseract
4. **Share Intent**: Handles shared URLs/images from other apps
5. **Clipboard Detection**: Automatically detects recipe URLs in clipboard

### Synchronization Strategy

- **Create**: Store locally with `is_synced=false`, sync in background
- **Update**: Update locally, mark as unsynced, sync in background
- **Delete**: Delete locally, sync deletion to server
- **Conflict**: Last-write-wins (server timestamp wins)

## Database Schema

### Local (SQLite)
- `recipes`: Main recipe table
- `ingredients`: Recipe ingredients
- `steps`: Recipe instructions
- `tags`: Recipe tags
- `recipe_tags`: Many-to-many relationship

### Remote (Supabase Postgres)
- Same schema as local
- Row Level Security (RLS) enabled
- Automatic timestamps and UUIDs

## API Design

RESTful API with the following endpoints:

- `GET /api/recipes` - List all recipes
- `GET /api/recipes/{id}` - Get recipe by ID
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe
- `GET /api/recipes/search?q=query` - Search recipes
- `POST /api/ocr` - Extract recipe from image
- `POST /api/parse-url` - Parse recipe from URL

## Security

- **Authentication**: Supabase Auth (JWT tokens)
- **Authorization**: Row Level Security (RLS) in Supabase
- **API Security**: Bearer token authentication
- **Storage**: Private buckets with user-based access

## Development Workflow

1. **Frontend**: `cd mobile && npm install && npx expo start`
2. **Backend**: `cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
3. **Database**: Run `supabase/schema.sql` in Supabase SQL editor

## TODO Items

All files contain TODO markers indicating:
- Implementation details to complete
- Configuration needed
- Edge cases to handle
- Performance optimizations
- Error handling improvements

