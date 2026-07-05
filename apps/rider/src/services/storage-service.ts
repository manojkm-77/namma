import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LANGUAGE: 'namma_rider_language',
  WALLET_BALANCE: 'namma_wallet_balance',
  ONBOARDING_DONE: 'namma_onboarding_done',
  THEME_MODE: 'namma_theme_mode',
} as const;

export async function getLanguage(): Promise<'en' | 'kn'> {
  try {
    const val = await AsyncStorage.getItem(KEYS.LANGUAGE);
    if (val === 'kn' || val === 'en') return val;
    return 'en';
  } catch {
    return 'en';
  }
}

export async function setLanguage(lang: 'en' | 'kn'): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
  } catch {
    // silent
  }
}

export async function getWalletBalance(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEYS.WALLET_BALANCE);
    return val ? Number(val) : 0;
  } catch {
    return 0;
  }
}

export async function setWalletBalance(balance: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.WALLET_BALANCE, String(balance));
  } catch {
    // silent
  }
}

export async function getThemeMode(): Promise<'light' | 'dark'> {
  try {
    const val = await AsyncStorage.getItem(KEYS.THEME_MODE);
    if (val === 'light' || val === 'dark') return val;
    return 'light';
  } catch {
    return 'light';
  }
}

export async function setThemeMode(mode: 'light' | 'dark'): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
  } catch {
    // silent
  }
}
