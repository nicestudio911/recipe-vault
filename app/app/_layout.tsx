import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { initDatabase } from '@/db/database';
import { useAuthStore } from '@/store/authStore';
import { syncService } from '@/services/syncService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutNav() {
  const { user, loading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await initDatabase();
      await initialize();
      setIsInitialized(true);
      
      // Only register background sync on native platforms (not web)
      if (Platform.OS !== 'web') {
        syncService.registerBackgroundSync();
      }
    };
    setup();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated and on auth screen
      router.replace('/(tabs)');
    }
  }, [user, segments, isInitialized, loading, router]);

  // Show loading screen while checking auth
  if (!isInitialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f4511e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="auth/login" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ title: 'Sign Up', headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe Details' }} />
      <Stack.Screen name="recipe/add" options={{ title: 'Add Recipe' }} />
      <Stack.Screen name="recipe/import-url" options={{ title: 'Import from URL' }} />
      <Stack.Screen name="recipe/import-ocr" options={{ title: 'Import from Image' }} />
      <Stack.Screen name="recipe/import-instagram" options={{ title: 'Import from Instagram' }} />
      {/* recipe/edit/[id] is automatically handled by Expo Router based on file structure */}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
