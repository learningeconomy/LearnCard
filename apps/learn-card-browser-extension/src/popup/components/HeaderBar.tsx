import React from 'react';

import RefreshIcon from '../icons/refresh.svg';
import ClipboardIcon from '../icons/paste-from-clipboard.svg';
import HamburgerIcon from '../icons/hamburger.svg';

export type HeaderBarProps = {
  authDid: string | null;
  tabId: number | null;
  rescanBusy: boolean;
  analyzeBusy: boolean;
  optsOpen: boolean;
  menuOpen: boolean;
  profileImage: string | null;
  hideClaimed: boolean;
  authLoading: boolean;

  onRescan: () => void;
  onAnalyze: () => void;
  onToggleOptions: () => void;
  onToggleMenu: () => void;
  onToggleHideClaimed: (checked: boolean) => void;
  onShowExchange: () => void;
  onCopyDid: () => void;
  onLogout: () => void;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  authDid,
  tabId,
  rescanBusy,
  analyzeBusy,
  optsOpen,
  menuOpen,
  profileImage,
  hideClaimed,
  authLoading,
  onRescan,
  onAnalyze,
  onToggleOptions,
  onToggleMenu,
  onToggleHideClaimed,
  onShowExchange,
  onCopyDid,
  onLogout,
}) => {
  return (
    <div className="header">
      <div className="logo">LearnCard</div>
      {authDid && (
        <div className="user">
          <div className="actions" aria-label="Utility actions">
            {tabId !== null && (
              <button
                className={`btn-icon${rescanBusy ? ' is-busy' : ''}`}
                aria-label="Rescan page"
                title="Rescan page"
                disabled={rescanBusy}
                aria-busy={rescanBusy}
                onClick={onRescan}
              >
                <img src={RefreshIcon} alt="Rescan page" className="icon" />
              </button>
            )}
            <button
              className={`btn-icon${analyzeBusy ? ' is-busy' : ''}`}
              aria-label="Analyze clipboard"
              title="Analyze clipboard"
              disabled={analyzeBusy}
              aria-busy={analyzeBusy}
              onClick={onAnalyze}
            >
              <img src={ClipboardIcon} alt="Analyze clipboard" className="icon" />
            </button>
            <div className="options">
              <button
                className="btn-icon"
                aria-label="More options"
                title="More options"
                onClick={onToggleOptions}
              >
                <img src={HamburgerIcon} alt="More options" className="icon" />
              </button>
              {optsOpen && (
                <div className="menu">
                  <div className="menu-row">
                    <label className="select-all">
                      <input type="checkbox" checked={hideClaimed} onChange={(e) => onToggleHideClaimed(e.target.checked)} />
                      <span>Hide claimed</span>
                    </label>
                  </div>
                  <div className="menu-row">
                    <button className="menu-item" onClick={onShowExchange}>
                      Claim via VC-API
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button className="btn-icon avatar" aria-label="User menu" onClick={onToggleMenu}>
            {profileImage ? <img src={profileImage} alt="Profile" /> : <span aria-hidden>LC</span>}
          </button>
          {menuOpen && (
            <div className="menu">
              <div className="menu-row">
                <div className="menu-title">Signed in</div>
                <div className="menu-did" title={authDid || undefined}>{authDid}</div>
              </div>
              <div className="menu-actions">
                <button className="btn-secondary" onClick={onCopyDid}>Copy DID</button>
                <button className="btn-secondary" onClick={onLogout} disabled={authLoading}>{authLoading ? 'Working…' : 'Logout'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderBar;
