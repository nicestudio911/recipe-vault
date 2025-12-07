import axios, { AxiosInstance, AxiosError } from 'axios';
import { Recipe, RecipeCreate, RecipeUpdate, OCRResult, URLParseResult } from '@/types';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// For mobile devices, use your computer's IP address instead of localhost
// You can find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
// Example: 'http://192.168.1.100:8000'
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  
  // On web, localhost works fine
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  
  // On mobile, localhost won't work - you need to use your computer's IP
  // This is a fallback - you should set EXPO_PUBLIC_API_URL in your .env file
  console.warn('⚠️ API URL not configured. Set EXPO_PUBLIC_API_URL in .env file with your computer\'s IP address (e.g., http://192.168.1.100:8000)');
  return 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add auth token interceptor - get token from Supabase session
    this.client.interceptors.request.use(
      async (config) => {
        // Get current session token from Supabase
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
            // Also update the default header for consistency
            this.client.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          } else {
            // If no session, check if we have a token in defaults
            if (this.client.defaults.headers.common['Authorization']) {
              config.headers.Authorization = this.client.defaults.headers.common['Authorization'] as string;
            }
          }
        } catch (error) {
          // If getting session fails, use existing token if available
          if (this.client.defaults.headers.common['Authorization']) {
            config.headers.Authorization = this.client.defaults.headers.common['Authorization'] as string;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add error interceptor for better error messages and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized - token might be expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the session (Supabase handles refresh automatically)
            const { data: { session }, error: refreshError } = await supabase.auth.getSession();
            
            if (session?.access_token && !refreshError) {
              // Update the token in the API client
              this.setAuthToken(session.access_token);
              
              // Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
              return this.client(originalRequest);
            } else {
              // Refresh failed - user needs to sign in again
              // Clear auth and let the auth guard handle redirect
              await supabase.auth.signOut();
              throw new Error('Session expired. Please sign in again.');
            }
          } catch (refreshErr) {
            // If refresh fails, sign out and throw error
            await supabase.auth.signOut();
            throw new Error('Session expired. Please sign in again.');
          }
        }

        // Transform other errors into user-friendly messages
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          throw new Error(
            `Cannot connect to server. Please check:\n` +
            `1. Backend server is running on ${API_BASE_URL}\n` +
            `2. If using mobile device, set EXPO_PUBLIC_API_URL in .env to your computer's IP address\n` +
            `3. Both devices are on the same network`
          );
        }
        if (error.response) {
          // Server responded with error status
          let message = 'Server error';
          
          // Try to extract error message from response
          const responseData = error.response.data;
          if (responseData) {
            if (typeof responseData === 'string') {
              message = responseData;
            } else if (responseData.detail) {
              message = typeof responseData.detail === 'string' 
                ? responseData.detail 
                : JSON.stringify(responseData.detail);
            } else if (responseData.message) {
              message = typeof responseData.message === 'string'
                ? responseData.message
                : JSON.stringify(responseData.message);
            } else if (responseData.error) {
              message = typeof responseData.error === 'string'
                ? responseData.error
                : JSON.stringify(responseData.error);
            } else {
              // If it's an object, stringify it
              message = JSON.stringify(responseData);
            }
          } else if (error.response.statusText) {
            message = error.response.statusText;
          }
          
          throw new Error(message);
        }
        if (error.request) {
          // Request made but no response
          throw new Error('No response from server. Please check your connection.');
        }
        throw error;
      }
    );
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    const response = await this.client.get('/recipes/');
    return response.data;
  }

  async getRecipe(id: string): Promise<Recipe> {
    const response = await this.client.get(`/recipes/${id}`);
    return response.data;
  }

  async createRecipe(recipe: RecipeCreate): Promise<Recipe> {
    const response = await this.client.post('/recipes/', recipe);
    return response.data;
  }

  async updateRecipe(id: string, recipe: RecipeUpdate): Promise<Recipe> {
    const response = await this.client.put(`/recipes/${id}`, recipe);
    return response.data;
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.client.delete(`/recipes/${id}`);
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const response = await this.client.get('/recipes/search', {
      params: { q: query },
    });
    return response.data;
  }

  // OCR
  async ocrImage(imageUri: string, method?: 'hybrid' | 'vision' | 'tesseract'): Promise<OCRResult> {
    try {
      const formData = new FormData();
      
      // Extract filename from URI or use default
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // For React Native, FormData needs specific format
      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type: type,
        name: filename,
      } as any);

      const params: any = {};
      if (method) {
        params.method = method;
      }

      const response = await this.client.post('/ocr/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params,
        timeout: 60000, // 60 seconds for image processing
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.detail || 'Failed to process image');
      }
      throw error;
    }
  }

  // URL Parser
  async parseRecipeUrl(url: string): Promise<URLParseResult> {
    const response = await this.client.post('/parse-url/', { url });
    return response.data;
  }
}

export const apiClient = new ApiClient();

