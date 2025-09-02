// api.js (updated with CORS handling)
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://dashboard.arcapreit.com/back',
});

// Function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// Request interceptor → attach token before each request
api.interceptors.request.use(
  (config) => {
    const token = getCookie('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add CORS headers for development
    if (process.env.NODE_ENV === 'development') {
      config.headers['Access-Control-Allow-Origin'] = '*';
      config.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → refresh token if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized & not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from cookie
        const refreshToken = getCookie('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Request a new access token
        const { data } = await axios.post(
          `${api.defaults.baseURL}/admin/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        // Save new access token in cookie
        const maxAgeAccess = 86400; // 1 day
        document.cookie = `access_token=${data.access_token}; max-age=${maxAgeAccess}; path=/;`;

        // Update the Authorization header and retry
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;