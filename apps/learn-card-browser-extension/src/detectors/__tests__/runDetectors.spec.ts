// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { runDetectors } from '../index';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('runDetectors', () => {
  it('aggregates and de-dupes candidates from all detectors', () => {
    // One protocol link (with a duplicate), and two identical JSON-LD scripts
    document.body.innerHTML = `
      <a href="msprequest://request?vc_request_url=https%3A%2F%2Fissuer.example%2Fex%3Fa%3D1">Issue</a>
      <a href="msprequest://request?vc_request_url=https%3A%2F%2Fissuer.example%2Fex%3Fa%3D1">Duplicate</a>
      <script type="application/ld+json">{
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential"],
        "name": "LD VC"
      }</script>
      <script type="application/ld+json">{
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential"],
        "name": "LD VC"
      }</script>
    `;

    const out = runDetectors();

    // Expect 2 unique candidates: 1 link, 1 jsonld
    expect(out.length).toBe(2);
    const sources = out.map((c) => c.source).sort();
    expect(sources).toEqual(['jsonld', 'link']);

    const urls = out.map((c) => c.url).filter(Boolean);
    expect(urls).toContain('https://issuer.example/ex?a=1');
  });
});
