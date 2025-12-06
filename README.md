# nomnombook

A full-stack mobile application for managing recipes with offline-first architecture, OCR import, and URL parsing.

## 🚀 Features

- **Manual Recipe Input**: Create recipes with ingredients, steps, and images
- **URL Import**: Automatically parse recipes from web URLs
- **OCR Import**: Extract recipes from images using Tesseract OCR
- **Offline-First**: Works completely offline with SQLite, syncs when online
- **Share Intent**: Import recipes from other apps (Android/iOS)
- **Clipboard Detection**: Auto-detect recipe URLs in clipboard
- **Tags & Search**: Organize and find recipes easily
- **Sync Engine**: Background sync with conflict resolution

## 📋 Tech Stack

### Frontend
- **React Native + Expo** (TypeScript)
- **Expo Router** for navigation
- **React Query** for server state
- **Zustand** for client state
- **Expo SQLite** for offline storage
- **Supabase JS** for authentication

### Backend
- **FastAPI** (Python)
- **Supabase** (Postgres, Auth, Storage)
- **Tesseract OCR** for image processing
- **Trafilatura** for web scraping
- **Custom Recipe Parser** for structured data extraction

## 📁 Project Structure

```
recipe-vault/
├── app/                 # React Native Expo app
├── backend/             # FastAPI backend
├── shared/              # Shared TypeScript types
├── supabase/            # Database schema
├── docs/                # Documentation
└── .github/workflows/   # CI/CD
```

See [PROJECT_TREE.md](docs/PROJECT_TREE.md) for complete structure.

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- Tesseract OCR

### 1. Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Create storage bucket `recipe-images`
4. Copy API keys

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd app
npm install
# Create .env with Supabase and API URLs
npx expo start
```

See [SETUP.md](docs/SETUP.md) for detailed instructions.

## 📚 Documentation

- [Setup Instructions](docs/SETUP.md) - Complete setup guide
- [Run Instructions](docs/RUN_INSTRUCTIONS.md) - How to run the app
- [Project Tree](docs/PROJECT_TREE.md) - Complete file structure
- [Schema Diagram](docs/SCHEMA_DIAGRAM.md) - Database schema
- [Migration Steps](docs/SUPABASE_MIGRATION_STEPS.md) - Database migrations

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd app
npm test
```

## 🐳 Docker

### Backend

```bash
cd backend
docker-compose up --build
```

## 🔄 CI/CD

GitHub Actions workflow includes:
- Lint checks
- Type checking
- Unit tests
- Docker builds
- Expo app builds

See `.github/workflows/ci.yml`

## 📱 Screens

- **HomeScreen**: List all recipes
- **AddRecipeScreen**: Manual recipe creation
- **ImportURLScreen**: Import from URL
- **OCRImportScreen**: Import from image
- **RecipeDetailScreen**: View recipe details
- **SettingsScreen**: Account and sync settings

## 🔐 Authentication

Uses Supabase Auth with JWT tokens. Users can:
- Sign up
- Sign in
- Sign out
- Auto-refresh tokens

## 💾 Offline Support

- All data stored locally in SQLite
- Changes sync to Supabase when online
- Background sync with Expo Task Manager
- Conflict resolution (last-write-wins)

## 🎨 API Endpoints

- `GET /api/v1/recipes` - List recipes
- `GET /api/v1/recipes/{id}` - Get recipe
- `POST /api/v1/recipes` - Create recipe
- `PUT /api/v1/recipes/{id}` - Update recipe
- `DELETE /api/v1/recipes/{id}` - Delete recipe
- `GET /api/v1/recipes/search?q=query` - Search recipes
- `POST /api/v1/ocr` - OCR image processing
- `POST /api/v1/parse-url` - Parse recipe from URL

See API docs at `http://localhost:8000/docs`

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub.
