import axios from 'axios';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '/api';

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
