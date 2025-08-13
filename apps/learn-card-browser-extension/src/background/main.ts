import type {
  CredentialCandidate,
  ExtensionMessage,
  GetDetectedMessage,
  SaveCredentialMessage,
  CredentialsDetectedMessage,
} from '../types/messages';

// Track detections per tab so we can show per-tab badge counts
const detectedByTab: Record<number, CredentialCandidate[]> = {};

// Offscreen helper to initialize LearnCard in a document context
const runInitInOffscreen = async (seed: string): Promise<string | undefined> => {
  // Ensure an offscreen document exists (best-effort)
  try {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen.html',
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Initialize DIDKit (WASM) in a document context.'
    });
  } catch {
    // If it already exists, ignore
  }

  // Send message to offscreen page and await result
  const result = await chrome.runtime.sendMessage({
    type: 'start-learncard-init',
    target: 'offscreen',
    data: { seed }
  });

  // Best-effort close to save resources
  try {
    chrome.offscreen?.closeDocument?.();
  } catch {
    // ignore
  }

  if (result?.ok) return result.did as string | undefined;
  throw new Error(result?.error ?? 'Offscreen init failed');
};


// Removed direct LearnCard initialization in service worker.

const parseParams = (url: string): Record<string, string> => {
  try {
    const u = new URL(url);
    const out: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (out[k] = v));
    if (u.hash && u.hash.length > 1) {
      const hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash;
      new URLSearchParams(hash).forEach((v, k) => (out[k] = v));
    }
    return out;
  } catch {
    return {};
  }
};

const dedupeCandidates = (list: CredentialCandidate[]): CredentialCandidate[] => {
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

const storageGet = <T = unknown>(defaults: Record<string, unknown>): Promise<T> =>
  new Promise((resolve) => {
    chrome.storage.local.get(defaults, (items) => resolve(items as unknown as T));
  });

const storageSet = (items: Record<string, unknown>): Promise<void> =>
  new Promise((resolve) => {
    chrome.storage.local.set(items, () => resolve());
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
});

chrome.runtime.onStartup.addListener(() => {
  (async () => {
    try {
      const { authSeed = null, authDid = null } = await storageGet<{
        authSeed: string | null;
        authDid: string | null;
      }>({ authSeed: null, authDid: null });
      // if (authSeed) {
      //   const lc = await ensureLearnCard(authSeed);
      //   const did = lc.id.did();
      //   if (!authDid) await storageSet({ authDid: did });
      // }
    } catch (err) {
      // non-fatal
      console.warn('Failed to init LearnCard on startup', err);
    }
  })();
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'credential-detected': {
      const tabId = _sender.tab?.id;
      if (typeof tabId === 'number') {
        detectedByTab[tabId] = [message.payload];
        chrome.action.setBadgeText({ text: '1', tabId });
      } else {
        // Fallback if no tabId
        detectedByTab[-1] = [message.payload];
        chrome.action.setBadgeText({ text: '1' });
      }
      sendResponse({ ok: true });
      return; // synchronous
    }
    case 'credentials-detected': {
      const msg = message as CredentialsDetectedMessage;
      const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
      const list = msg.payload ?? [];
      const shouldMerge = typeof msg.tabId === 'number'; // Merge when explicitly sent from popup
      const existing = detectedByTab[tabId] ?? [];
      const next = shouldMerge ? dedupeCandidates([...existing, ...list]) : list;
      detectedByTab[tabId] = next;
      if (typeof tabId === 'number') {
        chrome.action.setBadgeText({ text: next.length ? String(next.length) : '', tabId });
      } else {
        chrome.action.setBadgeText({ text: next.length ? String(next.length) : '' });
      }
      sendResponse({ ok: true });
      return; // synchronous
    }
    case 'get-detected': {
      const msg = message as GetDetectedMessage;
      const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
      const data = detectedByTab[tabId] ?? [];
      sendResponse({ ok: true, data });
      return;
    }
    case 'save-credential': {
      (async () => {
        try {
          // TODO: Replace this stub with LearnCard SDK based persistence
          const msg = message as SaveCredentialMessage;
          const tabId = (typeof msg.tabId === 'number' ? msg.tabId : _sender.tab?.id) ?? -1;
          const toSave = (detectedByTab[tabId] ?? [])[0] ?? null;
          const { savedCredentials } = await storageGet<{ savedCredentials: unknown[] }>({
            savedCredentials: []
          });
          const next = toSave
            ? [...savedCredentials, { ...toSave, savedAt: Date.now() }]
            : savedCredentials;
          await storageSet({ savedCredentials: next });

          // Remove the first item only and update badge count
          const current = detectedByTab[tabId] ?? [];
          const remaining = current.slice(1);
          detectedByTab[tabId] = remaining;
          const badgeText = remaining.length ? String(remaining.length) : '';
          if (typeof tabId === 'number' && _sender.tab?.id === tabId) {
            chrome.action.setBadgeText({ text: badgeText, tabId });
          } else {
            chrome.action.setBadgeText({ text: badgeText });
          }
          sendResponse({ ok: true });
        } catch (err) {
          console.error('Failed to save credential', err);
          sendResponse({ ok: false, error: (err as Error).message });
        }
      })();
      return true; // keep channel open for async
    }
    case 'get-auth-status': {
      (async () => {
        const { authSeed = null, authDid = null } = await storageGet<{
          authSeed: string | null;
          authDid: string | null;
        }>({ authSeed: null, authDid: null });
        sendResponse({ ok: true, data: { loggedIn: Boolean(authSeed), did: authDid || null } });
      })();
      return true;
    }
    case 'start-auth': {
      (async () => {
        try {
          console.log('Starting auth flow');
          const redirectUri = chrome.identity.getRedirectURL('learncard');
          const loginBase = 'http://localhost:3000/login';
          const loginUrl = `${loginBase}?extRedirectUri=${encodeURIComponent(redirectUri)}`;

          chrome.identity.launchWebAuthFlow(
            { url: loginUrl, interactive: true },
            async (responseUrl) => {
              if (chrome.runtime.lastError) {
                sendResponse({ ok: false, error: chrome.runtime.lastError.message });
                return;
              }
              if (!responseUrl) {
                sendResponse({ ok: false, error: 'No response URL from auth flow' });
                return;
              }
              const params = parseParams(responseUrl);
              const seed = params['seed'];
              if (!seed) {
                sendResponse({ ok: false, error: 'No seed found in redirect URL' });
                return;
              }

              try {
                await storageSet({ authSeed: seed });
                const did = await runInitInOffscreen(seed);
                await storageSet({ authDid: did });
                sendResponse({ ok: true, data: { did } });
              } catch (e) {
                sendResponse({ ok: false, error: (e as Error).message });
              }
            }
          );
        } catch (e) {
          sendResponse({ ok: false, error: (e as Error).message });
        }
      })();
      return true; // keep channel open
    }
    case 'logout': {
      (async () => {
        await storageSet({ authSeed: null, authDid: null });
        sendResponse({ ok: true });
      })();
      return true;
    }
  }
});
