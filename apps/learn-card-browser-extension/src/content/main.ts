import type { CredentialCandidate, ExtensionMessage } from '../types/messages';
import { extractExchangeUrlFromLink, getExtractorProtocols } from '../utils/links';
import { debounce, installLocationChangeHook } from '../utils/dom';
import { isVc, getTitleFromVc } from '../utils/vc';
import { detectPlatformFromHostname } from '../utils/platform';

// Minimal VC shape for type guard usage
type VerifiableCredential = {
  '@context': unknown[];
  type: string | string[];
  name?: string;
  [k: string]: unknown;
};

let lastSentKey: string | null = null;
let observer: MutationObserver | null = null;
let listenersAttached = false;

// link extraction helpers are now centralized in ../utils/links

const detectLinks = (): CredentialCandidate[] => {
  const protocols = getExtractorProtocols();
  if (protocols.length === 0) return [];
  const selector = protocols.map((p) => `a[href^="${p}:"]`).join(', ');
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));

  const seen = new Set<string>();
  const platform = detectPlatformFromHostname(location.hostname);

  const results: CredentialCandidate[] = [];
  for (const a of anchors) {
    const href = a.href;
    if (!href) continue;
    const extracted = extractExchangeUrlFromLink(href);
    // Only include if we could extract a usable HTTP(S) URL
    if (!extracted || !/^https?:\/\//i.test(extracted)) continue;
    if (seen.has(extracted)) continue;
    seen.add(extracted);
    results.push({
      source: 'link',
      url: extracted,
      title: a.textContent?.trim() || document.title,
      platform
    });
  }

  return results;
};

// VC helpers provided by ../utils/vc

const detectJsonLd = (): CredentialCandidate[] => {
  const platform = detectPlatformFromHostname(location.hostname);

  const results: CredentialCandidate[] = [];

  const addData = (data: unknown) => {
    if (Array.isArray(data)) {
      for (const item of data) addData(item);
      return;
    }
    if (isVc(data)) {
      results.push({
        source: 'jsonld',
        raw: data,
        title: getTitleFromVc(data),
        platform
      });
    }
  };

  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
  );

  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent || 'null');
      if (!data) continue;
      addData(data);
    } catch {}
  }

  const potentialScripts = Array.from(document.querySelectorAll('pre, code'));

  for (const s of potentialScripts) {
    const text = s.textContent;
    if (!text) continue;
    // Heuristic check: Does it contain key VC terms? This avoids trying to parse every code snippet.
    if (text.includes('"VerifiableCredential"') && text.includes('"credentialSubject"')) {
      try {
        const data = JSON.parse(text);
        addData(data);
      } catch (e) {
        /* Ignore elements with malformed JSON */
      }
    }
  }

  return results;
};

const runDetection = () => {
  const links = detectLinks();
  const jsonld = detectJsonLd();
  const map = new Map<string, CredentialCandidate>();

  const platform = detectPlatformFromHostname(location.hostname);

  const hash = (c: CredentialCandidate) => {
    if (c.url) return `url:${c.url}`;
    try {
      return `raw:${JSON.stringify(c.raw)}`;
    } catch {
      return `raw:${String(c.title ?? '')}:${platform}`;
    }
  };

  for (const c of [...links, ...jsonld]) {
    const key = hash(c);
    if (!map.has(key)) map.set(key, c);
  }

  const list = Array.from(map.values());
  const newKey = `${list.length}:${Array.from(map.keys()).sort().join('|')}`;
  if (newKey === lastSentKey) return;
  lastSentKey = newKey;

  chrome.runtime.sendMessage({ type: 'credentials-detected', payload: list });
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
