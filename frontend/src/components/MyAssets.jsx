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
    <div className="my-assets-container mt-4 flex-1 overflow-y-auto bg-slate-950 px-4 py-6 md:px-8">
      <div className="assets-header mb-6">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">My Assets</h1>
        <p className="text-sm text-slate-400">Server and Infrastructure Overview</p>
      </div>

      <div className="assets-table-wrapper overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-xl">
        <table className="assets-table w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Server Name
              </th>
              <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Type
              </th>
              <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                IP Address
              </th>
              <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className="asset-row border-b border-slate-900/80 transition-colors hover:bg-sky-500/5"
              >
                <td className="asset-name px-4 py-3 text-sm font-medium text-slate-50">
                  {asset.name}
                </td>
                <td className="asset-type px-4 py-3 text-sm text-slate-300">
                  {asset.type}
                </td>
                <td className="asset-ip px-4 py-3 text-xs font-mono text-sky-400">
                  {asset.ip}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`status-badge inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold capitalize ${
                      asset.status === 'active'
                        ? 'status-active border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'status-inactive border-l-4 border-slate-500 bg-slate-500/10 text-slate-300'
                    }`}
                  >
                    {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
