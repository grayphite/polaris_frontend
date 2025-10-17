import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { showErrorToast } from '../utils/toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://11.1.1.182:5000/api';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    const status = error?.response?.status;
      // Check if user is currently on an auth page
      const isOnAuthPage = window.location.pathname == '/login' ||
                           window.location.pathname == '/register' ||
                           window.location.pathname == '/forgot-password' ||
                           window.location.pathname == '/reset-password';

      if (status === 401 && !isOnAuthPage) {
        // Clear auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        showErrorToast('Session expired, please login again.');
        return;
      }
    
    // Log error for debugging
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

/**
 * Base API function for common HTTP operations
 * All other services can use this function for making requests
 */
export async function makeRequest<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Export the axios instance for direct use if needed
export { apiClient };