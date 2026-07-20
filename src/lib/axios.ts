import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get base URL from env or fallback
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests (important for HTTP-only tokens)
  withCredentials: true,
  // Automatically extract 'csrftoken' cookie and attach to 'X-CSRFToken' header
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Request Interceptor: Attach Tokens if necessary
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Note: If using HTTP-only cookies, you don't need to manually attach the token.
    // If you are using localStorage for tokens, you would attach it here:
    // const token = localStorage.getItem('access_token');
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// State for managing concurrent refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Global Errors (like 401s)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized and we haven't already retried the request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request until it finishes
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        // Attempt to hit the refresh token endpoint
        await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );

        // Process all queued requests so they retry with the new token
        processQueue(null);

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Process queue with the error so queued requests fail gracefully
        processQueue(refreshError as AxiosError, null);
        
        // If refresh fails, log the user out
        console.error('Session expired. Please log in again.');
        
        // In a real app, you might trigger a Zustand action here or redirect
        // useAuthStore.getState().logout();
        // window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
