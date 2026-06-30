import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: 'rider' | 'driver' | 'admin';
  preferredLanguage: string;
}

const TOKEN_KEY = 'namma_driver_auth_token';
const USER_KEY = 'namma_driver_auth_user';

export async function storeAuthSession(token: string, user: StoredUser): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    ]);
  } catch (err) {
    console.error('[Storage storeAuthSession Exception]:', err);
  }
}

export async function retrieveAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('[Storage retrieveAuthToken Exception]:', err);
    return null;
  }
}

export async function retrieveStoredUser(): Promise<StoredUser | null> {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? (JSON.parse(userStr) as StoredUser) : null;
  } catch (err) {
    console.error('[Storage retrieveStoredUser Exception]:', err);
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY)
    ]);
  } catch (err) {
    console.error('[Storage clearAuthSession Exception]:', err);
  }
}
