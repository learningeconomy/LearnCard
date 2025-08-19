export type { Detector } from './types';

export * from './links';
export * from './jsonld';

import type { CredentialCandidate } from '../types/messages';
import { linksDetector } from './links';
import { jsonldDetector } from './jsonld';

// Run all registered detectors and return a de-duplicated list
export const runDetectors = (): CredentialCandidate[] => {
  const all: CredentialCandidate[] = [];

  // Order matters only for presentation; detection is deduped below
  all.push(...linksDetector());
  all.push(...jsonldDetector());

  // De-dupe by URL or raw JSON value
  const map = new Map<string, CredentialCandidate>();

  const keyFor = (c: CredentialCandidate) => {
    if (c.url) return `url:${c.url}`;
    try {
      return `raw:${JSON.stringify(c.raw)}`;
    } catch {
      return `raw:${String(c.title ?? '')}`;
    }
  };

  for (const c of all) {
    const k = keyFor(c);
    if (!map.has(k)) map.set(k, c);
  }

  return Array.from(map.values());
};
