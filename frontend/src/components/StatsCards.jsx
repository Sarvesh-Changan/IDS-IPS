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
          className={`stat-card flex min-h-[4.5rem] flex-col justify-center rounded-lg border border-theme bg-card px-4 py-3 shadow-lg transition-transform hover:scale-[1.02] ${card.color === 'critical'
            ? 'border-l-4 border-l-accent-danger'
            : card.color === 'blocked'
              ? 'border-l-4 border-l-accent-success'
              : card.color === 'suspicious'
                ? 'border-l-4 border-l-accent-warning'
                : 'border-l-4 border-l-accent-primary'
            }`}
        >
          <div className="card-top flex items-center gap-3">
            <div
              className={`card-icon h-9 w-9 rounded-lg flex items-center justify-center ${card.color === 'critical' ? 'bg-accent-danger/10 text-accent-danger'
                : card.color === 'blocked' ? 'bg-accent-success/10 text-accent-success'
                  : card.color === 'suspicious' ? 'bg-accent-warning/10 text-accent-warning'
                    : 'bg-accent-primary/10 text-accent-primary'
                }`}
            >
              <div className="h-2 w-2 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
            </div>
            <div className="card-value text-xl font-bold text-main">
              {card.value}
            </div>
          </div>
          <div className="card-title mt-1 text-xs font-medium text-muted uppercase tracking-wider">
            {card.title}
          </div>
        </div>
      ))}
    </div>
  );
}
