import { describe, expect, it } from 'vitest';

import { toSafeFrameUrl } from './frameUrl';

describe('toSafeFrameUrl', () => {
    it('keeps https addresses intact', () => {
        expect(toSafeFrameUrl('https://app.example.com/path?x=1#top')).toBe(
            'https://app.example.com/path?x=1#top'
        );
    });

    it('allows plain http only on localhost', () => {
        expect(toSafeFrameUrl('http://localhost:4321/?a=b')).toBe('http://localhost:4321/?a=b');
        expect(toSafeFrameUrl('http://127.0.0.1:5173/')).toBe('http://127.0.0.1:5173/');
        expect(toSafeFrameUrl('http://[::1]:3000/')).toBe('http://[::1]:3000/');
        expect(toSafeFrameUrl('http://example.com/')).toBeNull();
    });

    it('rejects script, data and other schemes, including localhost look-alikes', () => {
        expect(toSafeFrameUrl('javascript:alert(1)')).toBeNull();
        expect(toSafeFrameUrl('javascript://localhost/%0aalert(1)')).toBeNull();
        expect(toSafeFrameUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
        expect(toSafeFrameUrl('file:///etc/passwd')).toBeNull();
        expect(toSafeFrameUrl('blob:https://example.com/uuid')).toBeNull();
    });

    it('rejects empty, malformed and credential-bearing addresses', () => {
        expect(toSafeFrameUrl('')).toBeNull();
        expect(toSafeFrameUrl(undefined)).toBeNull();
        expect(toSafeFrameUrl('not a url')).toBeNull();
        expect(toSafeFrameUrl('https://user:pass@example.com/')).toBeNull();
    });
});
