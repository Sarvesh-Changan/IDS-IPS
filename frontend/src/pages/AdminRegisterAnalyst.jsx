import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function AdminRegisterAnalyst() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'analyst', accessLevel: 'standard' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const API = axios.create({ baseURL: 'http://localhost:5000/api' });
      API.interceptors.request.use((req) => {
        const token = localStorage.getItem('token');
        const csrf = localStorage.getItem('csrfToken');
        if (token) req.headers.Authorization = `Bearer ${token}`;
        if (csrf) req.headers['x-csrf-token'] = csrf;
        return req;
      });
      const { data } = await API.post('/admin/users', form);
      setSuccess('Analyst account created');
      setForm({ username: '', email: '', password: '', role: 'analyst', accessLevel: 'standard' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create account';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-100">Register Analyst</h1>
        <p className="mb-4 text-sm text-slate-400">Create a new analyst account</p>
        {error && <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {success && <div className="mb-3 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs text-slate-400">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs text-slate-400">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
              minLength={8}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs text-slate-400">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
            >
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Access Level</label>
            <select
              name="accessLevel"
              value={form.accessLevel}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-sky-400"
            >
              <option value="read">Read</option>
              <option value="standard">Standard</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-sky-500 px-4 py-2 font-semibold text-slate-900 hover:brightness-95 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
