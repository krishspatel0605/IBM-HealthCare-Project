import axios from 'axios';

// Set the base API URL with fallback options
const getApiBaseUrl = () => {
  const possibleUrls = [
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api',
    window.location.origin + '/api',
  ];
  
  const storedUrl = localStorage.getItem('api_base_url');
  if (storedUrl) {
    return storedUrl;
  }

  return possibleUrls[0];
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for retries and error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${getApiBaseUrl()}/token/refresh/`, {
          refresh: refreshToken
        });

        if (response.data.access) {
          localStorage.setItem('auth_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    // Handle timeouts with retries
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      // Exponential backoff: wait 2s before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Request timed out, retrying...');
      return axiosInstance(originalRequest);
    }

    // Handle network errors with alternative URLs
    if (error.message === 'Network Error' && !originalRequest._urlRetry) {
      originalRequest._urlRetry = true;
      const currentUrl = localStorage.getItem('api_base_url');
      const possibleUrls = [
        'http://localhost:8000/api',
        'http://127.0.0.1:8000/api',
        window.location.origin + '/api'
      ];
      
      const currentIndex = possibleUrls.indexOf(currentUrl);
      const nextUrl = possibleUrls[(currentIndex + 1) % possibleUrls.length];
      
      localStorage.setItem('api_base_url', nextUrl);
      originalRequest.baseURL = nextUrl;
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;