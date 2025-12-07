import { useQuery } from '@tanstack/react-query';
import { recipeRepository } from '@/db/recipeRepository';
import { useAuthStore } from '@/store/authStore';

export const useOfflineRecipes = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['offline-recipes', user?.id],
    queryFn: () => recipeRepository.getAllRecipes(user?.id || ''),
    enabled: !!user,
    staleTime: Infinity, // Always use local data
  });
};

