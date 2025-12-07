# How to Run the Backend

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Activate Virtual Environment

**If you already have a virtual environment:**
```bash
source venv/bin/activate
```

**If you don't have a virtual environment yet:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies (if needed)
```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:
```bash
cp .env.example .env
# Then edit .env with your Supabase credentials
```

Required environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the Server

**For local development only:**
```bash
uvicorn app.main:app --reload
```

**For network access (to allow mobile devices to connect):**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Server URLs

Once running, the backend will be available at:
- **API Base:** `http://localhost:8000`
- **API Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

## Command Options

- `--reload`: Auto-reload on code changes (development mode)
- `--host 0.0.0.0`: Allow connections from other devices on your network
- `--port 8000`: Specify port (default is 8000)

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

### Port Already in Use
If port 8000 is already in use:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Module Not Found Errors
Make sure you've activated the virtual environment and installed dependencies:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Database Connection Errors
Check your `.env` file has correct Supabase credentials:
- `SUPABASE_URL`
- `SUPABASE_KEY` (service role key)
- `SUPABASE_ANON_KEY`

## Full Command Example

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

This will:
- Start the server
- Enable auto-reload on file changes
- Allow connections from mobile devices
- Run on port 8000

