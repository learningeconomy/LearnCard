import type {
  CredentialCandidate,
  ExtensionMessage,
  GetDetectedMessage,
  SaveCredentialMessage,
  CredentialsDetectedMessage
} from '../types/messages';

// Track detections per tab so we can show per-tab badge counts
const detectedByTab: Record<number, CredentialCandidate[]> = {};

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
          // const learnCard = await initLearnCard({ network: true });
          // const uri = await learnCard.store.uploadEncrypted?.(detected);
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
  }
});
