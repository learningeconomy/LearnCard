// @vitest-environment jsdom
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import fluentEmojiCssUrl from './assets/fonts/fluent-emoji/FluentEmojiFlat.css?url';
import { loadFluentEmojiFont } from './fluentEmojiFont';

const links = () => Array.from(document.head.querySelectorAll('link[data-fluent-emoji-font]'));

describe('loadFluentEmojiFont', () => {
    afterEach(() => links().forEach(link => link.remove()));

    it('adds one stylesheet link for the vendored font CSS, however often it is called', () => {
        loadFluentEmojiFont();
        loadFluentEmojiFont();

        expect(links()).toHaveLength(1);
        const [link] = links() as HTMLLinkElement[];
        expect(link.rel).toBe('stylesheet');
        // Vitest stubs CSS ?url imports; the production build test covers the emitted asset name.
        expect(link.getAttribute('href')).toBe(fluentEmojiCssUrl);
    });

    it('is no longer a render-blocking @import in the app stylesheet', () => {
        const scss = readFileSync(resolve(__dirname, 'index.scss'), 'utf8');
        expect(scss).not.toContain('fluent-emoji-webfont');
    });

    it('vendors every upstream subset with the MIT notice', () => {
        const css = readFileSync(
            resolve(__dirname, 'assets/fonts/fluent-emoji/FluentEmojiFlat.css'),
            'utf8'
        );
        expect(css).toContain('MIT License');
        expect(css.match(/@font-face/g)).toHaveLength(129);
        expect(css).toContain("font-family: 'Fluent Emoji Flat'");
    });
});
