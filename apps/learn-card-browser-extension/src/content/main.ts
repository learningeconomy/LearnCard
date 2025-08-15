import type { CredentialCandidate, ExtensionMessage } from '../types/messages';

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
let locHookInstalled = false;

// Configurable extractors for custom-scheme credential request links
// Each entry can specify protocols (schemes) and parameter keys to try for the actual HTTP(S) URL.
// Extendable to hosts in the future if needed.
type LinkExtractor = {
  protocols?: string[];
  hosts?: string[];
  paramKeys: string[];
};

const LINK_EXTRACTORS: readonly LinkExtractor[] = [
  {
    // Examples: msprequest://request?vc_request_url=...
    //           dccrequest://request?vc_request_url=...
    protocols: ['msprequest', 'dccrequest', 'https', 'asuprequest'],
    paramKeys: ['vc_request_url', 'request_url', 'exchange_url', 'vc_url']
  }
];

const DEFAULT_PARAM_KEYS = ['vc_request_url', 'request_uri', 'exchange_url', 'vc_url'];

const getExtractorProtocols = () =>
  Array.from(new Set(LINK_EXTRACTORS.flatMap((e) => e.protocols ?? [])));

const extractExchangeUrlFromLink = (href: string): string | null => {
  try {
    const u = new URL(href);
    const proto = u.protocol.replace(':', '');
    const host = u.hostname;
    const extractor = LINK_EXTRACTORS.find(
      (e) => (e.protocols && e.protocols.includes(proto)) || (e.hosts && e.hosts.includes(host))
    );
    const keys = Array.from(new Set([...(extractor?.paramKeys ?? []), ...DEFAULT_PARAM_KEYS]));
    for (const k of keys) {
      const val = u.searchParams.get(k);
      if (val) {
        try {
          const dec = decodeURIComponent(val);
          return dec;
        } catch {
          return val;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

const debounce = (fn: () => void, wait = 200) => {
  let t: number | undefined;
  return () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(fn, wait);
  };
};

const installLocationChangeHook = () => {
  if (locHookInstalled) return;
  const pushState = history.pushState;
  history.pushState = function (this: History, ...args) {
    const ret = pushState.apply(this, args as unknown as any);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  } as typeof history.pushState;

  const replaceState = history.replaceState;
  history.replaceState = function (this: History, ...args) {
    const ret = replaceState.apply(this, args as unknown as any);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  } as typeof history.replaceState;

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
  });
  locHookInstalled = true;
};

const detectLinks = (): CredentialCandidate[] => {
  const protocols = getExtractorProtocols();
  if (protocols.length === 0) return [];
  const selector = protocols.map((p) => `a[href^="${p}:"]`).join(', ');
  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));

  const seen = new Set<string>();
  const platform = /credly\.com/.test(location.hostname)
    ? 'credly'
    : /coursera\.org/.test(location.hostname)
    ? 'coursera'
    : 'unknown';

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

const isVc = (data: unknown): data is VerifiableCredential => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  const ctx = obj['@context'];
  const type = obj['type'];
  const ctxOk = Array.isArray(ctx) || typeof ctx === 'string';
  const typeOk = Array.isArray(type) || typeof type === 'string';
  return ctxOk && typeOk;
};

const getTitleFromVc = (vc: VerifiableCredential) => {
  if (vc?.boostCredential) {
    return vc.boostCredential?.name || vc.boostCredential?.credentialSubject?.name || 'Credential';
  } else {
    return vc.name || vc.credentialSubject?.name || 'Credential';
  }
};

const detectJsonLd = (): CredentialCandidate[] => {
  const platform = /credly\.com/.test(location.hostname)
    ? 'credly'
    : /coursera\.org/.test(location.hostname)
    ? 'coursera'
    : 'unknown';

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

  const platform = /credly\.com/.test(location.hostname)
    ? 'credly'
    : /coursera\.org/.test(location.hostname)
    ? 'coursera'
    : 'unknown';

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
