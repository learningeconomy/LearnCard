import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { CredentialCandidate, ExtensionMessage, CredentialCategory, SaveCredentialMessage } from '../types/messages';

const App = () => {
  const [tabId, setTabId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CredentialCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDid, setAuthDid] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<CredentialCategory>('Achievement');

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

  const first = candidates[0] as CredentialCandidate | undefined;
  const firstTitle = useMemo(() => {
    if (!first) return '';
    if (first.title) return first.title;
    if (first.raw && typeof first.raw === 'object' && (first.raw as any).name) return getTitleFromVc(first.raw);
    if (first.url) return first.url;
    return 'Credential';
  }, [first]);

  const issuerName = useMemo(() => {
    if (!first?.raw || typeof first.raw !== 'object') return '';
    const raw = first.raw as any;
    return getIssuerNameFromVc(raw);
  }, [first]);

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
      setCandidates(merged);
      chrome.runtime.sendMessage({ type: 'credentials-detected', payload: merged, tabId: tabId ?? undefined } as ExtensionMessage, (resp) => {
        if (resp?.ok) setStatus(`Found ${found.length} credential${found.length === 1 ? '' : 's'} from clipboard`);
        else setStatus(`Failed to update detections`);
      });
    } catch (e) {
      setStatus('Clipboard read failed. Grant clipboard permission and try again.');
    }
  };

  const onSave = () => {
    setSaving(true);
    const msg: SaveCredentialMessage = { type: 'save-credential', tabId: tabId ?? undefined, category };
    chrome.runtime.sendMessage(msg as unknown as ExtensionMessage, (resp) => {
      setSaving(false);
      if (resp?.ok) {
        setStatus('Saved to LearnCard');
        setCandidates((prev) => prev.slice(1));
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
            <div className="card">
              <div className="card-icon" aria-hidden>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7z" />
                </svg>
              </div>
              <div className="card-body">
                <p className="credential-title">{firstTitle}</p>
                <p className="credential-issuer">{issuerName ? `by ${issuerName}` : first?.platform ? `from ${first.platform}` : ''}</p>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="category">Save as</label>
              <select
                id="category"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value as CredentialCategory)}
              >
                <option value="Achievement">Achievement</option>
                <option value="Skill">Skill</option>
                <option value="ID">ID</option>
                <option value="Learning History">Learning History</option>
                <option value="Work History">Work History</option>
                <option value="Social Badge">Social Badge</option>
                <option value="Membership">Membership</option>
                <option value="Course">Course</option>
                <option value="Accomplishment">Accomplishment</option>
                <option value="Accommodation">Accommodation</option>
              </select>
            </div>
            <button className="btn-primary" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Add to LearnCard'}
            </button>
            <div className="hint">{candidates.length > 1 ? `${candidates.length - 1} more detected` : ''}</div>
          </div>
        ) : (
          <div className="state">
            <h2 className="heading">No credentials found</h2>
            <p className="subtext">The extension is active. Try rescanning the page or analyzing your clipboard.</p>
          </div>
        )}

        {status && <div className={`status ${status.startsWith('Saved') ? 'ok' : status.startsWith('No credential') ? 'warn' : ''}`}>{status}</div>}
      </div>

      {/* Footer */}
      <div className="footer">
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
