import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  access_token: string;
  github_username: string;
  email?: string;
  full_name?: string;
  category: string;
  points: number;
  pr_count: number;
  issues_solved: number;
}

export interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    },
  ),
);
