# Project Structure

## Root Directory

```
recipe-vault/
├── mobile/              # React Native + Expo frontend
├── backend/             # FastAPI backend
├── supabase/            # Supabase schema and migrations
├── docs/                # Documentation
└── README.md            # Project overview
```

## Mobile App Structure

```
mobile/
├── app/                 # Expo Router pages
│   ├── (tabs)/         # Tab navigation screens
│   │   ├── index.tsx   # Recipes list
│   │   ├── search.tsx  # Search screen
│   │   ├── tags.tsx    # Tags screen
│   │   └── settings.tsx # Settings screen
│   ├── recipe/         # Recipe screens
│   │   ├── [id].tsx    # Recipe detail
│   │   ├── add.tsx     # Add recipe
│   │   └── edit/[id].tsx # Edit recipe
│   └── _layout.tsx     # Root layout
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── RecipeHeader.tsx
│   │   ├── IngredientsList.tsx
│   │   ├── StepsList.tsx
│   │   ├── TagsList.tsx
│   │   └── FloatingActionButton.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── useRecipes.ts
│   │   ├── useTags.ts
│   │   ├── useClipboard.ts
│   │   └── useShareIntent.ts
│   ├── services/       # External service integrations
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── store/          # Zustand state stores
│   │   ├── authStore.ts
│   │   └── syncStore.ts
│   ├── db/             # Local database (SQLite)
│   │   ├── database.ts
│   │   └── recipeRepository.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   └── utils/          # Utility functions
│       └── validation.ts
├── assets/             # Images, fonts, etc.
├── package.json
├── tsconfig.json
├── app.json
└── babel.config.js
```

## Backend Structure

```
backend/
├── app/
│   ├── main.py         # FastAPI application entry point
│   ├── config.py       # Configuration settings
│   ├── database.py     # Supabase client
│   ├── dependencies.py # Dependency injection
│   ├── routers/        # API route handlers
│   │   ├── recipes.py
│   │   ├── ocr.py
│   │   └── url_parser.py
│   ├── services/       # Business logic
│   │   ├── recipe_service.py
│   │   ├── ocr_service.py
│   │   ├── url_parser_service.py
│   │   ├── recipe_parser.py
│   │   └── storage_service.py
│   └── models/         # Pydantic models
│       └── recipe.py
├── requirements.txt
└── .env.example
```

## Supabase Structure

```
supabase/
└── schema.sql          # Database schema with RLS policies
```

## Documentation Structure

```
docs/
├── ARCHITECTURE.md     # Architecture overview
├── PROJECT_STRUCTURE.md # This file
└── openapi.yaml        # OpenAPI specification
```

## Key Files

### Frontend
- `mobile/app/_layout.tsx`: Root layout with providers
- `mobile/src/db/database.ts`: SQLite initialization
- `mobile/src/services/api.ts`: API client for backend
- `mobile/src/store/syncStore.ts`: Sync logic

### Backend
- `backend/app/main.py`: FastAPI app setup
- `backend/app/routers/recipes.py`: Recipe CRUD endpoints
- `backend/app/services/recipe_parser.py`: Recipe parsing logic
- `backend/app/services/ocr_service.py`: OCR processing

### Database
- `supabase/schema.sql`: Complete database schema with RLS

