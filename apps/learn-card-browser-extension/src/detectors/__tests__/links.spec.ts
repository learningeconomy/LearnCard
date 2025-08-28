// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { linksDetector } from '../links';

// Ensure a clean DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
});

describe('linksDetector', () => {
  it('extracts normalized HTTPS exchange URLs from protocol links and https anchors and de-dupes', () => {
    document.body.innerHTML = `
      <a id="a1" href="msprequest://request?vc_request_url=https%3A%2F%2Fissuer.example%2Fex%3Fa%3D1">MSP</a>
      <a id="a2" href="dccrequest://request?vc_request_url=https://issuer.example/basic1">DCC</a>
      <a id="a3" href="https://issuer.example/ex?vc_request_url=https%3A%2F%2Fissuer.example%2Fbasic2">HTTPS Param</a>
      <a id="a4" href="msprequest://request?vc_request_url=https%3A%2F%2Fissuer.example%2Fex%3Fa%3D1">Duplicate</a>
    `;

    const out = linksDetector();

    // Expect 3 unique URLs
    expect(out.length).toBe(3);
    expect(out.every((c) => c.source === 'link')).toBe(true);

    const urls = out.map((c) => c.url);
    expect(urls).toContain('https://issuer.example/ex?a=1');
    expect(urls).toContain('https://issuer.example/basic1');
    expect(urls).toContain('https://issuer.example/basic2');

    // Ensure de-dupe worked for the duplicate
    const countEx = urls.filter((u) => u === 'https://issuer.example/ex?a=1').length;
    expect(countEx).toBe(1);
  });
});
