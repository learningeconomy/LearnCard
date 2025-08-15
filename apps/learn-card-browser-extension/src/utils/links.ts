// Link extraction utilities for VC-API exchange URLs
// Centralized to keep content/background logic consistent.

export type LinkExtractor = {
  protocols?: string[];
  hosts?: string[];
  paramKeys: string[];
};

export const LINK_EXTRACTORS: readonly LinkExtractor[] = [
  {
    // Examples: msprequest://request?vc_request_url=...
    //           dccrequest://request?vc_request_url=...
    // Note: includes https to allow vc_request_url or related params directly on https links
    protocols: ['msprequest', 'dccrequest', 'https', 'asuprequest'],
    paramKeys: ['vc_request_url', 'request_url', 'exchange_url', 'vc_url'],
  },
];

export const DEFAULT_PARAM_KEYS = ['vc_request_url', 'request_uri', 'exchange_url', 'vc_url'];

export const getExtractorProtocols = () =>
  Array.from(new Set(LINK_EXTRACTORS.flatMap((e) => e.protocols ?? [])));

export const extractExchangeUrlFromLink = (href: string): string | null => {
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
