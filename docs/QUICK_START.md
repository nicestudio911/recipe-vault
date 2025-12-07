# Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Supabase account
- Tesseract OCR installed (for backend OCR functionality)

## Setup Steps

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in the SQL editor
3. Create a storage bucket named `recipe-images` in Storage
4. Set up storage policies for authenticated users
5. Copy your Supabase URL and keys

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# Install Tesseract (Ubuntu/Debian)
sudo apt-get install tesseract-ocr

# Run the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd mobile
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials and API URL

# Start Expo
npx expo start
```

### 4. Development Workflow

1. **Backend**: Keep `uvicorn app.main:app --reload` running
2. **Frontend**: Use Expo Go app on your phone or emulator
3. **Database**: Use Supabase dashboard for database management

## Testing the Setup

### Test Backend

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

### Test Frontend

1. Open Expo Go app on your device
2. Scan the QR code from the terminal
3. The app should load (you'll need to implement auth first)

## Next Steps

1. Implement authentication flow
2. Complete TODO items in the codebase
3. Test recipe CRUD operations
4. Test OCR and URL parsing
5. Test offline sync functionality

## Common Issues

### Tesseract not found
- Install Tesseract: `sudo apt-get install tesseract-ocr` (Linux) or `brew install tesseract` (Mac)
- Update `TESSERACT_CMD` in backend `.env` if needed

### Supabase connection errors
- Verify your Supabase URL and keys in `.env` files
- Check that RLS policies are set up correctly

### Expo build errors
- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall

