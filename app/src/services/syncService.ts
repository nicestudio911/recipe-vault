import { recipeRepository } from '@/db/recipeRepository';
import { apiClient } from './api';
import { Recipe } from '@/types';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '@/store/authStore';

// Only import background fetch on native platforms
// Note: expo-background-fetch is deprecated but still functional
// Consider migrating to expo-task-manager with native background tasks in the future
let TaskManager: any;
let BackgroundFetch: any;

if (Platform.OS !== 'web') {
  TaskManager = require('expo-task-manager');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BackgroundFetch = require('expo-background-fetch');
}

const SYNC_TASK = 'recipe-sync';

export class SyncService {
  private isSyncing = false;

  async syncAll(userId: string): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const unsyncedRecipes = await recipeRepository.getUnsyncedRecipes(userId);

      for (const recipe of unsyncedRecipes) {
        try {
          await this.syncRecipe(recipe);
        } catch (error) {
          console.error(`Failed to sync recipe ${recipe.id}:`, error);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async syncRecipe(recipe: Recipe): Promise<void> {
    try {
      // Get current user for auth
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Ensure API client has the current token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session. Please sign in again.');
      }
      apiClient.setAuthToken(session.access_token);

      // Upload image if it's a local file URI
      let imageUrl = recipe.image_url;
      if (imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('content://') || !imageUrl.startsWith('http'))) {
        try {
          imageUrl = await this.uploadImageToStorage(imageUrl, user.id);
        } catch (error) {
          console.error(`Failed to upload image for recipe ${recipe.id}:`, error);
          // Continue without image if upload fails
          imageUrl = undefined;
        }
      }

      // Prepare recipe data for sync
      const recipeData = {
        ...recipe,
        image_url: imageUrl,
        // Convert to API format
        tag_ids: recipe.tags?.map(t => t.id) || [],
      };

      let syncedRecipe: Recipe;
      
      // Check if recipe has a real UUID (synced) or local ID
      const isLocalId = recipe.id.startsWith('local_');
      
      if (recipe.is_synced && !isLocalId) {
        // Update existing recipe (has real UUID)
        syncedRecipe = await apiClient.updateRecipe(recipe.id, recipeData);
      } else {
        // Create new recipe (local ID or not synced)
        // Remove local ID so server generates a new UUID
        const { id: localId, ...recipeDataWithoutId } = recipeData;
        syncedRecipe = await apiClient.createRecipe(recipeDataWithoutId);
        
        // Update local database with the new server UUID
        if (localId !== syncedRecipe.id) {
          await recipeRepository.updateRecipeId(localId, syncedRecipe.id);
        }
      }

      await recipeRepository.markAsSynced(syncedRecipe.id, new Date().toISOString());
    } catch (error) {
      console.error(`Sync failed for recipe ${recipe.id}:`, error);
      throw error;
    }
  }

  private async uploadImageToStorage(imageUri: string, userId: string): Promise<string> {
    try {
      // Read the file using legacy API (compatible with SDK 54)
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer for React Native compatibility
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const arrayBuffer = byteArray.buffer;

      // Generate filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const filename = `${timestamp}_${random}.jpg`;
      const filePath = `${userId}/${filename}`;

      // Upload to Supabase Storage using ArrayBuffer
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        // Provide helpful error message for missing bucket
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          throw new Error(
            'Storage bucket "recipe-images" not found. Please create it in Supabase Dashboard → Storage. See docs/STORAGE_SETUP.md for instructions.'
          );
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      throw error;
    }
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    try {
      await apiClient.deleteRecipe(recipeId);
    } catch (error) {
      console.error(`Failed to delete recipe ${recipeId}:`, error);
      throw error;
    }
  }

  registerBackgroundSync() {
    // Only register on native platforms
    if (Platform.OS === 'web' || !TaskManager || !BackgroundFetch) {
      console.log('Background sync not available on web platform');
      return;
    }

    TaskManager.defineTask(SYNC_TASK, async () => {
      try {
        // Get userId from auth store
        const { user } = useAuthStore.getState();
        if (user) {
          await this.syncAll(user.id);
        }
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    BackgroundFetch.registerTaskAsync(SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export const syncService = new SyncService();

