import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/api';
import { authApi } from '@/lib/api';

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,

      login: async (initData: string) => {
        set({ isLoading: true });
        try {
          const res = await authApi.loginWithTelegram(initData);
          const { token, user } = res.data;
          localStorage.setItem('auth_token', token);
          set({ token, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ token: null, user: null });
      },

      isAdmin: () => get().user?.isAdmin === true,
    }),
    {
      name: 'snawi-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
