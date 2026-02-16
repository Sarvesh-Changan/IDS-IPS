import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AlertsDashboard from './components/AlertsDashboard';
import Dashboard from './components/Dashboard';
import ServiceRequests from './components/ServiceRequests';
import ForensicAnalysis from './components/ForensicAnalysis';
import MyAssets from './components/MyAssets';
import Login from './pages/Login';
import Analyze from './pages/Analyze';
import AdminRegisterAnalyst from './pages/AdminRegisterAnalyst';
import './theme.css';

// Main dashboard layout (used for authenticated routes except Analyze)
const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  const { user } = useAuth();

  // Theme initialization (from original App)
  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    document.body.className = `${savedTheme}-mode`;

    const handleStorageChange = (e) => {
      if (e.key === 'appTheme' || e.key === 'themeChangeTimestamp') {
        const newTheme = localStorage.getItem('appTheme') || 'dark';
        document.body.className = `${newTheme}-mode`;
      }
    };

    const handlePostMessage = (e) => {
      if (e.data && e.data.type === 'THEME_CHANGED') {
        const newTheme = e.data.theme || 'dark';
        document.body.className = `${newTheme}-mode`;
        localStorage.setItem('appTheme', newTheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handlePostMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handlePostMessage);
    };
  }, []);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-container flex h-screen bg-slate-950">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      <div className="main-content ml-[280px] flex flex-1 flex-col overflow-hidden transition-[margin-left] duration-300 md:ml-[280px]">
        {activeTab === 'alerts' && <AlertsDashboard />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'requests' && <ServiceRequests />}
        {activeTab === 'forensic' && <ForensicAnalysis />}
        {activeTab === 'assets' && <MyAssets />}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardLayout />} />
          <Route path="/analyze/:id" element={<Analyze />} />
          <Route path="/admin/register-analyst" element={<AdminRegisterAnalyst />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
