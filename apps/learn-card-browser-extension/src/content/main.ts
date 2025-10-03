import type { CredentialCandidate, ExtensionMessage } from '../types/messages';
import { sendMessage } from '../messaging/client';
import { debounce, installLocationChangeHook } from '../utils/dom';
import { detectPlatformFromHostname } from '../utils/platform';
import { runDetectors } from '../detectors';

// Detection is now delegated to modular detectors in ../detectors

let lastSentKey: string | null = null;
let observer: MutationObserver | null = null;
let listenersAttached = false;

// link extraction handled by detectors

// json-ld handled by detectors

const runDetection = () => {
  const detected = runDetectors();

  const platform = detectPlatformFromHostname(location.hostname);
  const keyFor = (c: CredentialCandidate) => {
    if (c.url) return `url:${c.url}`;
    try {
      return `raw:${JSON.stringify(c.raw)}`;
    } catch {
      return `raw:${String(c.title ?? '')}:${platform}`;
    }
  };

  const keys = detected.map(keyFor).sort();
  const newKey = `${detected.length}:${keys.join('|')}`;
  if (newKey === lastSentKey) return;
  lastSentKey = newKey;

  sendMessage({ type: 'credentials-detected', payload: detected });
};

const startObserving = () => {
  if (!observer) {
    const debounced = debounce(runDetection, 200);
    observer = new MutationObserver(() => {
      debounced();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href']
    });
  }

  if (!listenersAttached) {
    installLocationChangeHook();
    const resetAndScan = () => {
      lastSentKey = null;
      if (!observer) startObserving();
      runDetection();
    };
    // React to SPA route changes
    window.addEventListener('hashchange', resetAndScan);
    window.addEventListener('locationchange', resetAndScan);
    // When tab becomes visible again, try a scan
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') runDetection();
    });
    // Allow background/popup to request a re-scan
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      if (message?.type === 'request-scan') {
        try {
          runDetection();
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: (e as Error).message });
        }
        return true;
      }
    });
    listenersAttached = true;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    runDetection();
    startObserving();
  });
} else {
  runDetection();
  startObserving();
}
