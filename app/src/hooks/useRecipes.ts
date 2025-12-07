import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Recipe, RecipeCreate, RecipeUpdate } from '@/types';
import { recipeRepository } from '@/db/recipeRepository';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';

export const useRecipes = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => {
      // On web, use API directly; on native, use local database
      if (Platform.OS === 'web') {
        return apiClient.getRecipes();
      }
      return recipeRepository.getAllRecipes(user?.id || '');
    },
    enabled: !!user,
  });
};

export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => {
      // On web, use API directly; on native, use local database
      if (Platform.OS === 'web') {
        return apiClient.getRecipe(id);
      }
      return recipeRepository.getRecipeById(id);
    },
  });
};

export const useSearchRecipes = (query: string) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['recipes', 'search', query, user?.id],
    queryFn: () => {
      // On web, use API directly; on native, use local database
      if (Platform.OS === 'web') {
        return apiClient.searchRecipes(query);
      }
      return recipeRepository.searchRecipes(query, user?.id || '');
    },
    enabled: !!user && query.length > 0,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { syncRecipe } = useSyncStore();

  return useMutation({
    mutationFn: async (recipe: Omit<RecipeCreate, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');

      // On web, use API directly; on native, use local database first
      if (Platform.OS === 'web') {
        const newRecipe = await apiClient.createRecipe({
          ...recipe,
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          tag_ids: recipe.tags?.map(t => t.id) || [],
        });
        return newRecipe;
      }

      const newRecipe = await recipeRepository.createRecipe({
        ...recipe,
        user_id: user.id,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        attachments: [],
      });

      // Sync in background
      syncRecipe(newRecipe.id).catch(console.error);

      return newRecipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();
  const { syncRecipe } = useSyncStore();

  return useMutation({
    mutationFn: async ({ id, ...recipe }: Partial<Recipe> & { id: string }) => {
      // On web, use API directly; on native, use local database first
      if (Platform.OS === 'web') {
        const updatedRecipe = await apiClient.updateRecipe(id, recipe);
        return updatedRecipe;
      }

      const updatedRecipe = await recipeRepository.updateRecipe(id, recipe);

      // Sync in background
      syncRecipe(id).catch(console.error);

      return updatedRecipe;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  const { syncRecipe } = useSyncStore();

  return useMutation({
    mutationFn: async (id: string) => {
      // On web, use API directly; on native, use local database first
      if (Platform.OS === 'web') {
        await apiClient.deleteRecipe(id);
        return;
      }

      await recipeRepository.deleteRecipe(id);
      // TODO: Delete from server if synced
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};

