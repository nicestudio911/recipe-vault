# Tesseract OCR Installation Guide

## Error
```
OCR processing failed: /usr/bin/tesseract is not installed or its not in your path
```

## Solution: Install Tesseract OCR

### On Fedora/RHEL (Your System)
```bash
sudo dnf install -y tesseract tesseract-langpack-eng
```

### On Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-eng
```

### On macOS
```bash
brew install tesseract
```

### On Windows
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location: `C:\Program Files\Tesseract-OCR`
3. Add to PATH or configure in backend `.env` file

## Verify Installation

After installation, verify it works:
```bash
tesseract --version
```

You should see something like:
```
tesseract 5.x.x
```

## Find Tesseract Path

If Tesseract is installed but not in the default location, find it:
```bash
which tesseract
# or
find /usr -name "tesseract" 2>/dev/null
```

## Configure Backend

If Tesseract is in a different location, update `backend/.env`:
```env
TESSERACT_CMD=/path/to/tesseract
```

Or update `backend/app/core/config.py` default value.

## Alternative: Use OpenAI Vision Only

If you don't want to install Tesseract, you can use OpenAI Vision API only:

1. Set `OPENAI_API_KEY` in `backend/.env`
2. Use `vision` method when calling OCR:
   - In the app, the OCR will try hybrid first, but you can modify to use vision only
   - Or set `OCR_METHOD=vision` in backend `.env`

## After Installation

1. Restart the backend server
2. Try OCR again - it should work now

