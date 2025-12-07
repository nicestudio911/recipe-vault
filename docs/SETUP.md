# Complete Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Supabase account
- Tesseract OCR (for backend)
- Expo CLI (for mobile app)

## 1. Supabase Setup

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned

### Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run" to execute the schema
4. Verify all tables are created in Table Editor

### Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New Bucket"
3. Name: `recipe-images`
4. Make it Public (or configure policies)
5. Set up storage policies:
   - Policy name: "Users can upload to own folder"
   - Policy: `bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text`
   - Operation: INSERT
   
   - Policy name: "Users can read from own folder"
   - Policy: `bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text`
   - Operation: SELECT

### Get API Keys

1. Go to Settings → API
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

## 2. Backend Setup

### Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Install Tesseract OCR

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Windows:**
Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
STORAGE_BUCKET=recipe-images
TESSERACT_CMD=/usr/bin/tesseract  # Adjust path if needed
DEBUG=False
CORS_ORIGINS=["*"]
```

### Run Backend

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### Test Backend

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

## 3. Frontend Setup

### Install Dependencies

```bash
cd app
npm install
```

### Configure Environment

Create `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Run Frontend

```bash
npx expo start
```

### Run on Device

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. App will load on your device

## 4. Docker Setup (Optional)

### Build and Run Backend

```bash
cd backend
docker-compose up --build
```

## 5. Testing

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

## Troubleshooting

### Tesseract Not Found

- Verify Tesseract is installed: `tesseract --version`
- Update `TESSERACT_CMD` in `.env` with correct path
- On macOS: Usually `/usr/local/bin/tesseract`
- On Linux: Usually `/usr/bin/tesseract`

### Supabase Connection Errors

- Verify URL and keys in `.env` files
- Check Supabase project is active
- Verify RLS policies are set correctly

### Expo Build Errors

- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall
- Check Node.js version: `node --version` (should be 18+)

### Database Migration Issues

- Check Supabase logs for errors
- Verify all tables exist in Table Editor
- Re-run schema.sql if needed

