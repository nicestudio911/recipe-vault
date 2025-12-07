import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { URLParseResult } from '@/types';

export const useURLParser = () => {
  return useMutation({
    mutationFn: async (url: string): Promise<URLParseResult> => {
      return await apiClient.parseRecipeUrl(url);
    },
  });
};

