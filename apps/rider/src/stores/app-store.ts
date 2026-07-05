import { create } from 'zustand';
import type { Language } from '../types';
import { getLanguage, setLanguage, getThemeMode, setThemeMode, getWalletBalance, setWalletBalance } from '../services/storage-service';

interface AppState {
  language: Language;
  themeMode: 'light' | 'dark';
  walletBalance: number;
  hasNotifications: boolean;
  notificationCount: number;

  loadPreferences: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setThemeMode: (mode: 'light' | 'dark') => Promise<void>;
  setWalletBalance: (balance: number) => Promise<void>;
  setHasNotifications: (has: boolean) => void;
  setNotificationCount: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  themeMode: 'light',
  walletBalance: 0,
  hasNotifications: false,
  notificationCount: 0,

  loadPreferences: async () => {
    const [lang, theme, balance] = await Promise.all([
      getLanguage(),
      getThemeMode(),
      getWalletBalance(),
    ]);
    set({ language: lang, themeMode: theme, walletBalance: balance });
  },

  setLanguage: async (lang) => {
    await setLanguage(lang);
    set({ language: lang });
  },

  setThemeMode: async (mode) => {
    await setThemeMode(mode);
    set({ themeMode: mode });
  },

  setWalletBalance: async (balance) => {
    await setWalletBalance(balance);
    set({ walletBalance: balance });
  },

  setHasNotifications: (has) => set({ hasNotifications: has }),
  setNotificationCount: (count) => set({ notificationCount: count }),
}));
