import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authCodes = ['AUTH_MISSING', 'AUTH_EXPIRED', 'AUTH_INVALID'];
    
    if (
      error.response && 
      error.response.status === 401 && 
      authCodes.includes(error.response.data?.code)
    ) {
      console.warn("Token expired or invalid. Logging out...");
      localStorage.removeItem('auth_token');
      window.location.href = '/'; // Or whatever the login route is
    }
    return Promise.reject(error);
  }
);

export default api;
