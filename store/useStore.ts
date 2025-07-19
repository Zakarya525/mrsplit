import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  selectedGroupId: string | null;
  theme: 'light' | 'dark' | 'auto';
  setUser: (user: User | null) => void;
  setSelectedGroupId: (groupId: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  selectedGroupId: null,
  theme: 'auto',
  setUser: (user) => set({ user }),
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),
  setTheme: (theme) => set({ theme }),
}));