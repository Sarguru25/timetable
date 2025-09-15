import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) => {
  return api.post('/auth/login', { email, password })
    .then(response => response.data);
};

export const signup = (userData) => {
  return api.post('/auth/signup', userData)
    .then(response => response.data);
};

export const updateFirstLogin = (value) => {
  return api.post('/auth/first-login', { firstLogin: value })
    .then(response => response.data);
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");
  const response = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
};


export const logout = () => {
  return api.post('/auth/logout');
};

export default api;