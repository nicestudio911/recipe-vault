import { create } from 'zustand';
import { SyncStatus } from '@/types';
import { syncService } from '@/services/syncService';
import { useAuthStore } from './authStore';

interface SyncState {
  status: SyncStatus['status'];
  lastSync?: string;
  error?: string;
  syncNow: () => Promise<void>;
  syncRecipe: (recipeId: string) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSync: undefined,
  error: undefined,

  syncNow: async () => {
    set({ status: 'syncing' });
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      await syncService.syncAll(user.id);

      set({
        status: 'success',
        lastSync: new Date().toISOString(),
        error: undefined,
      });
    } catch (error: any) {
      set({
        status: 'error',
        error: error.message,
      });
    }
  },

  syncRecipe: async (recipeId: string) => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Get recipe from local DB
      const { recipeRepository } = await import('@/db/recipeRepository');
      const recipe = await recipeRepository.getRecipeById(recipeId);
      if (!recipe) return;

      await syncService.syncRecipe(recipe);
    } catch (error: any) {
      console.error('Failed to sync recipe:', error);
      throw error;
    }
  },
}));

