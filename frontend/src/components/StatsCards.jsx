import React from 'react';

export default function StatsCards() {
  const cards = [
    { id: 1, title: 'Total Intrusions', value: '532', color: 'critical' },
    { id: 2, title: 'Intrusions Blocked', value: '317', color: 'blocked' },
    { id: 3, title: 'Suspicious Activities', value: '115', color: 'suspicious' },
    { id: 4, title: 'Blockchain Ledger', value: '42', color: 'ledger' }
  ];

  return (
    <div className="stats-cards mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.id}
          className={`stat-card flex min-h-[4.5rem] flex-col justify-center rounded-lg border border-white/5 bg-gradient-to-b from-white/5 to-black/40 px-4 py-3 shadow-lg ${
            card.color === 'critical'
              ? 'border-l-4 border-l-red-400'
            : card.color === 'blocked'
              ? 'border-l-4 border-l-emerald-400'
            : card.color === 'suspicious'
              ? 'border-l-4 border-l-amber-400'
              : 'border-l-4 border-l-sky-400'
          }`}
        >
          <div className="card-top flex items-center gap-3">
            <div
              className="card-icon h-9 w-9 rounded-lg bg-white/10"
              aria-hidden
            >
              {/* Decorative */}
            </div>
            <div className="card-value text-xl font-bold text-slate-50">
              {card.value}
            </div>
          </div>
          <div className="card-title mt-1 text-xs font-medium text-slate-300">
            {card.title}
          </div>
        </div>
      ))}
    </div>
  );
}
