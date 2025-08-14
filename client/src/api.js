import axios from 'axios';

// Create an axios instance with default config
// In production (Netlify), use same-origin so Netlify redirects can proxy /api to backend
// In development, default to local backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL !== undefined
    ? process.env.REACT_APP_API_URL
    : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3010'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
