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

/**
 * Stream API function for Server-Sent Events (SSE) streaming
 * Uses fetch API for proper SSE support while maintaining consistency with makeRequest
 */
export async function makeStreamRequest<T>(
  endpoint: string,
  data: any,
  onStreamChunk?: (chunk: any) => void
): Promise<T> {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });
    
    // Handle 401 errors consistently with axios interceptor
    if (response.status === 401) {
      const isOnAuthPage = window.location.pathname === '/login' ||
                           window.location.pathname === '/register' ||
                           window.location.pathname === '/forgot-password' ||
                           window.location.pathname === '/reset-password';
      
      if (!isOnAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        showErrorToast('Session expired, please login again.');
      }
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }
    
    let buffer = '';
    let result: T | null = null;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);
              
              // Call the chunk handler if provided
              if (onStreamChunk) {
                onStreamChunk(data);
              }
              
              // Store the final result (implementation can customize this)
              result = data as T;
            } catch (e) {
              console.error('Failed to parse SSE data:', e, line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (!result) {
      throw new Error('Stream completed without receiving data');
    }
    
    return result;
  } catch (error) {
    console.error('Stream API request failed:', error);
    throw error;
  }
}

// Export the axios instance for direct use if needed
export { apiClient };