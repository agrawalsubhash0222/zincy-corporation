import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import api from '@/services/api';

const SESSION_KEY = 'user';

export const saveSession = async (user: any) => {
  try {
    if (!user) {
      console.log('Session not saved: user is empty');
      return null;
    }

    const finalUser = {
      id: user.id ?? null,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      mobile: user.mobile ?? '',
      role: user.role ?? 'user',
    };

    const value = JSON.stringify(finalUser);

    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_KEY, value);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, value);
    }

    return finalUser;
  } catch (error) {
    console.log('Session save error:', error);
    return null;
  }
};

export const getSession = async () => {
  try {
    const response = await api.get('/auth/session');
    return await saveSession(response.data);
  } catch (error) {
    await clearLocalSession();
    return null;
  }
};

export const clearSession = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Always clear the local display cache, even if the session already expired.
  } finally {
    await clearLocalSession();
  }
};

export const updateSessionUser = async (updatedUser: any) => {
  await saveSession(updatedUser);
};

export const removeSession = async () => {
  await clearSession();
};

const clearLocalSession = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(SESSION_KEY);
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
};
