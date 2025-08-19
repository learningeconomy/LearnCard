// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { jsonldDetector } from '../jsonld';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('jsonldDetector', () => {
  it('detects VC from <script type="application/ld+json">', () => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      name: 'LD VC'
    });
    document.body.appendChild(script);

    const out = jsonldDetector();
    expect(out.length).toBe(1);
    expect(out[0].source).toBe('jsonld');
    expect(out[0].title).toBe('LD VC');
    expect(out[0].raw).toBeTruthy();
  });

  it('detects VC from pre/code heuristic JSON', () => {
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: { name: 'Alice' },
      name: 'Code VC'
    });
    document.body.appendChild(pre);

    const out = jsonldDetector();
    expect(out.length).toBe(1);
    expect(out[0].title).toBe('Code VC');
  });
});
