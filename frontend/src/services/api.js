import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  const csrf = localStorage.getItem('csrfToken');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  if (csrf) req.headers['x-csrf-token'] = csrf;
  return req;
});

export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const getMe = () => API.get('/auth/me');

export const fetchAttacks = (page = 1, limit = 10, filters = {}) => 
  API.get('/attacks', { params: { page, limit, ...filters } });
export const fetchAttackById = (id) => API.get(`/attacks/${id}`);
export const updateAttack = (id, data) => API.patch(`/attacks/${id}`, data);
export const takeAction = (id, action) => API.post(`/attacks/${id}/action`, { action });
