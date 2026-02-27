import React from 'react';

export default function MyAssets() {
  const assets = [
    {
      id: 1,
      name: 'SPIT On Premise Server',
      ip: '192.168.1.10',
      status: 'active',
      type: 'On Premise'
    },
    {
      id: 2,
      name: 'SPIT Cloud Server',
      ip: '10.0.1.50',
      status: 'active',
      type: 'Cloud'
    }
  ];

  return (
    <div className="my-assets-container mt-4 flex-1 overflow-y-auto bg-main px-4 py-6 md:px-8 transition-colors duration-300">
      <div className="assets-header mb-8">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-accent-primary">Infrastructure Assets</h1>
        <p className="text-sm text-muted font-medium">Coordinate Intelligence and Node Deployment Status</p>
      </div>

      <div className="assets-table-wrapper overflow-hidden rounded-[2.5rem] border border-theme bg-card shadow-2xl">
        <div className="overflow-x-auto">
          <table className="assets-table w-full border-collapse text-sm">
            <thead>
              <tr className="bg-sidebar/50 border-b border-theme/50">
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Node Identity
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Deployment
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Network IP
                </th>
                <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  System Health
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="asset-row border-b border-theme/30 transition-all hover:bg-hover active:bg-hover/80"
                >
                  <td className="px-6 py-5 text-sm font-bold text-main">
                    {asset.name}
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-muted">
                    <span className="px-2.5 py-1 rounded-lg bg-sidebar border border-theme/50 text-[10px] font-black uppercase tracking-wider">
                      {asset.type}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs font-mono font-black text-accent-info">
                    {asset.ip}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`status-badge inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-sm ${asset.status === 'active'
                          ? 'bg-accent-success/10 text-accent-success border border-accent-success/30 shadow-accent-success/5'
                          : 'bg-muted/10 text-muted border border-muted/30'
                        }`}
                    >
                      <span className={`h-2 w-2 rounded-full animate-pulse ${asset.status === 'active' ? 'bg-accent-success' : 'bg-muted'}`}></span>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
