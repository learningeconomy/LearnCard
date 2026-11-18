// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';

import { DEFERRED_FONT_STYLESHEETS, loadDeferredFontStylesheets } from './deferredFontStylesheets';

const links = () =>
    Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[data-deferred-font]'));
const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf8');

describe('loadDeferredFontStylesheets', () => {
    afterEach(() => links().forEach(link => link.remove()));

    it('adds each deferred stylesheet once, however often it is called', () => {
        loadDeferredFontStylesheets();
        loadDeferredFontStylesheets();

        expect(links().map(link => [link.rel, link.getAttribute('href')])).toEqual(
            Object.values(DEFERRED_FONT_STYLESHEETS).map(href => ['stylesheet', href])
        );
    });

    it('vendors every Fluent Emoji subset with the MIT notice', () => {
        const css = read('assets/fonts/fluent-emoji/FluentEmojiFlat.css');
        expect(css).toContain('MIT License');
        expect(css.match(/@font-face/g)).toHaveLength(129);
    });
});

describe('app stylesheet fonts', () => {
    it('has no render-blocking remote @import', () => {
        expect(read('index.scss')).not.toMatch(/@import\s+url\(\s*['"]?https?:/);
    });

    it('self-hosts Poppins with swap for every weight the UI uses, and every face file exists', () => {
        const css = read('assets/fonts/self-hosted/fonts.css');
        const faces = css.split('@font-face').slice(1);
        expect(faces.every(face => face.includes('font-display: swap;'))).toBe(true);

        const poppins = (style: string) =>
            faces
                .filter(f => f.includes("'Poppins'") && f.includes(`font-style: ${style};`))
                .map(f => Number(f.match(/font-weight: (\d+);/)?.[1]));
        expect(new Set(poppins('normal'))).toEqual(new Set([300, 400, 500, 600, 700, 800, 900]));
        expect(new Set(poppins('italic'))).toEqual(new Set([400, 500, 600, 700]));

        const files = new Set(readdirSync(resolve(__dirname, 'assets/fonts/self-hosted')));
        for (const [, file] of css.matchAll(/url\('\.\/([^']+)'\)/g))
            expect(files.has(file)).toBe(true);
        expect(files.has('LICENSE-poppins.txt')).toBe(true);
    });

    it('preloads only self-hosted faces the first screen renders', () => {
        const html = read('../index.template.html');
        const preloads = [...html.matchAll(/<link\b[^>]*>/g)]
            .map(m => m[0])
            .filter(tag => /\brel="preload"/.test(tag) && /\bas="font"/.test(tag))
            .map(tag => tag.match(/\bhref="([^"]+)"/)?.[1] ?? '');
        expect(preloads).toHaveLength(3);
        for (const href of preloads) {
            expect(href).toMatch(
                /^\/src\/assets\/fonts\/self-hosted\/poppins-latin-(400|500|700)-normal\.woff2$/
            );
            expect(read('assets/fonts/self-hosted/fonts.css')).toContain(href.split('/').pop());
        }
    });
});
