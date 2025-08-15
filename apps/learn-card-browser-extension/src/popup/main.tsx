import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  CredentialCandidate,
  ExtensionMessage,
  CredentialCategory,
  SaveCredentialsMessage,
  VcApiExchangeState,
} from '../types/messages';

import RefreshIcon from './icons/refresh.svg';
import ClipboardIcon from './icons/paste-from-clipboard.svg';
import HamburgerIcon from './icons/hamburger.svg';

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

  // Category options: store value, show label
  const CATEGORY_OPTIONS: ReadonlyArray<{ value: CredentialCategory; label: string }> = [
    { value: 'Achievement', label: 'Achievement' },
    { value: 'ID', label: 'ID' },
    { value: 'Learning History', label: 'Studies' },
    { value: 'Work History', label: 'Experiences' },
    { value: 'Social Badge', label: 'Boosts' },
    { value: 'Accomplishment', label: 'Portfolio' },
    { value: 'Accommodation', label: 'Assistance' },
  ] as const;

  const getCategoryLabel = (val: CredentialCategory | null | undefined) => {
    if (!val) return 'Set Category';
    const found = CATEGORY_OPTIONS.find((o) => o.value === val);
    return found?.label ?? val;
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs?.[0]?.id ?? null;
      setTabId(id ?? null);
      chrome.runtime.sendMessage({ type: 'get-detected', tabId: id ?? undefined } as ExtensionMessage, async (resp) => {
        const list = resp?.ok && Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
        setCandidates(list);
        if ((id ?? null) !== null && list.length === 0) {
          try {
            await new Promise<void>((resolve) => {
              chrome.tabs.sendMessage(id!, { type: 'request-scan' } as ExtensionMessage, () => resolve());
            });
            chrome.runtime.sendMessage({ type: 'get-detected', tabId: id ?? undefined } as ExtensionMessage, (resp2) => {
              if (resp2?.ok) setCandidates(Array.isArray(resp2.data) ? resp2.data : []);
            });
          } catch {}
        }
      });
    });
    chrome.runtime.sendMessage({ type: 'get-auth-status' } as ExtensionMessage, (resp) => {
      if (resp?.ok && resp.data) {
        setAuthDid(resp.data.did ?? null);
        if (resp.data.loggedIn) {
          chrome.runtime.sendMessage({ type: 'get-profile' } as ExtensionMessage, (p) => {
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
      chrome.runtime.sendMessage(
        { type: 'get-vcapi-exchange-status', tabId: tabId ?? undefined } as ExtensionMessage,
        (resp) => {
          if (!resp?.ok) return;
          const sess = (resp.data || { state: 'idle' }) as {
            state: VcApiExchangeState;
            url?: string;
            offers?: unknown[];
            error?: string | null;
          };
          setExchangeState(sess.state);
          if (sess.url) setExchangeUrl(sess.url);
          setExchangeError(sess.state === 'error' ? sess.error ?? 'Unknown error' : null);
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
        }
      );
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

  const isVc = (data: unknown): data is { '@context': unknown[]; type: string | string[]; name?: string } => {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    const ctx = obj['@context'];
    const type = obj['type'];
    return Array.isArray(ctx) && (Array.isArray(type) || typeof type === 'string');
  };

  const getTitleFromVc = (vc: any) => {
    if (vc?.boostCredential) {
      return vc.boostCredential?.name || vc.boostCredential?.credentialSubject?.name || 'Credential';
    } else if (vc?.credentialSubject) {
      return vc.name || vc.credentialSubject?.name || 'Credential';
    } else {
      return 'Credential';
    }
  };

  const getIssuerNameFromVc = (vc: any) => {
    if (vc?.boostCredential) {
      return vc.boostCredential?.issuer || vc.boostCredential?.credentialSubject?.issuer || 'Unknown';
    } else if (vc?.credentialSubject) {
      return vc.issuer || vc.credentialSubject?.issuer || 'Unknown';
    } else {
      return 'Unknown';
    }
  };

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
      chrome.runtime.sendMessage({ type: 'credentials-detected', payload: merged, tabId: tabId ?? undefined } as ExtensionMessage, (resp) => {
        if (resp?.ok) {
          chrome.runtime.sendMessage({ type: 'get-detected', tabId: tabId ?? undefined } as ExtensionMessage, (resp2) => {
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
      .filter(({ v }) => v)
      .map(({ i }) => ({ index: i, category: categories[i] }));
    if (selections.length === 0) return;
    setSaving(true);
    const msg: SaveCredentialsMessage = {
      type: 'save-credentials',
      tabId: tabId ?? undefined,
      selections,
      candidates,
    };
    chrome.runtime.sendMessage(msg as unknown as ExtensionMessage, (resp) => {
      setSaving(false);
      if (resp?.ok) {
        // Refresh from background, which only removed actually-saved items
        chrome.runtime.sendMessage({ type: 'get-detected', tabId: tabId ?? undefined } as ExtensionMessage, (resp2) => {
          if (resp2?.ok && Array.isArray(resp2.data)) setCandidates(resp2.data as CredentialCandidate[]);
        });
        setStatus(`Saved ${resp.savedCount ?? selections.length} credential${(resp.savedCount ?? selections.length) === 1 ? '' : 's'} to LearnCard`);
      } else setStatus(`Failed: ${resp?.error ?? 'Unknown error'}`);
    });
  };

  const onLogin = () => {
    setAuthLoading(true);
    setStatus(null);
    chrome.runtime.sendMessage({ type: 'start-auth' } as ExtensionMessage, (resp) => {
      setAuthLoading(false);
      if (resp?.ok) {
        setAuthDid(resp.data?.did ?? null);
        chrome.runtime.sendMessage({ type: 'get-profile' } as ExtensionMessage, (p) => {
          if (p?.ok) setProfileImage(p.profile?.image ?? null);
        });
        setStatus('Logged in successfully');
      } else setStatus(`Login failed: ${resp?.error ?? 'Unknown error'}`);
    });
  };

  const onLogout = () => {
    setAuthLoading(true);
    chrome.runtime.sendMessage({ type: 'logout' } as ExtensionMessage, (resp) => {
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
    chrome.runtime.sendMessage(
      { type: 'get-vcapi-exchange-status', tabId: tabId ?? undefined } as ExtensionMessage,
      (resp) => {
        if (!resp?.ok) return;
        const sess = (resp.data || { state: 'idle' }) as {
          state: VcApiExchangeState;
          url?: string;
          offers?: unknown[];
          error?: string | null;
        };
        setExchangeState(sess.state);
        if (sess.url) setExchangeUrl(sess.url);
        setExchangeError(sess.state === 'error' ? sess.error ?? 'Unknown error' : null);
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
      }
    );
  };

  const startExchange = () => {
    const url = exchangeUrl.trim();
    if (!url) return;
    setExchangeBusy(true);
    setExchangeError(null);
    setStatus('Starting exchange…');
    chrome.runtime.sendMessage(
      { type: 'start-vcapi-exchange', url, tabId: tabId ?? undefined } as ExtensionMessage,
      (resp) => {
        setExchangeBusy(false);
        if (resp?.ok) {
          setExchangeState('contacting');
          refreshExchangeStatus();
        } else {
          const err = resp?.error ?? 'Failed to start';
          setExchangeError(err);
          setExchangeState('error');
          setStatus(`Failed to start: ${err}`);
        }
      }
    );
  };

  const cancelExchange = () => {
    chrome.runtime.sendMessage(
      { type: 'cancel-vcapi-exchange', tabId: tabId ?? undefined } as ExtensionMessage,
      () => {
        setExchangeState('idle');
        setExchangeOffers([]);
        setOfferSelected([]);
        setOfferCategories([]);
        setOfferOpenCatIdx(null);
        setExchangeBusy(false);
        setExchangeError(null);
        setShowExchange(false);
      }
    );
  };

  const acceptExchange = () => {
    const selections = offerSelected
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v)
      .map(({ i }) => ({ index: i, category: offerCategories[i] }));
    if (selections.length === 0) return;
    setExchangeBusy(true);
    setStatus('Claiming…');
    chrome.runtime.sendMessage(
      { type: 'accept-vcapi-offer', selections, tabId: tabId ?? undefined } as ExtensionMessage,
      (resp) => {
        setExchangeBusy(false);
        if (resp?.ok) {
          setExchangeState('success');
          const count = (resp.savedCount ?? selections.length) as number;
          setStatus(`Saved ${count} credential${count === 1 ? '' : 's'} to LearnCard`);
          // Refresh detected list to include claimed entries
          chrome.runtime.sendMessage(
            { type: 'get-detected', tabId: tabId ?? undefined } as ExtensionMessage,
            (resp2) => {
              if (resp2?.ok && Array.isArray(resp2.data)) setCandidates(resp2.data as CredentialCandidate[]);
            }
          );
        } else {
          const err = resp?.error ?? 'Unknown error';
          setExchangeState('error');
          setExchangeError(err);
          setStatus(`Failed: ${err}`);
        }
      }
    );
  };

  return (
    <div className="popup">
      {/* Header */}
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
                  onClick={() => {
                    const id = tabId!;
                    setStatus('Rescanning page…');
                    setRescanBusy(true);
                    chrome.tabs.sendMessage(id, { type: 'request-scan' } as ExtensionMessage, () => {
                      chrome.runtime.sendMessage({ type: 'get-detected', tabId: id } as ExtensionMessage, (resp) => {
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
                onClick={analyzeClipboard}
              >
                <img src={ClipboardIcon} alt="Analyze clipboard" className="icon" />
              </button>
              <div className="options">
                <button
                  className="btn-icon"
                  aria-label="More options"
                  title="More options"
                  onClick={() => setOptsOpen((v) => !v)}
                >
                  <img src={HamburgerIcon} alt="More options" className="icon" />
                </button>
                {optsOpen && (
                  <div className="menu">
                    <div className="menu-row">
                      <label className="select-all">
                        <input type="checkbox" checked={hideClaimed} onChange={(e) => setHideClaimed(e.target.checked)} />
                        <span>Hide claimed</span>
                      </label>
                    </div>
                    <div className="menu-row">
                      <button
                        className="menu-item"
                        onClick={() => {
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
                      >
                        Claim via VC-API
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="btn-icon avatar" aria-label="User menu" onClick={() => setMenuOpen((v) => !v)}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                <span aria-hidden>LC</span>
              )}
            </button>
            {menuOpen && (
              <div className="menu">
                <div className="menu-row">
                  <div className="menu-title">Signed in</div>
                  <div className="menu-did" title={authDid}>{authDid}</div>
                </div>
                <div className="menu-actions">
                  <button className="btn-secondary" onClick={copyDid}>Copy DID</button>
                  <button className="btn-secondary" onClick={onLogout} disabled={authLoading}>{authLoading ? 'Working…' : 'Logout'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
                      const anyVc = vc as any;
                      const title = getTitleFromVc(anyVc);
                      const issuer = getIssuerNameFromVc(anyVc);
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
                          <div className="category">
                            <button
                              className="btn-secondary btn-small"
                              onClick={() => setOfferOpenCatIdx(isOpen ? null : i)}
                            >
                              {getCategoryLabel(cat)}
                            </button>
                            {isOpen && (
                              <div className="category-menu">
                                {CATEGORY_OPTIONS.map(({ value, label }) => (
                                  <button
                                    key={value}
                                    className="menu-item"
                                    onClick={() => {
                                      const next = offerCategories.slice();
                                      next[i] = value;
                                      setOfferCategories(next);
                                      setOfferOpenCatIdx(null);
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
            {!(showExchange || exchangeState !== 'idle') && (candidates.length > 0 ? (
              <div className="state">
                <div className="inbox-list">
                  {(
                    hideClaimed
                      ? candidates.map((_, i) => i).filter((i) => !candidates[i]?.claimed)
                      : candidates.map((_, i) => i)
                   ).map((i) => {
                    const c = candidates[i];
                    const raw = c.raw as any;
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
                          <div className="category">
                            <button
                              className="btn-secondary btn-small"
                              onClick={() => setOpenCategoryIdx(isOpen ? null : i)}
                            >
                              {getCategoryLabel(cat)}
                            </button>
                            {isOpen && (
                              <div className="category-menu">
                                {CATEGORY_OPTIONS.map(({ value, label }) => (
                                  <button
                                    key={value}
                                    className="menu-item"
                                    onClick={() => {
                                      const next = categories.slice();
                                      next[i] = value;
                                      setCategories(next);
                                      setOpenCategoryIdx(null);
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
        {authDid && !(showExchange || exchangeState !== 'idle') && candidates.length > 0 ? (
          <>
            <label className="select-all">
              <input
                type="checkbox"
                checked={
                  candidates.filter((c) => !c.claimed).length > 0 &&
                  candidates.every((c, i) => (c.claimed ? true : !!selected[i]))
                }
                onChange={(e) => {
                  const all = e.target.checked;
                  setSelected(candidates.map((c) => (c.claimed ? false : all)));
                }}
              />
              <span>Select all</span>
            </label>
            <button className="btn-primary" onClick={onBulkSave} disabled={saving || !selected.some(Boolean)}>
              {saving ? 'Claiming…' : `Claim ${selected.filter(Boolean).length} Credential${selected.filter(Boolean).length === 1 ? '' : 's'}`}
            </button>
          </>
        ) : null}
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
