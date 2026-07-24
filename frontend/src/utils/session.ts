import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

    console.log('Session saved successfully:', finalUser);

    return finalUser;
  } catch (error) {
    console.log('Session save error:', error);
    return null;
  }
};

export const getSession = async () => {
  try {
    let value: string | null = null;

    if (Platform.OS === 'web') {
      value = localStorage.getItem(SESSION_KEY);
    } else {
      value = await SecureStore.getItemAsync(SESSION_KEY);
    }

    if (!value) return null;

    return JSON.parse(value);
  } catch (error) {
    console.log('Session get error:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }

    console.log('Session cleared successfully');
  } catch (error) {
    console.log('Session clear error:', error);
  }
};

export const updateSessionUser = async (updatedUser: any) => {
  await saveSession(updatedUser);
};

export const removeSession = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (error) {
    console.log('Session remove error:', error);
  }
};