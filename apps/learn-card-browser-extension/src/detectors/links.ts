import type { CredentialCandidate } from '../types/messages';
import { getExtractorProtocols, extractExchangeUrlFromLink } from '../utils/links';
import { detectPlatformFromHostname } from '../utils/platform';

export const linksDetector = (): CredentialCandidate[] => {
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
      platform,
    });
  }

  return results;
};
