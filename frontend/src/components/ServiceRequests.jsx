import React, { useState } from 'react';

export default function ServiceRequests() {
  const [ipAddress, setIpAddress] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const handleBlock = () => {
    if (!ipAddress.trim()) {
      setPopupMessage('Please enter an IP address');
      setShowPopup(true);
      return;
    }
    setPopupMessage(`IP ${ipAddress} has been blocked successfully`);
    setShowPopup(true);
    setIpAddress('');
  };

  const handleQuarantine = () => {
    if (!ipAddress.trim()) {
      setPopupMessage('Please enter an IP address');
      setShowPopup(true);
      return;
    }
    setPopupMessage(`IP ${ipAddress} has been quarantined successfully`);
    setShowPopup(true);
    setIpAddress('');
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleIpChange = (e) => {
    // Only allow numbers and dots
    const value = e.target.value;
    const filteredValue = value.replace(/[^0-9.]/g, '');
    setIpAddress(filteredValue);
  };

  return (
    <div className="service-requests-container mt-4 flex-1 overflow-y-auto bg-slate-950 px-4 py-6 md:px-8">
      <div className="sr-header mb-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Service Requests</h1>
        <p className="text-sm text-slate-400">Block or Quarantine IP Addresses</p>
      </div>

      <div className="sr-content mx-auto w-full max-w-xl rounded-lg border border-slate-800 bg-slate-950 px-6 py-8 shadow-xl">
        <div className="ip-input-section mb-8">
          <label
            htmlFor="ip-input"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Enter IP Address
          </label>
          <input
            id="ip-input"
            type="text"
            className="ip-input w-full rounded-lg border-2 border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:bg-slate-900 focus:shadow-[0_0_16px_rgba(56,189,248,0.35)]"
            placeholder="e.g. 192.168.1.1"
            value={ipAddress}
            onChange={handleIpChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleBlock();
              }
            }}
          />
        </div>

        <div className="button-group flex justify-center gap-4 max-md:flex-col">
          <button
            className="btn btn-block flex-1 rounded-lg bg-gradient-to-r from-red-400 to-red-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-red-500/40"
            onClick={handleBlock}
          >
            🚫 Block
          </button>
          <button
            className="btn btn-quarantine flex-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-500/40"
            onClick={handleQuarantine}
          >
            ⛔ Quarantine
          </button>
        </div>
      </div>

      {showPopup && (
        <div
          className="popup-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="popup-box w-[90%] max-w-md rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 px-8 py-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-icon mb-4 text-4xl text-emerald-400">✓</div>
            <p className="popup-message mb-6 text-sm text-slate-100">
              {popupMessage}
            </p>
            <button
              className="popup-close-btn rounded-md bg-gradient-to-r from-sky-400 to-sky-500 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950 shadow-lg hover:-translate-y-0.5 hover:shadow-sky-500/40"
              onClick={closePopup}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
