# Run Instructions

## Quick Start

### 1. Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload
```

Backend runs on: `http://localhost:8000`

### 2. Start Frontend

```bash
cd app
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Development Workflow

### Backend Development

1. Make changes to code in `backend/app/`
2. Server auto-reloads (if using `--reload`)
3. Check logs in terminal
4. Test endpoints at `http://localhost:8000/docs`

### Frontend Development

1. Make changes to code in `app/`
2. App hot-reloads automatically
3. Check Metro bundler logs
4. Use React Native Debugger for debugging

### Database Changes

1. Update `supabase/schema.sql`
2. Run in Supabase SQL Editor
3. Or use Supabase CLI migrations

## Production Build

### Backend

```bash
cd backend
docker build -t recipe-vault-backend .
docker run -p 8000:8000 recipe-vault-backend
```

### Frontend

```bash
cd app
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
STORAGE_BUCKET=recipe-images
TESSERACT_CMD=/usr/bin/tesseract
DEBUG=False
```

### Frontend (.env)

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Common Commands

### Backend

```bash
# Run tests
pytest tests/ -v

# Format code
black app/
isort app/

# Type check
mypy app/
```

### Frontend

```bash
# Run tests
npm test

# Lint
npm run lint

# Type check
npm run type-check

# Clear cache
npx expo start -c
```

## Debugging

### Backend

- Check FastAPI docs: `http://localhost:8000/docs`
- View logs in terminal
- Use Python debugger: `import pdb; pdb.set_trace()`

### Frontend

- Use React Native Debugger
- Check Metro bundler logs
- Use `console.log()` for debugging
- Enable remote debugging in Expo Go

## Sync Testing

1. Create recipe offline (airplane mode)
2. Turn on network
3. Check sync status in Settings
4. Verify recipe appears in Supabase

## OCR Testing

1. Go to Import → OCR
2. Take photo or select image
3. Wait for processing
4. Review parsed recipe
5. Save recipe

## URL Parsing Testing

1. Go to Import → URL
2. Enter recipe URL (e.g., allrecipes.com)
3. Wait for parsing
4. Review parsed recipe
5. Save recipe

