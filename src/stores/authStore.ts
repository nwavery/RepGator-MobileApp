import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { LoginResponse } from '../services/apiClient';
import { getUserProfile } from '../services/apiClient';

const TOKEN_STORAGE_KEY = 'repgator_auth_token';

type User = LoginResponse['user'];

type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'error' | 'success'; // Represents auth process status
  error: string | null;
  initializeAuth: () => Promise<void>; // Load token from storage on app start
  setAuthData: (token: string, userData: User) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUser: (updatedData: Partial<User>) => void;
  loading: boolean;
  setToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  status: 'idle', // Initial state
  error: null,
  loading: false,

  initializeAuth: async () => {
    if (get().status !== 'idle') return;

    set({ status: 'loading', error: null });
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (storedToken) {
        console.log('Token found in storage, attempting to validate...');
        set(state => ({ ...state, token: storedToken }));

        try {
          const userProfile = await getUserProfile();
          console.log('Token validated, user profile fetched:', userProfile);
          set({ token: storedToken, user: userProfile, isAuthenticated: true, status: 'success' });
        } catch (validationError: any) {
          console.error('Token validation/profile fetch failed:', validationError);
          await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
          set({ token: null, user: null, isAuthenticated: false, status: 'idle', error: 'Session expired. Please log in again.' });
        }
      } else {
        console.log('No token found in storage.');
        set({ token: null, user: null, isAuthenticated: false, status: 'idle' });
      }
    } catch (e) {
      console.error('Failed during auth initialization:', e);
      set({ token: null, user: null, isAuthenticated: false, status: 'error', error: 'Failed to initialize authentication.' });
    }
  },

  setAuthData: async (token: string, userData: User) => {
    set({ status: 'loading', error: null });
    try {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
      set({ token, user: userData, isAuthenticated: true, status: 'success' });
    } catch (e) {
      console.error('Failed to save token:', e);
      set({ status: 'error', error: 'Failed to save token.', token: null, user: null, isAuthenticated: false });
    }
  },

  clearAuth: async () => {
    set({ status: 'loading', error: null });
    try {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      set({ token: null, user: null, isAuthenticated: false, status: 'idle' });
    } catch (e) {
      console.error('Failed to delete token:', e);
      set({ status: 'error', error: 'Failed to clear authentication.' });
    }
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  updateUser: (updatedData: Partial<User>) => {
    console.log('[authStore] updateUser called with:', JSON.stringify(updatedData));
    set((state) => {
      if (!state.user && !updatedData) return state; // If no current user and no update data, do nothing
      
      // If there's no current user, the updatedData becomes the new user
      // Otherwise, merge updatedData into the existing user state
      const newUser = state.user ? { ...state.user, ...updatedData } : updatedData as User;
      
      console.log('[authStore] New user state will be:', JSON.stringify(newUser));
      return { ...state, user: newUser };
    });
  },

  setToken: (token) => {
    set((state) => {
      // When token is set (and not null), also update isAuthenticated.
      // If token is set to null, set isAuthenticated to false.
      const newIsAuthenticated = !!token; // true if token is truthy, false if null/undefined/''
      console.log(`AuthStore: setToken called. New token: ${token ? 'present' : 'null'}. Setting isAuthenticated: ${newIsAuthenticated}`);

      // If logging out (token is null), also clear user data.
      const newUser = token ? state.user : null;
      const newStatus = token ? state.status : 'idle';

      return {
        ...state,
        token,
        isAuthenticated: newIsAuthenticated,
        user: newUser,
        status: newStatus, // Reset status to idle on logout
      };
    });
  },
}));

// Initial call to initializeAuth should be placed strategically in the app root (e.g., App.tsx)
// useAuthStore.getState().initializeAuth(); // Example 