import { create } from 'zustand';
import { supabase, UserProfile, UserRole } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  checkPermission: (action: 'create' | 'delete' | 'download' | 'view') => boolean;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

// Module-level guards — must live outside the store so they survive across
// multiple calls to initialize() (which happens when ProtectedRoute remounts).
let listenerRegistered = false;
let signInInProgress = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,

  // Called ONCE at app startup from App.tsx.
  // Reads the persisted session and wires up the auth change listener.
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
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

      // Register the Supabase auth listener exactly once for the lifetime of
      // the app.  Multiple registrations accumulate and cause race conditions.
      if (!listenerRegistered) {
        listenerRegistered = true;

        supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT') {
            // Skip stale SIGNED_OUT events that arrive after a fresh signIn().
            // This happens when the user logs out and immediately logs back in:
            // the async signOut() network call resolves AFTER signInWithPassword()
            // has already succeeded, firing a SIGNED_OUT that would kill the new
            // session.
            if (signInInProgress) return;

            set({ user: null, userProfile: null, isAuthenticated: false });
          }

          if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Keep the stored User object in sync when Supabase rotates the JWT.
            set({ user: session.user });
          }
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    signInInProgress = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
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
    } finally {
      // Always clear the flag so a late SIGNED_OUT (from a concurrent signOut
      // network call) is processed correctly from now on.
      signInInProgress = false;
    }
  },

  // Clear local state immediately (optimistic) so the UI reacts instantly,
  // then invalidate the session on the server.
  signOut: async () => {
    set({ user: null, userProfile: null, isAuthenticated: false });
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase signOut request failed (local state already cleared):', error);
    }
  },

  checkPermission: (action: 'create' | 'delete' | 'download' | 'view') => {
    const { userProfile } = get();
    if (!userProfile) return false;
    if (userProfile.role === 'super_admin') return true;
    if (userProfile.role === 'visitor') return action === 'view' || action === 'download';
    return false;
  },

  changePassword: async (newPassword: string) => {
    const { user, userProfile } = get();
    if (!user || !userProfile) return { success: false, error: 'Usuário não autenticado' };

    try {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) return { success: false, error: authError.message };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      if (profileError) return { success: false, error: profileError.message };

      set({ userProfile: { ...userProfile, must_change_password: false } });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Ocorreu um erro' };
    }
  },
}));
