import { create } from 'zustand';
import { supabase, UserProfile, UserRole } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkPermission: (action: 'create' | 'delete' | 'download' | 'view') => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize auth state and listen for changes
  initialize: async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile with role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: session.user,
          userProfile: profile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({
            user: session.user,
            userProfile: profile,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            userProfile: null,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          return { success: false, error: 'Failed to fetch user profile' };
        }

        set({
          user: data.user,
          userProfile: profile,
          isAuthenticated: true,
        });

        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred' };
    }
  },

  // Sign out
  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      userProfile: null,
      isAuthenticated: false,
    });
  },

  // Check if user has permission for an action
  checkPermission: (action: 'create' | 'delete' | 'download' | 'view') => {
    const { userProfile } = get();
    
    if (!userProfile) return false;

    // Super admin can do everything
    if (userProfile.role === 'super_admin') {
      return true;
    }

    // Visitor can only view and download
    if (userProfile.role === 'visitor') {
      return action === 'view' || action === 'download';
    }

    return false;
  },
}));

