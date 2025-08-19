import type { CredentialCandidate } from '../types/messages';
import { isVc, getTitleFromVc } from '../utils/vc';
import { detectPlatformFromHostname } from '../utils/platform';

export const jsonldDetector = (): CredentialCandidate[] => {
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
        platform,
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

    if (text.includes('"VerifiableCredential"') && text.includes('"credentialSubject"')) {
      try {
        const data = JSON.parse(text);
        addData(data);
      } catch {
        // ignore
      }
    }
  }

  return results;
};
