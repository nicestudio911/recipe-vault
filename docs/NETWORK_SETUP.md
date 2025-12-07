# Network Setup Guide

## Problem: Network Errors on Mobile Devices

When running the app on a mobile device (iOS/Android), you may encounter network errors when trying to:
- Add recipes
- Import from URL
- Import from Instagram
- Import from image (OCR)

This happens because mobile devices can't connect to `localhost` or `127.0.0.1` - these refer to the device itself, not your development computer.

## Solution: Use Your Computer's IP Address

### Step 1: Find Your Computer's IP Address

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**On Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under your active network interface (usually `en0` or `eth0`)

**Example IP:** `192.168.1.100`

### Step 2: Update Environment Variables

1. Open `app/.env` file (create it if it doesn't exist)
2. Add or update:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
   ```
   Replace `192.168.1.100` with your actual IP address.

3. Restart Expo:
   ```bash
   # Stop the current Expo server (Ctrl+C)
   npx expo start --clear
   ```

### Step 3: Verify Backend is Running

Make sure your backend server is running and accessible:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0
```

The `--host 0.0.0.0` flag is important - it allows connections from other devices on your network.

### Step 4: Test Connection

1. On your computer, open: `http://192.168.1.100:8000/docs`
2. If it loads, the backend is accessible
3. If not, check your firewall settings

## Troubleshooting

### Still Getting Network Errors?

1. **Check Firewall:**
   - Windows: Allow Python/uvicorn through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall
   - Linux: Check iptables/ufw settings

2. **Verify Same Network:**
   - Both your computer and mobile device must be on the same Wi-Fi network
   - Mobile data won't work - you need Wi-Fi

3. **Check Backend Logs:**
   - Look at the backend terminal for error messages
   - Make sure the backend is actually running

4. **Test with curl:**
   ```bash
   curl http://192.168.1.100:8000/health
   ```
   Should return a response if backend is accessible

5. **Use Web Version:**
   - If mobile continues to have issues, test on web first
   - Web version uses `localhost` which works fine

### Alternative: Use ngrok (For Testing)

If you can't use local network, you can use ngrok to create a public tunnel:

```bash
# Install ngrok
npm install -g ngrok

# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, create tunnel
ngrok http 8000
```

Then use the ngrok URL in your `.env`:
```env
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
```

**Note:** ngrok free tier has limitations. Only use for testing.

## Quick Checklist

- [ ] Backend is running with `--host 0.0.0.0`
- [ ] Found your computer's IP address
- [ ] Updated `app/.env` with `EXPO_PUBLIC_API_URL`
- [ ] Restarted Expo server
- [ ] Computer and mobile device on same Wi-Fi
- [ ] Firewall allows connections on port 8000
- [ ] Can access `http://YOUR_IP:8000/docs` from browser

## Example .env File

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
# For web: use localhost
# For mobile: use your computer's IP address
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

