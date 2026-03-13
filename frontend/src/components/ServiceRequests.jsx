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
    <div className="service-requests-container mt-4 flex-1 overflow-y-auto bg-main px-4 py-6 md:px-8 transition-colors duration-300">
      <div className="sr-header mb-10">
        <h1 className="mb-2 text-2xl font-black uppercase tracking-tight text-accent-primary">Secure Operational Protocols</h1>
        <p className="text-sm text-muted font-medium">Coordinate Response: Immediate Block or Quarantine Neutralization</p>
      </div>

      <div className="sr-content mx-auto w-full max-w-xl rounded-[2.5rem] border border-theme bg-card px-10 py-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent"></div>

        <div className="ip-input-section mb-10">
          <label
            htmlFor="ip-input"
            className="mb-3 block text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1"
          >
            Tactical IP Coordinate
          </label>
          <input
            id="ip-input"
            type="text"
            className="ip-input w-full rounded-2xl border border-theme bg-sidebar px-5 py-4 text-sm text-main outline-none transition-all focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/10 shadow-inner font-mono font-bold placeholder:text-muted/40"
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

        <div className="button-group flex justify-center gap-6 max-md:flex-col">
          <button
            className="btn btn-block flex-1 rounded-2xl bg-accent-danger px-6 py-4 text-xs font-black uppercase tracking-widest text-inverse shadow-xl shadow-accent-danger/20 transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            onClick={handleBlock}
          >
            🚫 Execute Block
          </button>
          <button
            className="btn btn-quarantine flex-1 rounded-2xl bg-accent-warning px-6 py-4 text-xs font-black uppercase tracking-widest text-inverse shadow-xl shadow-accent-warning/20 transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            onClick={handleQuarantine}
          >
            ⛔ Quarantine
          </button>
        </div>
      </div>

      {showPopup && (
        <div
          className="popup-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={closePopup}
        >
          <div
            className="popup-box w-[90%] max-w-md rounded-[3rem] border border-theme bg-sidebar px-10 py-12 text-center shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-icon mb-6 text-6xl text-accent-success drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">✓</div>
            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-main mb-4">Command Acknowledged</h3>
            <p className="popup-message mb-10 text-sm font-medium text-muted leading-relaxed">
              {popupMessage}
            </p>
            <button
              className="popup-close-btn w-full rounded-2xl bg-accent-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-inverse shadow-xl shadow-accent-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              onClick={closePopup}
            >
              Confirm Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
