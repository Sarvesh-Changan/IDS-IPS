import React, { useState } from 'react';

export default function Sidebar({ setActiveTab, activeTab }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { label: 'Alerts', id: 'alerts' },
    { label: 'Dashboard', id: 'dashboard' },
    { label: 'Service Requests', id: 'requests' },
    { label: 'My Assets', id: 'assets' },
    { label: 'Forensic Analysis', id: 'forensic' }
  ];

  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 shadow-2xl transition-all duration-300 ${
        isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'
      }`}
    >
      <div className="sidebar-header relative flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-6">
        <div className="logo flex items-center justify-center gap-3">
          <div className="logo-icon flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 text-xs font-bold text-slate-950 shadow-[0_0_18px_rgba(56,189,248,0.7)]">
            SOC
          </div>
          <div className="logo-text flex flex-col">
            <div className="brand-line text-sm font-bold tracking-tight text-sky-400">
              CyberSecure
            </div>
            <div className="brand-sub text-xs text-slate-400">
              ML Powered IDS and IPS
            </div>
          </div>
        </div>
        <button
          className="sidebar-inline-toggle flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 text-sky-400 shadow-sm transition-transform duration-150 hover:bg-slate-800 hover:shadow-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto py-10">
        <ul className="nav-list flex flex-col items-stretch gap-1 px-2">
          {menuItems.map((item) => (
            <li key={item.id} className="flex justify-center">
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`nav-link flex w-full items-center justify-center rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'active border-sky-500 bg-sky-500/15 text-sky-300'
                    : 'border-transparent text-slate-400 hover:border-sky-500 hover:bg-slate-800 hover:text-sky-200'
                }`}
              >
                <span className="nav-label truncate">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer flex items-center gap-2 border-t border-slate-800 px-3 py-4">
        <a
          className="feedback-btn flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-500 to-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg transition-transform duration-150 hover:-translate-y-0.5"
          href="/settings.html"
        >
          <span>Settings</span>
        </a>
      </div>
    </aside>
  );
}
