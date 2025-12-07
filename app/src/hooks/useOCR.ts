import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { OCRResult } from '@/types';

export const useOCR = () => {
  return useMutation({
    mutationFn: async ({ 
      imageUri, 
      method = 'vision' // Default to OpenAI Vision
    }: { 
      imageUri: string; 
      method?: 'hybrid' | 'vision' | 'tesseract' 
    }): Promise<OCRResult> => {
      return await apiClient.ocrImage(imageUri, method);
    },
  });
};

