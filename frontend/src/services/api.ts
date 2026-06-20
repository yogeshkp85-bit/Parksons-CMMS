import axios from 'axios';

let inMemoryToken: string | null = null;
let refreshSubscribers: ((token: string) => void)[] = [];
let isRefreshing = false;

// Custom event to notify the AuthContext of a session expiration
export const AUTH_EVENTS = {
  SESSION_EXPIRED: 'cmms_session_expired',
  TOKEN_REFRESHED: 'cmms_token_refreshed'
};

const notifySessionExpired = () => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.SESSION_EXPIRED));
};

const notifyTokenRefreshed = (token: string) => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.TOKEN_REFRESHED, { detail: token }));
};

// Set and export the in-memory token
export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for HTTP-only cookie exchanges
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Silent Token Refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and it hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the request was to the refresh or login endpoint itself
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve) => {
          refreshSubscribers.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Request a new access token using the HttpOnly refresh token cookie
        const refreshResponse = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        
        const newToken = refreshResponse.data?.data?.token;
        if (!newToken) {
          throw new Error('No token returned in refresh response.');
        }

        setAccessToken(newToken);
        notifyTokenRefreshed(newToken);
        isRefreshing = false;

        // Re-execute all queued requests with the new token
        refreshSubscribers.forEach((callback) => callback(newToken));
        refreshSubscribers = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        setAccessToken(null);
        notifySessionExpired(); // Alert the app to log the user out
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
