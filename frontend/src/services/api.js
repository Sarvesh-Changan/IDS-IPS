import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const csrf = localStorage.getItem('csrfToken');
  if (csrf) req.headers['x-csrf-token'] = csrf;
  return req;
});

// Auth functions removed as per request to remove login system
export const fetchAttacks = (page = 1, limit = 10, filters = {}) =>
  API.get('/attacks', { params: { page, limit, ...filters } });
export const fetchAttackById = (id) => API.get(`/attacks/${id}`);
export const updateAttack = (id, data) => API.patch(`/attacks/${id}`, data);
export const takeAction = (id, action) => API.post(`/attacks/${id}/action`, { action });
