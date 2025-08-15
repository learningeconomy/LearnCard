  // Helper: delegate to shared error utility
const toErrorString = (e: unknown): string => toErrorStringUtil(e);

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  CredentialCandidate,
  CredentialCategory,
  SaveCredentialsMessage,
  VcApiExchangeState,
} from '../types/messages';

import { toErrorString as toErrorStringUtil } from '../utils/errors';
import { isVc, getTitleFromVc, getIssuerNameFromVc, MinimalVc } from '../utils/vc';
import CategorySelector from './components/CategorySelector';
import HeaderBar from './components/HeaderBar';
import ActionBar from './components/ActionBar';
import { sendMessage, sendTabMessage } from '../messaging/client';

const App = () => {
  const [tabId, setTabId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CredentialCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDid, setAuthDid] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  const [rescanBusy, setRescanBusy] = useState(false);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Inbox UI state
  const [selected, setSelected] = useState<boolean[]>([]);
  const [categories, setCategories] = useState<CredentialCategory[]>([]);
  const [openCategoryIdx, setOpenCategoryIdx] = useState<number | null>(null);
  const [hideClaimed, setHideClaimed] = useState(false);

  // VC-API Exchange UI state
  const [exchangeUrl, setExchangeUrl] = useState('');
  const [exchangeState, setExchangeState] = useState<VcApiExchangeState>('idle');
  const [exchangeOffers, setExchangeOffers] = useState<unknown[]>([]);
  const [offerSelected, setOfferSelected] = useState<boolean[]>([]);
  const [offerCategories, setOfferCategories] = useState<CredentialCategory[]>([]);
  const [offerOpenCatIdx, setOfferOpenCatIdx] = useState<number | null>(null);
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [autoPrefilledExchange, setAutoPrefilledExchange] = useState(false);
  const [showExchange, setShowExchange] = useState(false); // hidden by default

  // Category options/labels now imported from ./constants

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs?.[0]?.id ?? null;
      setTabId(id ?? null);
      sendMessage({ type: 'get-detected', tabId: id ?? undefined }).then(async (resp) => {
        const list = resp?.ok && Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
        setCandidates(list);
        if ((id ?? null) !== null && list.length === 0) {
          try {
            await sendTabMessage(id!, { type: 'request-scan' });
            sendMessage({ type: 'get-detected', tabId: id ?? undefined }).then((resp2) => {
              if (resp2?.ok) setCandidates(Array.isArray(resp2.data) ? (resp2.data as CredentialCandidate[]) : []);
            });
          } catch {}
        }
      });
    });
    sendMessage({ type: 'get-auth-status' }).then((resp) => {
      if (resp?.ok && resp.data) {
        setAuthDid(resp.data.did ?? null);
        if (resp.data.loggedIn) {
          sendMessage({ type: 'get-profile' }).then((p) => {
            if (p?.ok) setProfileImage(p.profile?.image ?? null);
          });
        }
      }
    });
  }, []);

  // Sync Exchange session from background when tabId becomes available
  useEffect(() => {
    if (tabId === null) return;
    const refreshExchangeStatus = () => {
      sendMessage({ type: 'get-vcapi-exchange-status', tabId: tabId ?? undefined }).then((resp) => {
        if (!resp?.ok) return;
        const sess = (resp.data || { state: 'idle' }) as {
          state: VcApiExchangeState;
          url?: string;
          offers?: unknown[];
          error?: string | null;
        };
        setExchangeState(sess.state);
        if (sess.url) setExchangeUrl(sess.url);
        setExchangeError(sess.state === 'error' ? (sess.error ?? 'Unknown error') : null);
        if (Array.isArray(sess.offers)) {
          setExchangeOffers(sess.offers);
          setOfferSelected(sess.offers.map(() => true));
          setOfferCategories(sess.offers.map(() => 'Achievement' as CredentialCategory));
        } else {
          setExchangeOffers([]);
          setOfferSelected([]);
          setOfferCategories([]);
        }
        if (sess.state === 'contacting' || sess.state === 'saving') {
          window.setTimeout(refreshExchangeStatus, 600);
        }
      });
    };
    refreshExchangeStatus();
  }, [tabId]);

  // Auto-prefill Exchange URL from detected link candidates (prompt user to start exchange)
  useEffect(() => {
    if (!authDid) return; // only prompt when logged in
    if (exchangeState !== 'idle') return; // don't override an active session
    if (autoPrefilledExchange) return; // only once per popup open
    if (exchangeUrl.trim()) return; // don't override user input
    const link = candidates.find((c) => c.source === 'link' && !!c.url && !c.claimed);
    if (link?.url) {
      setExchangeUrl(link.url);
      setAutoPrefilledExchange(true);
      setStatus('Detected offer URL from page');
      setShowExchange(true); // show exchange box when a URL candidate is detected
    }
  }, [candidates, exchangeState, authDid, autoPrefilledExchange, exchangeUrl]);

  // VC helpers now imported from ../utils/vc

  const dedupe = (list: CredentialCandidate[]) => {
    const map = new Map<string, CredentialCandidate>();
    const keyFor = (c: CredentialCandidate) => {
      if (c.url) return `url:${c.url}`;
      try {
        return `raw:${JSON.stringify(c.raw)}`;
      } catch {
        return `raw:${String(c.title ?? '')}`;
      }
    };
    for (const c of list) {
      const k = keyFor(c);
      if (!map.has(k)) map.set(k, c);
    }
    return Array.from(map.values());
  };

  // Keep selection and categories arrays in sync with candidates
  useEffect(() => {
    setSelected((prev) => {
      const next = candidates.map((c, i) => {
        if (c.claimed) return false;
        if (typeof prev[i] === 'boolean') return prev[i] as boolean;
        // If we auto-prefilled the exchange URL, de-select link candidates by default to encourage VC-API flow
        if (autoPrefilledExchange && c.source === 'link') return false;
        return true;
      });
      return next;
    });
    setCategories((prev) => {
      const next = candidates.map((_, i) => (prev[i] ? prev[i] : 'Achievement'));
      return next as CredentialCategory[];
    });
  }, [candidates, autoPrefilledExchange]);

  const analyzeClipboard = async () => {
    setAnalyzeBusy(true);
    setStatus('Analyzing clipboard…');
    try {
      const text = await navigator.clipboard.readText();
      let found: CredentialCandidate[] = [];

      try {
        const parsed = JSON.parse(text);
        const add = (val: unknown) => {
          if (Array.isArray(val)) return val.forEach(add);
          if (isVc(val)) found.push({ source: 'jsonld', raw: val, title: getTitleFromVc(val), platform: 'unknown' });
        };
        add(parsed);
      } catch {}

      if (found.length === 0) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const snippet = text.slice(start, end + 1);
          try {
            const parsed = JSON.parse(snippet);
            if (isVc(parsed)) found.push({ source: 'jsonld', raw: parsed, title: getTitleFromVc(parsed), platform: 'unknown' });
          } catch {}
        }
      }

      if (found.length === 0) {
        setStatus('No credential found in clipboard');
        return;
      }

      const merged = dedupe([...found, ...candidates]);
      // Update background with merged detections, then refresh to pick up claimed statuses
      sendMessage({ type: 'credentials-detected', payload: merged, tabId: tabId ?? undefined }).then((resp) => {
        if (resp?.ok) {
          sendMessage({ type: 'get-detected', tabId: tabId ?? undefined }).then((resp2) => {
            const list = resp2?.ok && Array.isArray(resp2.data) ? (resp2.data as CredentialCandidate[]) : merged;
            setCandidates(list);
          });
          setStatus(`Found ${found.length} credential${found.length === 1 ? '' : 's'} from clipboard`);
        } else setStatus(`Failed to update detections`);
      });
    } catch (e) {
      setStatus('Clipboard read failed. Grant clipboard permission and try again.');
    } finally {
      setAnalyzeBusy(false);
    }
  };

  const onBulkSave = () => {
    const selections = selected
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => v && !candidates[i]?.claimed && candidates[i]?.source !== 'link')
      .map(({ i }) => ({ index: i, category: categories[i] }));
    if (selections.length === 0) return;
    setSaving(true);
    const msg: SaveCredentialsMessage = {
      type: 'save-credentials',
      tabId: tabId ?? undefined,
      selections,
      candidates,
    };
    sendMessage(msg).then((resp) => {
      setSaving(false);
      if (resp?.ok) {
        // Refresh from background, which only removed actually-saved items
        sendMessage({ type: 'get-detected', tabId: tabId ?? undefined }).then((resp2) => {
          if (resp2?.ok && Array.isArray(resp2.data)) setCandidates(resp2.data as CredentialCandidate[]);
        });
        setStatus(`Saved ${resp.savedCount} credential${(resp.savedCount === 1) ? '' : 's'} to LearnCard`);
      } else setStatus(`Failed: ${toErrorString(resp?.error ?? 'Unknown error')}`);
    });
  };

  const onLogin = () => {
    setAuthLoading(true);
    setStatus(null);
    sendMessage({ type: 'start-auth' }).then((resp) => {
      setAuthLoading(false);
      if (resp?.ok) {
        setAuthDid(resp.data?.did ?? null);
        sendMessage({ type: 'get-profile' }).then((p) => {
          if (p?.ok) setProfileImage(p.profile?.image ?? null);
        });
        setStatus('Logged in successfully');
      } else setStatus(`Login failed: ${resp?.error ?? 'Unknown error'}`);
    });
  };

  const onLogout = () => {
    setAuthLoading(true);
    sendMessage({ type: 'logout' }).then((resp) => {
      setAuthLoading(false);
      if (resp?.ok) {
        setAuthDid(null);
        setProfileImage(null);
        setMenuOpen(false);
        setStatus('Logged out');
      } else setStatus(`Logout failed: ${resp?.error ?? 'Unknown error'}`);
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
  const refreshExchangeStatus = () => {
    sendMessage({ type: 'get-vcapi-exchange-status', tabId: tabId ?? undefined }).then((resp) => {
      if (!resp?.ok) return;
      const sess = (resp.data || { state: 'idle' }) as {
        state: VcApiExchangeState;
        url?: string;
        offers?: unknown[];
        error?: string | null;
      };
      setExchangeState(sess.state);
      if (sess.url) setExchangeUrl(sess.url);
      setExchangeError(sess.state === 'error' ? toErrorString(sess.error ?? 'Unknown error') : null);
      if (Array.isArray(sess.offers)) {
        setExchangeOffers(sess.offers);
        setOfferSelected(sess.offers.map(() => true));
        setOfferCategories(sess.offers.map(() => 'Achievement' as CredentialCategory));
      } else {
        setExchangeOffers([]);
        setOfferSelected([]);
        setOfferCategories([]);
      }
      if (sess.state === 'contacting' || sess.state === 'saving') {
        window.setTimeout(refreshExchangeStatus, 600);
      }
    });
  };

  const startExchange = () => {
    const url = exchangeUrl.trim();
    if (!url) return;
    setExchangeBusy(true);
    setExchangeError(null);
    setStatus('Starting exchange…');
    sendMessage({ type: 'start-vcapi-exchange', url, tabId: tabId ?? undefined }).then((resp) => {
      setExchangeBusy(false);
      if (resp?.ok) {
        setExchangeState('contacting');
        refreshExchangeStatus();
      } else {
        const err = toErrorString(resp?.error ?? 'Failed to start');
        setExchangeError(err);
        setExchangeState('error');
        setStatus(`Failed to start: ${err}`);
      }
    });
  };

  const cancelExchange = () => {
    sendMessage({ type: 'cancel-vcapi-exchange', tabId: tabId ?? undefined }).then(() => {
      setExchangeState('idle');
      setExchangeOffers([]);
      setOfferSelected([]);
      setOfferCategories([]);
      setOfferOpenCatIdx(null);
      setExchangeBusy(false);
      setExchangeError(null);
      setShowExchange(false);
    });
  };

  const acceptExchange = () => {
    const selections = offerSelected
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v)
      .map(({ i }) => ({ index: i, category: offerCategories[i] }));
    if (selections.length === 0) return;
    setExchangeBusy(true);
    setStatus('Claiming…');
    sendMessage({ type: 'accept-vcapi-offer', selections, tabId: tabId ?? undefined }).then((resp) => {
      setExchangeBusy(false);
      if (resp?.ok) {
        setExchangeState('success');
        const count = resp.savedCount;
        setStatus(`Saved ${count} credential${count === 1 ? '' : 's'} to LearnCard`);
        // Refresh detected list to include claimed entries
        sendMessage({ type: 'get-detected', tabId: tabId ?? undefined }).then((resp2) => {
          if (resp2?.ok && Array.isArray(resp2.data)) setCandidates(resp2.data as CredentialCandidate[]);
        });
      } else {
        const err = toErrorString(resp?.error ?? 'Unknown error');
        setExchangeState('error');
        setExchangeError(err);
        setStatus(`Failed: ${err}`);
      }
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
        onRescan={() => {
          if (tabId === null) return;
          const id = tabId;
          setStatus('Rescanning page…');
          setRescanBusy(true);
          sendTabMessage(id, { type: 'request-scan' }).then(() => {
            sendMessage({ type: 'get-detected', tabId: id }).then((resp) => {
              if (resp?.ok) {
                const list = Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
                setCandidates(list);
                setStatus(`Scan complete: ${list.length} credential${list.length === 1 ? '' : 's'} found`);
              } else {
                setStatus('Rescan failed');
              }
              setRescanBusy(false);
            });
          });
        }}
        onAnalyze={analyzeClipboard}
        onToggleOptions={() => setOptsOpen((v) => !v)}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onToggleHideClaimed={(checked) => setHideClaimed(checked)}
        onShowExchange={() => {
          // Prefill from detected link if empty
          if (!exchangeUrl.trim()) {
            const link = candidates.find((c) => c.source === 'link' && !!c.url && !c.claimed);
            if (link?.url) {
              setExchangeUrl(link.url);
              setStatus('Detected offer URL from page');
              setAutoPrefilledExchange(true);
            }
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
                    <button className="btn-primary" onClick={acceptExchange} disabled={exchangeBusy || !offerSelected.some(Boolean)}>
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
