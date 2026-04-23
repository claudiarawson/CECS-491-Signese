import { create } from 'zustand';
import { AuthService } from '../features/auth/services';
import { AuthState, SignInCredentials, SignUpCredentials } from '../features/auth/types';

interface AuthStore extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  signIn: async (credentials: SignInCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.signIn(credentials);
      if (response.success && response.user) {
        set({ user: response.user, isLoading: false });
      } else {
        set({ error: response.error || 'Sign in failed', isLoading: false });
      }
    } catch (_error) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  signUp: async (credentials: SignUpCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.signUp(credentials);
      if (response.success && response.user) {
        set({ user: response.user, isLoading: false });
      } else {
        set({ error: response.error || 'Sign up failed', isLoading: false });
      }
    } catch (_error) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.signInWithGoogle(idToken);
      if (response.success && response.user) {
        set({ user: response.user, isLoading: false });
      } else {
        set({ error: response.error || 'Google sign in failed', isLoading: false });
      }
    } catch (_error) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.signOutUser();
      if (response.success) {
        set({ user: null, isLoading: false });
      } else {
        set({ error: response.error || 'Sign out failed', isLoading: false });
      }
    } catch (_error) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.resetPassword(email);
      if (response.success) {
        set({ isLoading: false });
      } else {
        set({ error: response.error || 'Password reset failed', isLoading: false });
      }
    } catch (_error) {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  initializeAuth: () => {
    set({ isLoading: true });
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      set({ user, isLoading: false });
    });
    return unsubscribe;
  },
}));
