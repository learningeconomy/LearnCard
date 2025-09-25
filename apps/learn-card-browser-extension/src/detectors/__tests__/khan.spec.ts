// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { khanDetector } from '../khan';

// Force platform detection to khanacademy to avoid hostname fiddling in jsdom
vi.mock('../../utils/platform', () => ({
  detectPlatformFromHostname: () => 'khanacademy'
}));

beforeEach(() => {
  document.body.innerHTML = '';
  document.title = '';
});

describe('khanDetector', () => {
  it('returns empty when no completion text found', () => {
    document.title = 'Intro to HTML/CSS | Khan Academy';
    const out = khanDetector();
    expect(out.length).toBe(0);
  });

  it('detects completion moment and produces a platform candidate', () => {
    document.title = 'Unit test: Intro to HTML/CSS | Khan Academy';
    const h1 = document.createElement('h1');
    h1.textContent = 'Unit complete!';
    document.body.appendChild(h1);

    const out = khanDetector();
    expect(out.length).toBe(1);
    const c = out[0];
    expect(c.source).toBe('platform');
    expect(c.platform).toBe('khanacademy');
    expect(c.title?.toLowerCase()).toContain('completed');
    expect(typeof c.url).toBe('string');

    const raw = c.raw as Record<string, unknown>;
    expect(raw).toBeTruthy();
    expect(raw['platform']).toBe('khanacademy');
    expect(Array.isArray(raw['evidence'])).toBe(true);
  });
});
