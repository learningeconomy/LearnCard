import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  CredentialCandidate,
  ExtensionMessage,
  CredentialCategory,
  SaveCredentialsMessage,
} from '../types/messages';

const App = () => {
  const [tabId, setTabId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CredentialCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDid, setAuthDid] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optsOpen, setOptsOpen] = useState(false);
  // Inbox UI state
  const [selected, setSelected] = useState<boolean[]>([]);
  const [categories, setCategories] = useState<CredentialCategory[]>([]);
  const [openCategoryIdx, setOpenCategoryIdx] = useState<number | null>(null);
  const [hideClaimed, setHideClaimed] = useState(false);

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
      if (resp?.ok && resp.data) setAuthDid(resp.data.did ?? null);
    });
  }, []);

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
      const next = candidates.map((c, i) => (c.claimed ? false : (typeof prev[i] === 'boolean' ? prev[i] : true)));
      return next;
    });
    setCategories((prev) => {
      const next = candidates.map((_, i) => (prev[i] ? prev[i] : 'Achievement'));
      return next as CredentialCategory[];
    });
  }, [candidates]);

  const analyzeClipboard = async () => {
    setStatus(null);
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
                  className="btn-icon"
                  aria-label="Rescan page"
                  title="Rescan page"
                  onClick={() => {
                    const id = tabId!;
                    chrome.tabs.sendMessage(id, { type: 'request-scan' } as ExtensionMessage, () => {
                      chrome.runtime.sendMessage({ type: 'get-detected', tabId: id } as ExtensionMessage, (resp) => {
                        if (resp?.ok) setCandidates(Array.isArray(resp.data) ? resp.data : []);
                      });
                    });
                  }}
                >
                  <span aria-hidden>🔄</span>
                </button>
              )}
              <button
                className="btn-icon"
                aria-label="Analyze clipboard"
                title="Analyze clipboard"
                onClick={analyzeClipboard}
              >
                <span aria-hidden>📋</span>
              </button>
              <div className="options">
                <button
                  className="btn-icon"
                  aria-label="More options"
                  title="More options"
                  onClick={() => setOptsOpen((v) => !v)}
                >
                  <span aria-hidden>⋮</span>
                </button>
                {optsOpen && (
                  <div className="menu">
                    <div className="menu-row">
                      <label className="select-all">
                        <input type="checkbox" checked={hideClaimed} onChange={(e) => setHideClaimed(e.target.checked)} />
                        <span>Hide claimed</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="btn-icon avatar" aria-label="User menu" onClick={() => setMenuOpen((v) => !v)}>
              <span>LC</span>
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
        ) : candidates.length > 0 ? (
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
                          {cat || 'Set Category'}
                        </button>
                        {isOpen && (
                          <div className="category-menu">
                            {['Achievement','Skill','ID','Learning History','Work History','Social Badge','Membership','Course','Accomplishment','Accommodation'].map((opt) => (
                              <button
                                key={opt}
                                className="menu-item"
                                onClick={() => {
                                  const next = categories.slice();
                                  next[i] = opt as CredentialCategory;
                                  setCategories(next);
                                  setOpenCategoryIdx(null);
                                }}
                              >
                                {opt}
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
            {status && <div className={`status ${status.startsWith('Saved') ? 'ok' : status.startsWith('No credential') ? 'warn' : ''}`}>{status}</div>}
          </div>
        ) : (
          <div className="state">
            <h2 className="heading">No credentials found</h2>
            <p className="subtext">The extension is active. Try rescanning the page or analyzing your clipboard.</p>
          </div>
        )}
      </div>

      {/* Footer / Action bar */}
      <div className="footer">
        {authDid && candidates.length > 0 ? (
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
        ) : (
          <>
            <button className="btn-secondary" onClick={analyzeClipboard}>Analyze clipboard</button>
            {tabId !== null && (
              <button
                className="btn-secondary"
                onClick={() => {
                  chrome.tabs.sendMessage(tabId!, { type: 'request-scan' } as ExtensionMessage, () => {
                    chrome.runtime.sendMessage({ type: 'get-detected', tabId: tabId ?? undefined } as ExtensionMessage, (resp) => {
                      if (resp?.ok) setCandidates(Array.isArray(resp.data) ? resp.data : []);
                    });
                  });
                }}
              >
                Rescan this page
              </button>
            )}
          </>
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
