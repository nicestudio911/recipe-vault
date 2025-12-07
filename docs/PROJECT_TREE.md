# Complete Project Tree

```
recipe-vault/
├── app/                          # React Native Expo App
│   ├── app/                      # Expo Router pages
│   │   ├── _layout.tsx          # Root layout
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx        # HomeScreen
│   │   │   ├── search.tsx
│   │   │   ├── tags.tsx
│   │   │   └── settings.tsx
│   │   └── recipe/
│   │       ├── [id].tsx         # RecipeDetailScreen
│   │       ├── add.tsx          # AddRecipeScreen
│   │       ├── import-url.tsx   # ImportURLScreen
│   │       ├── import-ocr.tsx   # OCRImportScreen
│   │       └── edit/
│   │           └── [id].tsx
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeForm.tsx
│   │   │   ├── RecipeHeader.tsx
│   │   │   ├── IngredientsList.tsx
│   │   │   ├── StepsList.tsx
│   │   │   ├── TagsList.tsx
│   │   │   └── FloatingActionButton.tsx
│   │   ├── hooks/               # Custom Hooks
│   │   │   ├── useRecipes.ts
│   │   │   ├── useOCR.ts
│   │   │   ├── useURLParser.ts
│   │   │   ├── useOfflineRecipes.ts
│   │   │   └── useSync.ts
│   │   ├── services/            # Services
│   │   │   ├── api.ts           # API client
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── syncService.ts   # Sync service
│   │   ├── store/               # State Management
│   │   │   ├── authStore.ts     # Auth state
│   │   │   └── syncStore.ts     # Sync state
│   │   ├── db/                  # Local Database
│   │   │   ├── database.ts      # SQLite setup
│   │   │   └── recipeRepository.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── index.ts
│   │   ├── constants/           # Constants
│   │   │   └── theme.ts
│   │   └── utils/               # Utilities
│   │       └── index.ts
│   ├── assets/                  # Images, fonts
│   ├── package.json
│   ├── tsconfig.json
│   ├── app.json
│   ├── babel.config.js
│   └── jest.config.js
│
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database connection
│   │   ├── dependencies.py      # Dependency injection
│   │   ├── api/                 # API routes
│   │   │   └── routes/
│   │   │       ├── recipes.py
│   │   │       ├── auth.py
│   │   │       ├── ocr.py
│   │   │       └── url_parser.py
│   │   ├── services/            # Business logic
│   │   │   ├── recipe_service.py
│   │   │   ├── ocr_service.py
│   │   │   ├── url_parser_service.py
│   │   │   ├── recipe_parser.py
│   │   │   ├── storage_service.py
│   │   │   └── auth_service.py
│   │   ├── models/              # Pydantic models
│   │   │   └── recipe.py
│   │   ├── schemas/             # Request/Response schemas
│   │   │   └── auth.py
│   │   ├── core/                # Core configuration
│   │   │   └── config.py
│   │   ├── db/                  # Database
│   │   │   └── session.py
│   │   ├── middleware/          # Middleware
│   │   │   ├── cors.py
│   │   │   └── error_handler.py
│   │   └── utils/               # Utilities
│   │       ├── validators.py
│   │       └── helpers.py
│   ├── tests/                   # Tests
│   │   ├── test_recipes.py
│   │   ├── test_ocr.py
│   │   └── conftest.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── pytest.ini
│   └── .env.example
│
├── shared/                       # Shared Types
│   └── types/
│       ├── api.ts
│       ├── recipe.ts
│       └── user.ts
│
├── supabase/                     # Supabase Schema
│   ├── schema.sql               # Complete schema
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── docs/                         # Documentation
│   ├── SETUP.md
│   ├── RUN_INSTRUCTIONS.md
│   ├── PROJECT_TREE.md
│   ├── SCHEMA_DIAGRAM.md
│   └── SUPABASE_MIGRATION_STEPS.md
│
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD pipeline
│
└── README.md
```

## File Count Summary

- **Backend**: ~25 Python files
- **Frontend**: ~30 TypeScript/TSX files
- **Tests**: ~5 test files
- **Documentation**: ~10 markdown files
- **Configuration**: ~10 config files

## Key Features by Directory

### app/
- React Native Expo app
- Offline-first with SQLite
- OCR and URL import
- Sync service
- Complete UI screens

### backend/
- FastAPI REST API
- OCR service (Tesseract)
- URL parser (trafilatura)
- Recipe parser
- Supabase integration

### supabase/
- Complete database schema
- RLS policies
- Migrations

### tests/
- Backend unit tests (pytest)
- Frontend component tests (Jest)

### .github/workflows/
- CI/CD pipeline
- Lint, typecheck, test, build

