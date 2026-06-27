import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiUrl } from '../config';

import { Platform } from 'react-native';

const TOKEN_KEY = 'cmms_jwt_token';
const SERVER_IP_KEY = 'cmms_server_ip';

export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token', error);
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save token', error);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to delete token', error);
  }
}

export async function getStoredServerIp(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(SERVER_IP_KEY);
    return await SecureStore.getItemAsync(SERVER_IP_KEY);
  } catch {
    return null;
  }
}

export async function storeServerIp(ip: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SERVER_IP_KEY, ip);
    } else {
      await SecureStore.setItemAsync(SERVER_IP_KEY, ip);
    }
  } catch {}
}

const api = axios.create({
  timeout: 10000,
});

// Configure baseURL dynamically on requests
api.interceptors.request.use(
  async (config) => {
    const customIp = await getStoredServerIp();
    config.baseURL = getApiUrl(customIp || undefined);
    console.log(`[API Request Interceptor] Sending to: ${config.baseURL}${config.url}`, config.data);

    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

export default api;
