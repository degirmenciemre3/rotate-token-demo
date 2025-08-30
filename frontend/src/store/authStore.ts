import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import type { AuthState, AuthActions, LoginRequest, RegisterRequest, User, TokenPair } from '../types';

interface AuthStore extends AuthState, AuthActions {}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      // Eğer tokenRevoked eventi tetiklenirse otomatik logout yap
      // Bu event backend tarafından token iptal edildiğinde tetiklenir
      // Örneğin, refresh token kullanıldığında ve eski token iptal edildiğinde
      _init: (() => {
        if (typeof window !== 'undefined') {
          window.addEventListener('tokenRevoked', (event: any) => {
            console.warn('🚨 Token family revoked! Force logout...', event.detail);
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Token revoked for security reasons',
            });
            toast.error('🚨 Token güvenlik ihlali tespit edildi! Oturum sonlandırıldı.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          });
        }
      })(),

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const tokens = await api.login(credentials);
          const user = extractUserFromToken(tokens.access_token);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success('Login successful!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            tokens: null,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.register(userData);
          
          set({ isLoading: false, error: null });
          toast.success('Registration successful! Please log in.');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
          set({
            error: errorMessage,
            isLoading: false,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await api.logout();
        } catch (error) {
          console.warn('Logout request failed:', error);
        } finally {
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          toast.success('Logged out successfully');
        }
      },

      refreshToken: async () => {
        const { tokens } = get();
        if (!tokens?.refresh_token) {
          throw new Error('No refresh token available');
        }

        try {
          const newTokens = await api.manualRefresh();
          const user = extractUserFromToken(newTokens.access_token);
          
          set({
            user,
            tokens: newTokens,
            isAuthenticated: true,
            error: null,
          });

          toast.success('Token refreshed successfully!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Token refresh failed';
          set({
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            tokens: null,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens?.access_token) {
          try {
            const isExpired = api.isTokenExpired(state.tokens.access_token);
            if (isExpired) {
              state.user = null;
              state.tokens = null;
              state.isAuthenticated = false;
            }
          } catch {
            state.user = null;
            state.tokens = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);

// Helper function to extract user data from JWT token
function extractUserFromToken(token: string): User {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.user_id,
      username: decoded.username,
      email: decoded.email,
      created_at: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

// Utility hooks for easier access to auth state
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    tokens: store.tokens,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
  };
};

export const useAuthActions = () => {
  const store = useAuthStore();
  return {
    login: store.login,
    register: store.register,
    logout: store.logout,
    refreshToken: store.refreshToken,
    clearError: store.clearError,
    setLoading: store.setLoading,
  };
};
