import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import AlertsDashboard from './components/AlertsDashboard';
import Dashboard from './components/Dashboard';
import ServiceRequests from './components/ServiceRequests';
import ForensicAnalysis from './components/ForensicAnalysis';
import MyAssets from './components/MyAssets';
import Analyze from './pages/Analyze';
// theme.css removed in favor of 60-30-10 variables in index.css

// Main dashboard layout (auth-free as per request)
const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="app-container flex h-screen bg-main overflow-hidden">
      <Sidebar
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div
        className={`main-content flex flex-1 flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'md:ml-24'}`}
      >
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
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />} />
          <Route path="/analyze/:id" element={<Analyze />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
