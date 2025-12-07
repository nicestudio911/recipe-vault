# Debugging Guide for Expo/React Native

## Quick Ways to View Logs and Errors

### 1. **Terminal Logs (Easiest)**
When you run `npx expo start`, all console logs appear in your terminal:
```bash
cd app
npx expo start
```

- All `console.log()`, `console.error()`, etc. appear in the terminal
- Errors are highlighted in red
- Press `j` to open debugger
- Press `r` to reload

### 2. **Expo Dev Tools (Web Interface)**
When Expo starts, it opens a web interface at `http://localhost:8081`:
- Click "Open in web browser" or go to `http://localhost:8081`
- Click "Logs" tab to see all console output
- Much easier to read than device screen

### 3. **React Native Debugger**
Install React Native Debugger for better debugging:
```bash
# Install globally
npm install -g react-native-debugger

# Or download from: https://github.com/jhen0409/react-native-debugger/releases
```

Then in Expo Go:
- Shake your device (or press `Cmd+D` on iOS simulator / `Cmd+M` on Android)
- Select "Debug Remote JS"
- Opens Chrome DevTools with full debugging

### 4. **Chrome DevTools (Built-in)**
1. Shake device (or press `Cmd+D` / `Cmd+M`)
2. Select "Debug Remote JS"
3. Chrome opens automatically
4. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
5. Go to "Console" tab to see all logs

### 5. **React DevTools**
For component inspection:
```bash
npm install -g react-devtools
react-devtools
```

Then in Expo Go:
- Shake device → "Debug Remote JS"
- React DevTools will connect automatically

### 6. **Expo Go Built-in Menu**
On your device:
- **iOS**: Shake device or 3-finger tap
- **Android**: Shake device or press menu button
- Select "Show Dev Menu"
- Options:
  - "Reload" - Reload app
  - "Debug Remote JS" - Open Chrome debugger
  - "Show Element Inspector" - Inspect UI elements
  - "Performance Monitor" - See FPS and performance

### 7. **Add Better Error Display in App**
We can add an error boundary component that shows errors on screen. Would you like me to add this?

## Quick Commands

```bash
# Start Expo with clear logs
cd app
npx expo start --clear

# Start and automatically open in browser
npx expo start --web

# Start with tunnel (if on different network)
npx expo start --tunnel

# View logs only (no QR code)
npx expo start --no-dev --minify
```

## Tips

1. **Use console.log() liberally**:
   ```javascript
   console.log('User ID:', user.id);
   console.error('Error creating recipe:', error);
   ```

2. **Check terminal first** - Most errors appear there immediately

3. **Use React Query DevTools** (if using React Query):
   ```bash
   npm install @tanstack/react-query-devtools
   ```

4. **Network errors** - Check the Network tab in Chrome DevTools when debugging

5. **Red Screen of Death** - Tap the error message to see full stack trace

## Common Issues

### Can't see logs?
- Make sure you're looking at the terminal where `expo start` is running
- Check if logs are being filtered
- Try `npx expo start --clear` to clear cache

### Errors not showing?
- Check if error boundaries are catching them
- Look in Chrome DevTools console
- Check the Expo Dev Tools web interface

### Network errors?
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Verify backend is running
- Check firewall/network settings

