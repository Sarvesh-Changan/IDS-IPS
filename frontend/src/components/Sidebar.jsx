import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEME_COLORS } from '../themeConfig';

export default function Sidebar({ setActiveTab, activeTab, isOpen, setIsOpen }) {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { label: 'Alert Center', id: 'alerts', icon: '🚨' },
    { label: 'System Intel', id: 'dashboard', icon: '📊' },
    { label: 'Ops Protocols', id: 'requests', icon: '⚡' },
    { label: 'Node Assets', id: 'assets', icon: '🖥️' },
    { label: 'Deep Forensic', id: 'forensic', icon: '🔍' }
  ];

  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-theme bg-sidebar shadow-2xl transition-all duration-500 ease-in-out ${isOpen ? 'w-72' : 'w-24'
        }`}
    >
      <div className="sidebar-header relative flex items-center justify-between gap-3 border-b border-theme px-5 py-8">
        <div className={`logo flex items-center gap-4 transition-all duration-300 ${!isOpen && 'scale-0'}`}>
          <div className="logo-icon flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-primary text-[10px] font-black tracking-tighter text-inverse shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-pulse">
            SOC
          </div>
          <div className="logo-text flex flex-col overflow-hidden">
            <div className="brand-line text-lg font-black uppercase tracking-tight text-accent-primary leading-none">
              CyberSecure
            </div>
            <div className="brand-sub text-[9px] font-black uppercase tracking-widest text-muted mt-1 whitespace-nowrap">
              ML-IDS V2.0
            </div>
          </div>
        </div>
        <button
          className={`sidebar-inline-toggle absolute -right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-theme bg-card text-accent-primary shadow-xl transition-all hover:scale-110 active:scale-95 z-10 ${!isOpen && 'right-8'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto py-12 px-3 custom-scrollbar">
        <ul className="nav-list flex flex-col gap-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`nav-link group relative flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${activeTab === item.id
                  ? 'bg-accent-primary text-inverse shadow-xl shadow-accent-primary/20 translate-x-1'
                  : 'text-muted hover:bg-hover hover:text-main'
                  }`}
              >
                <span className={`text-lg transition-transform duration-300 group-hover:scale-125 ${activeTab === item.id ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className={`nav-label text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${!isOpen ? 'opacity-0 scale-0 w-0' : 'opacity-100 scale-100'}`}>
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full bg-white shadow-lg"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer flex flex-col gap-3 border-t border-theme p-5">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn flex w-full items-center justify-center gap-3 rounded-2xl border border-theme bg-card px-4 py-4 text-[10px] font-black uppercase tracking-widest text-main transition-all hover:bg-hover hover:border-accent-primary group shadow-inner"
        >
          <span className="group-hover:rotate-45 transition-transform duration-500">
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          <span className={`${!isOpen && 'hidden'}`}>
            Shift Protocol
          </span>
        </button>
        <button
          className="admin-btn flex w-full items-center justify-center gap-3 rounded-2xl bg-sidebar border border-theme hover:border-accent-primary px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:text-accent-primary shadow-sm"
          onClick={() => alert('Secure Ops Console Access restricted.')}
        >
          <span>㊙️</span>
          <span className={`${!isOpen && 'hidden'}`}>Admin Ops</span>
        </button>
      </div>
    </aside>
  );
}
