import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function developmentHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;

  try {
    return new URL(`http://${hostUri}`).hostname;
  } catch {
    return hostUri.split(':')[0] || null;
  }
}

function resolveApiBaseUrl(): string {
  const sharedConfigured =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '') || '/api';

  if (Platform.OS === 'web') return sharedConfigured;

  const nativeConfigured = process.env.EXPO_PUBLIC_NATIVE_API_BASE_URL
    ?.trim()
    .replace(/\/$/, '');
  if (nativeConfigured) return nativeConfigured;

  if (sharedConfigured.startsWith('/')) {
    const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.toLowerCase();
    if (appEnvironment === 'dev') {
      return `https://dev.zincycorp.in${sharedConfigured}`;
    }
    if (appEnvironment === 'prod' || appEnvironment === 'production') {
      return `https://zincycorp.in${sharedConfigured}`;
    }

    const host = developmentHost();
    if (host) return `http://${host}:8083${sharedConfigured}`;
  }

  // A physical phone resolves localhost to itself. During a Metro-backed
  // development build, replace localhost with the computer running Metro.
  // The port and path remain exactly as configured in .env.local.
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(sharedConfigured)) {
    const host = developmentHost();
    if (host) {
      return sharedConfigured.replace(
        /^((?:https?):\/\/)(localhost|127\.0\.0\.1)/i,
        `$1${host}`
      );
    }
  }

  return sharedConfigured;
}

export const API_BASE_URL = resolveApiBaseUrl();

const isDevelopment = process.env.NODE_ENV !== 'production';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (request) => {
    if (Platform.OS !== 'web') {
      request.headers['X-Zincy-Client'] = 'native';
    }

    if (isDevelopment) {
      console.log(
        `API REQUEST: ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`
      );
    }

    return request;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isDevelopment) {
      console.log(
        'API FAILED URL:',
        `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`
      );

      console.log('API ERROR:', error.message);

      if (error.response) {
        console.log('STATUS:', error.response.status);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
