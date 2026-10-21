import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from './sanitizeNextPath';

describe('sanitizeNextPath', () => {
    it('keeps same-app paths, including query strings', () => {
        expect(sanitizeNextPath('/wallet')).toBe('/wallet');
        expect(sanitizeNextPath('/app-store/developer?template=lc%3Ax')).toBe(
            '/app-store/developer?template=lc%3Ax'
        );
    });

    it('rejects anything that could leave the app', () => {
        for (const bad of [
            null,
            '',
            'https://evil.example/',
            '//evil.example/wallet',
            '/\\evil.example',
            'javascript:alert(1)',
            'wallet',
        ])
            expect(sanitizeNextPath(bad)).toBe('/wallet');
    });
});
