import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nativeBrowserCompatibility } from './nativeBrowserCompatibility';

describe('native browser compatibility', () => {
    it('sets the WebView floor and a static error page', () => {
        expect(nativeBrowserCompatibility()).toEqual({
            android: { minWebViewVersion: 111 },
            server: { errorPath: 'unsupported-browser.html' },
        });
    });

    it('preserves other tenant settings and a stricter browser floor', () => {
        expect(
            nativeBrowserCompatibility({
                android: { minWebViewVersion: 120, adjustMarginsForEdgeToEdge: 'force' },
                server: { hostname: 'tenant.example', errorPath: 'old.html' },
            })
        ).toEqual({
            android: { minWebViewVersion: 120, adjustMarginsForEdgeToEdge: 'force' },
            server: { hostname: 'tenant.example', errorPath: 'unsupported-browser.html' },
        });
        expect(nativeBrowserCompatibility({ android: { minWebViewVersion: 60 } }).android).toEqual({
            minWebViewVersion: 111,
        });
    });

    it('ships the same standalone fallback in both native app bundles', () => {
        const readPage = (app: string) =>
            readFileSync(resolve('../../apps', app, 'public/unsupported-browser.html'), 'utf8');
        const html = readPage('learn-card-app');
        expect(readPage('scouts')).toBe(html);
        expect(html).not.toMatch(/<script[^>]+src=|@import|<link[^>]+stylesheet/);
        expect(html).toContain('Update your browser and system software');
    });
});
