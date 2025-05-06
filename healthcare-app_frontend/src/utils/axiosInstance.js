import axios from 'axios';

// Set the base API URL with fallback options
const getApiBaseUrl = () => {
  // Fallback URLs
  const possibleUrls = [
    'http://localhost:8000/api',
    'http://127.0.0.1:8000/api',
    window.location.origin + '/api',
  ];

  // Disabled localStorage override for stability
  return possibleUrls[0]; // Always use localhost:8000
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => Promise.reject(error)
);

// Add response interceptor for retries and error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired — try refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${getApiBaseUrl()}/token/refresh/`, {
          refresh: refreshToken,
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

    // Retry on timeout
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.warn('Request timed out. Retrying...');
      return axiosInstance(originalRequest);
    }

    // Handle network errors with alternative base URLs
    if (error.message === 'Network Error' && !originalRequest._urlRetry) {
      originalRequest._urlRetry = true;

      const possibleUrls = [
        'http://localhost:8000/api',
        'http://127.0.0.1:8000/api',
        window.location.origin + '/api',
      ];

      const currentUrl = axiosInstance.defaults.baseURL;
      const currentIndex = possibleUrls.indexOf(currentUrl);
      const nextUrl = possibleUrls[(currentIndex + 1) % possibleUrls.length];

      axiosInstance.defaults.baseURL = nextUrl;
      originalRequest.baseURL = nextUrl;
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;