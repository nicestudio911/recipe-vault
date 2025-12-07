import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { apiClient } from '@/services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: session.user, loading: false });
      apiClient.setAuthToken(session.access_token);
    } else {
      set({ user: null, loading: false });
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        set({ user: session.user });
        // Update API client token on any auth state change (including token refresh)
        apiClient.setAuthToken(session.access_token);
      } else {
        set({ user: null });
        apiClient.clearAuthToken();
      }
      
      // Log token refresh events for debugging
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.session) {
      set({ user: data.user });
      apiClient.setAuthToken(data.session.access_token);
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    if (data.session?.user) {
      set({ user: data.user });
      apiClient.setAuthToken(data.session.access_token);
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
    apiClient.clearAuthToken();
  },
}));

