import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { CredentialCandidate, ExtensionMessage } from '../types/messages';

const App = () => {
  const [tabId, setTabId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CredentialCandidate[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authDid, setAuthDid] = useState<string | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs?.[0]?.id ?? null;
      setTabId(id ?? null);
      chrome.runtime.sendMessage({ type: 'get-detected', tabId: id ?? undefined } as ExtensionMessage, async (resp) => {
        const list = resp?.ok && Array.isArray(resp.data) ? (resp.data as CredentialCandidate[]) : [];
        setCandidates(list);
        // If nothing found, ask the content script in this tab to rescan
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
      }
    });
  }, []);

  const isVc = (data: unknown): data is { '@context': unknown[]; type: string | string[]; name?: string } => {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    const ctx = obj['@context'];
    const type = obj['type'];
    return Array.isArray(ctx) && (Array.isArray(type) || typeof type === 'string');
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

  const analyzeClipboard = async () => {
    setStatus(null);
    try {
      const text = await navigator.clipboard.readText();
      let found: CredentialCandidate[] = [];

      // Try parse as a whole
      try {
        const parsed = JSON.parse(text);
        const add = (val: unknown) => {
          if (Array.isArray(val)) {
            val.forEach(add);
            return;
          }
          if (isVc(val)) {
            found.push({ source: 'jsonld', raw: val, title: (val as any).name ?? 'Clipboard VC', platform: 'unknown' });
          }
        };
        add(parsed);
      } catch {
        // ignore parse failure, fall through
      }

      // If nothing found and text contains JSON-like block, attempt a naive extraction between first '{' and last '}'
      if (found.length === 0) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const snippet = text.slice(start, end + 1);
          try {
            const parsed = JSON.parse(snippet);
            if (isVc(parsed)) {
              found.push({ source: 'jsonld', raw: parsed, title: (parsed as any).name ?? 'Clipboard VC', platform: 'unknown' });
            }
          } catch {
            // ignore
          }
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
    chrome.runtime.sendMessage({ type: 'save-credential', tabId: tabId ?? undefined } as ExtensionMessage, (resp) => {
      setSaving(false);
      if (resp?.ok) {
        setStatus('Saved to LearnCard');
        // Optimistically clear first item
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
      } else {
        setStatus(`Login failed: ${resp?.error ?? 'Unknown error'}`);
      }
    });
  };

  const onLogout = () => {
    setAuthLoading(true);
    chrome.runtime.sendMessage({ type: 'logout' } as ExtensionMessage, (resp) => {
      setAuthLoading(false);
      if (resp?.ok) {
        setAuthDid(null);
        setStatus('Logged out');
      } else {
        setStatus(`Logout failed: ${resp?.error ?? 'Unknown error'}`);
      }
    });
  };

  return (
    <div style={{ minWidth: 320, minHeight: 160, padding: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h3 style={{ marginTop: 0 }}>LearnCard</h3>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {authDid ? (
          <>
            <span title={authDid} style={{ fontSize: 12, color: '#333' }}>
              Logged in as
              <br />
              <code style={{ fontSize: 11 }}>{authDid}</code>
            </span>
            <button onClick={onLogout} disabled={authLoading} style={{ padding: '6px 10px', cursor: 'pointer' }}>
              {authLoading ? 'Working…' : 'Logout'}
            </button>
          </>
        ) : (
          <button onClick={onLogin} disabled={authLoading} style={{ padding: '6px 10px', cursor: 'pointer' }}>
            {authLoading ? 'Opening…' : 'Login'}
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={analyzeClipboard} style={{ padding: '6px 10px', cursor: 'pointer' }}>
          Analyze clipboard for a credential
        </button>
        {tabId !== null && (
          <button
            onClick={() => {
              chrome.tabs.sendMessage(tabId!, { type: 'request-scan' } as ExtensionMessage, () => {
                chrome.runtime.sendMessage({ type: 'get-detected', tabId: tabId ?? undefined } as ExtensionMessage, (resp) => {
                  if (resp?.ok) setCandidates(Array.isArray(resp.data) ? resp.data : []);
                });
              });
            }}
            style={{ padding: '6px 10px', cursor: 'pointer' }}
          >
            Rescan this page
          </button>
        )}
      </div>
      {candidates.length > 0 ? (
        <div>
          <p style={{ margin: '8px 0' }}>
            <strong>{candidates.length} Credential{candidates.length === 1 ? '' : 's'} Found:</strong>
            <br />
            {candidates[0]?.title ?? candidates[0]?.url ?? 'Unknown'}
          </p>
          <button onClick={onSave} disabled={saving} style={{ padding: '8px 12px', cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Add First to LearnCard'}
          </button>
          {status && <p style={{ color: status.startsWith('Saved') ? 'green' : 'crimson' }}>{status}</p>}
        </div>
      ) : (
        <>
        <p>No credentials detected on this page.</p>
        {status && <p style={{ color: status.startsWith('No credential') ? 'crimson' : 'inherit' }}>{status}</p>}
        </>
      )}
    </div>
  );
};

const container = document.getElementById('root')!;
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
