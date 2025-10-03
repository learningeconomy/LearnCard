  // Helper: delegate to shared error utility
const toErrorString = (e: unknown): string => toErrorStringUtil(e);

import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { toErrorString as toErrorStringUtil } from '../utils/errors';
import { getTitleFromVc, getIssuerNameFromVc, MinimalVc } from '../utils/vc';
import CategorySelector from './components/CategorySelector';
import HeaderBar from './components/HeaderBar';
import ActionBar from './components/ActionBar';
import { useActiveTabId } from './hooks/useActiveTabId';
import { useUi } from './hooks/useUi';
import { useAuth } from './hooks/useAuth';
import { useInbox } from './hooks/useInbox';
import { useExchange } from './hooks/useExchange';

const App = () => {
  const tabId = useActiveTabId();

  const { menuOpen, setMenuOpen, optsOpen, setOptsOpen, status, setStatus } = useUi();

  const { did: authDid, profileImage, loading: authLoading, login, logout } = useAuth();

  const {
    candidates,
    selected,
    categories,
    openCategoryIdx,
    hideClaimed,
    rescanBusy,
    analyzeBusy,
    saving,
    setSelected,
    setCategories,
    setOpenCategoryIdx,
    setHideClaimed,
    refreshDetected,
    analyzeClipboard,
    rescan,
    bulkSave,
  } = useInbox(tabId, { onStatus: setStatus });

  const {
    url: exchangeUrl,
    state: exchangeState,
    offers: exchangeOffers,
    selected: offerSelected,
    categories: offerCategories,
    openCatIdx: offerOpenCatIdx,
    busy: exchangeBusy,
    error: exchangeError,
    autoPrefilled,
    show: showExchange,
    setUrl: setExchangeUrl,
    setSelected: setOfferSelected,
    setCategories: setOfferCategories,
    setOpenCatIdx: setOfferOpenCatIdx,
    setShow: setShowExchange,
    start: startExchange,
    cancel: cancelExchange,
    accept: acceptExchange,
    prefillFromCandidates,
  } = useExchange(tabId, { onStatus: setStatus });

  // Category options/labels now imported from ./constants

  // Auto-prefill Exchange URL from detected link candidates when logged in
  useEffect(() => {
    if (!authDid) return; // only prompt when logged in
    prefillFromCandidates(candidates);
  }, [authDid, candidates]);

  // When exchange URL is auto-prefilled from page, de-select link candidates in inbox
  useEffect(() => {
    if (!autoPrefilled) return;
    setSelected((prev) =>
      candidates.map((c, i) => {
        if (c.claimed) return false;
        if (c.source === 'link') return false;
        return typeof prev[i] === 'boolean' ? prev[i] : true;
      })
    );
  }, [autoPrefilled, candidates]);

  // VC helpers now imported from ../utils/vc

  const onBulkSave = async () => {
    const resp = await bulkSave();
    if ((resp as { ok?: boolean })?.ok) {
      const count = (resp as { savedCount?: number }).savedCount ?? 0;
      setStatus(`Saved ${count} credential${count === 1 ? '' : 's'} to LearnCard`);
    } else {
      const err = toErrorString((resp as { error?: string })?.error ?? 'Unknown error');
      setStatus(`Failed: ${err}`);
    }
  };

  const onLogin = () => {
    setStatus(null);
    login().then((resp) => {
      if ((resp as { ok?: boolean })?.ok) setStatus('Logged in successfully');
      else setStatus(`Login failed: ${(resp as { error?: string })?.error ?? 'Unknown error'}`);
    });
  };

  const onLogout = () => {
    logout().then((resp) => {
      if ((resp as { ok?: boolean })?.ok) {
        setMenuOpen(false);
        setStatus('Logged out');
      } else setStatus(`Logout failed: ${(resp as { error?: string })?.error ?? 'Unknown error'}`);
    });
  };

  const copyDid = async () => {
    if (!authDid) return;
    try {
      await navigator.clipboard.writeText(authDid);
      setStatus('DID copied to clipboard');
      setMenuOpen(false);
    } catch {}
  };

  // VC-API Exchange helpers
  const acceptAndRefresh = () => {
    acceptExchange().then((resp) => {
      if ((resp as { ok?: boolean })?.ok) refreshDetected();
    });
  };

  return (
    <div className="popup">
      {/* Header */}
      <HeaderBar
        authDid={authDid}
        tabId={tabId}
        rescanBusy={rescanBusy}
        analyzeBusy={analyzeBusy}
        optsOpen={optsOpen}
        menuOpen={menuOpen}
        profileImage={profileImage}
        hideClaimed={hideClaimed}
        authLoading={authLoading}
        onRescan={rescan}
        onAnalyze={analyzeClipboard}
        onToggleOptions={() => setOptsOpen((v) => !v)}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onToggleHideClaimed={(checked) => setHideClaimed(checked)}
        onShowExchange={() => {
          // Prefill from detected link if empty
          if (!exchangeUrl.trim()) {
            prefillFromCandidates(candidates);
          }
          setShowExchange(true);
          setOptsOpen(false);
        }}
        onCopyDid={copyDid}
        onLogout={onLogout}
      />

      {/* Body */}
      <div className="content">
        {!authDid ? (
          <div className="state">
            <h2 className="heading">Welcome to LearnCard</h2>
            <p className="subtext">Sign in to save credentials directly to your LearnCard wallet.</p>
            <button className="btn-primary" onClick={onLogin} disabled={authLoading}>
              {authLoading ? 'Opening…' : 'Login to LearnCard'}
            </button>
          </div>
        ) : (
          <>
            {/* Exchange Card */}
            {(showExchange || exchangeState !== 'idle') && (
            <div className="card exchange-card" role="region" aria-label="VC-API Exchange">
              {exchangeState === 'idle' && (
                <div className="state">
                  <h3 className="heading">Claim via VC-API</h3>
                  <p className="subtext">Paste a credential offer URL to start an exchange.</p>
                  <div className="field">
                    <label className="label" htmlFor="exchange-url">Offer URL</label>
                    <input
                      id="exchange-url"
                      className="select"
                      type="url"
                      placeholder="https://issuer.example/offer/..."
                      value={exchangeUrl}
                      onChange={(e) => setExchangeUrl(e.target.value)}
                    />
                  </div>
                  <div className="tools">
                    <button className="btn-secondary" onClick={cancelExchange}>Dismiss</button>
                    <button className="btn-primary" onClick={startExchange} disabled={exchangeBusy || !exchangeUrl.trim()}>
                      {exchangeBusy ? 'Starting…' : 'Start Exchange'}
                    </button>
                  </div>
                  {exchangeError && <div className="status">{exchangeError}</div>}
                </div>
              )}

              {exchangeState === 'contacting' && (
                <div className="state">
                  <h3 className="heading">Contacting issuer…</h3>
                  <p className="subtext">Fetching credential offers from the issuer.</p>
                  <div className="tools">
                    <button className="btn-secondary" onClick={cancelExchange}>Cancel</button>
                  </div>
                </div>
              )}

              {exchangeState === 'offer' && (
                <div className="state">
                  <h3 className="heading">Select credentials to claim</h3>
                  <div className="inbox-list">
                    {exchangeOffers.map((vc, i) => {
                      const typedVc = vc as MinimalVc;
                      const title = getTitleFromVc(typedVc);
                      const issuer = getIssuerNameFromVc(typedVc);
                      const isOpen = offerOpenCatIdx === i;
                      const cat = offerCategories[i] || 'Achievement';
                      return (
                        <div key={i} className="inbox-card">
                          <input
                            className="check"
                            type="checkbox"
                            checked={!!offerSelected[i]}
                            onChange={(e) => {
                              const next = offerSelected.slice();
                              next[i] = e.target.checked;
                              setOfferSelected(next);
                            }}
                          />
                          <div className="card-icon" aria-hidden>
                            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z" />
                            </svg>
                          </div>
                          <div className="card-body">
                            <p className="credential-title">{title}</p>
                            <p className="credential-issuer">{issuer ? `by ${issuer}` : ''}</p>
                          </div>
                          <CategorySelector
                            value={cat}
                            isOpen={isOpen}
                            onOpen={() => setOfferOpenCatIdx(i)}
                            onClose={() => setOfferOpenCatIdx(null)}
                            onSelect={(value) => {
                              const next = offerCategories.slice();
                              next[i] = value;
                              setOfferCategories(next);
                              setOfferOpenCatIdx(null);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="tools">
                    <label className="select-all">
                      <input
                        type="checkbox"
                        checked={exchangeOffers.length > 0 && offerSelected.every(Boolean)}
                        onChange={(e) => {
                          const all = e.target.checked;
                          setOfferSelected(exchangeOffers.map(() => all));
                        }}
                      />
                      <span>Select all</span>
                    </label>
                    <button className="btn-secondary" onClick={cancelExchange}>Cancel</button>
                    <button className="btn-primary" onClick={acceptAndRefresh} disabled={exchangeBusy || !offerSelected.some(Boolean)}>
                      {exchangeBusy ? 'Claiming…' : `Claim ${offerSelected.filter(Boolean).length} Credential${offerSelected.filter(Boolean).length === 1 ? '' : 's'}`}
                    </button>
                  </div>
                </div>
              )}

              {exchangeState === 'saving' && (
                <div className="state">
                  <h3 className="heading">Claiming…</h3>
                  <p className="subtext">Saving credentials to your LearnCard wallet.</p>
                </div>
              )}

              {exchangeState === 'success' && (
                <div className="state">
                  <h3 className="heading">Success</h3>
                  <p className="subtext">Credentials were added to your inbox below. You can now manage them like other detections.</p>
                  <div className="tools">
                    <button className="btn-primary" onClick={cancelExchange}>Done</button>
                  </div>
                </div>
              )}

              {exchangeState === 'error' && (
                <div className="state">
                  <h3 className="heading">Something went wrong</h3>
                  <div className="status">{exchangeError ?? 'Unknown error'}</div>
                  <div className="tools">
                    <button className="btn-secondary" onClick={cancelExchange}>Dismiss</button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Inbox */}
            {!(showExchange || exchangeState !== 'idle') && ((
              (hideClaimed
                ? candidates.map((_, i) => i).filter((i) => !candidates[i]?.claimed)
                : candidates.map((_, i) => i)
              ).filter((i) => candidates[i]?.source !== 'link')
            ).length > 0 ? (
              <div className="state">
                <div className="inbox-list">
                  {(
                    hideClaimed
                      ? candidates.map((_, i) => i).filter((i) => !candidates[i]?.claimed)
                      : candidates.map((_, i) => i)
                   ).filter((i) => candidates[i]?.source !== 'link').map((i) => {
                    const c = candidates[i];
                    const raw = c.raw as MinimalVc | undefined;
                    const title = c.title || (raw ? getTitleFromVc(raw) : c.url || 'Credential');
                    const issuer = raw ? getIssuerNameFromVc(raw) : (c.platform ? `from ${c.platform}` : '');
                    const cat = categories[i] || 'Achievement';
                    const isOpen = openCategoryIdx === i;
                    return (
                      <div key={i} className="inbox-card">
                        {c.claimed ? (
                          <div className="check claimed-indicator" aria-label="Already claimed" title="Already claimed">
                            <svg
                              className="icon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                              style={{ color: '#16a34a' }}
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        ) : (
                          <input
                            className="check"
                            type="checkbox"
                            checked={!!selected[i]}
                            onChange={(e) => {
                              const next = selected.slice();
                              next[i] = e.target.checked;
                              setSelected(next);
                            }}
                          />
                        )}
                        <div className="card-icon" aria-hidden>
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z" />
                          </svg>
                        </div>
                        <div className="card-body">
                          <p className="credential-title">{title}</p>
                          <p className="credential-issuer">
                            {issuer ? `by ${issuer}` : ''}
                            {c.claimed ? (
                              <em className="claimed-label" title="Already claimed" style={{ marginLeft: 8, fontStyle: 'italic', color: '#555' }}>
                                Claimed
                              </em>
                            ) : null}
                          </p>
                        </div>
                        {!c.claimed && (
                          <CategorySelector
                            value={cat}
                            isOpen={isOpen}
                            onOpen={() => setOpenCategoryIdx(i)}
                            onClose={() => setOpenCategoryIdx(null)}
                            onSelect={(value) => {
                              const next = categories.slice();
                              next[i] = value;
                              setCategories(next);
                              setOpenCategoryIdx(null);
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {status && (
                  <div role="status" aria-live="polite" className={`status ${status.startsWith('Saved') ? 'ok' : status.startsWith('No credential') ? 'warn' : ''}`}>
                    {status}
                  </div>
                )}
              </div>
            ) : (
              <div className="state">
                <h2 className="heading">No credentials found</h2>
                <p className="subtext">The extension is active. Try rescanning the page or analyzing your clipboard.</p>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer / Action bar */}
      <div className="footer">
        {authDid && !(showExchange || exchangeState !== 'idle') && (
          <ActionBar
            candidates={candidates}
            selected={selected}
            setSelected={(next) => setSelected(next)}
            saving={saving}
            onBulkSave={onBulkSave}
          />
        )}
      </div>
    </div>
  );
};

const container = document.getElementById('root')!;
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
