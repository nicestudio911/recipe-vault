# Authentication Setup Guide

This guide explains how to set up login and sign up functionality using Supabase Auth.

## Prerequisites

1. **Supabase Project**: You need a Supabase project with Auth enabled
2. **Environment Variables**: Configure Supabase URL and keys

## Step 1: Configure Environment Variables

Create a `.env` file in the `app/` directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Get these values from:
- Supabase Dashboard → Settings → API
- Project URL: `https://your-project.supabase.co`
- anon/public key: Copy the `anon` `public` key

## Step 2: Supabase Auth Configuration

### Enable Email Auth Provider

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Configure email templates (optional)

### Email Confirmation (Optional)

- **For development**: Disable email confirmation in Auth → Settings
- **For production**: Enable email confirmation and configure email templates

### Configure Redirect URLs

For Expo apps, add these redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
- `exp://localhost:8081` (Expo Go)
- `nomnombook://` (Custom scheme, if using)

## Step 3: Implementation Overview

The authentication system consists of:

1. **Auth Store** (`app/src/store/authStore.ts`) - Already implemented ✅
   - Manages auth state
   - Handles sign in, sign up, sign out
   - Listens to auth state changes

2. **Supabase Client** (`app/src/services/supabase.ts`) - Already configured ✅
   - Creates Supabase client with AsyncStorage for session persistence

3. **Auth Screens** - Need to be created:
   - Login screen (`app/app/auth/login.tsx`)
   - Sign up screen (`app/app/auth/signup.tsx`)

4. **Auth Guard** - Need to be added:
   - Protect routes in `app/app/_layout.tsx`
   - Redirect unauthenticated users to login

## Step 4: How It Works

### Authentication Flow

1. **App Start**: 
   - `_layout.tsx` calls `authStore.initialize()`
   - Checks for existing session
   - If no session → redirect to login
   - If session exists → show main app

2. **Login**:
   - User enters email/password
   - Calls `authStore.signIn(email, password)`
   - On success → navigate to main app
   - On error → show error message

3. **Sign Up**:
   - User enters email/password/name
   - Calls `authStore.signUp(email, password, fullName)`
   - On success → navigate to main app (or email confirmation screen)
   - On error → show error message

4. **Sign Out**:
   - User clicks sign out in settings
   - Calls `authStore.signOut()`
   - Redirects to login screen

### Session Persistence

- Sessions are stored in AsyncStorage
- Automatically restored on app restart
- Auto-refresh tokens when they expire

## Step 5: Testing

1. **Start the app**: `npx expo start`
2. **Test Sign Up**:
   - Enter email and password
   - Should create account and log in
3. **Test Sign In**:
   - Sign out
   - Sign in with same credentials
4. **Test Session Persistence**:
   - Log in
   - Close and reopen app
   - Should still be logged in

## Troubleshooting

### "Invalid API key" error
- Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo dev server after changing `.env`

### "Email not confirmed" error
- Check Supabase Auth settings
- Disable email confirmation for development
- Or check email inbox for confirmation link

### Session not persisting
- Check AsyncStorage is working
- Verify `authStore.initialize()` is called in `_layout.tsx`

### Redirect URL errors
- Add your app's redirect URL to Supabase Dashboard
- For Expo Go: `exp://localhost:8081`

