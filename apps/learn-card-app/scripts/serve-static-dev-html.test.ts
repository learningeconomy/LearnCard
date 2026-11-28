import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

import {
    STATIC_DEV_HTML_PAGES,
    staticDevHtmlFile,
    ensureReactRouterHmrPreamble,
    REACT_ROUTER_HMR_PREAMBLE_IMPORT,
} from './serve-static-dev-html';

describe('staticDevHtmlFile', () => {
    it('resolves only the allowlisted harness pages under the app root', () => {
        const root = mkdtempSync(join(tmpdir(), 'lc-static-html-'));
        for (const name of STATIC_DEV_HTML_PAGES)
            writeFileSync(join(root, name), '<!doctype html>');
        writeFileSync(join(root, 'secret.html'), '<!doctype html>');
        expect(staticDevHtmlFile(root, '/recovery-prompt-harness.html')).toBe(
            join(root, 'recovery-prompt-harness.html')
        );
        expect(staticDevHtmlFile(root, '/secret.html')).toBeUndefined();
        expect(
            staticDevHtmlFile(root, '/recovery-prompt-harness.html/../secret.html')
        ).toBeUndefined();
        expect(staticDevHtmlFile(root, '/%2e%2e/secret.html')).toBeUndefined();
        expect(staticDevHtmlFile(root, '/')).toBeUndefined();
    });
});

describe('ensureReactRouterHmrPreamble', () => {
    it('injects the React Router HMR runtime after <head> when missing', () => {
        const html = ensureReactRouterHmrPreamble(
            '<!doctype html><html><head><title>Dashboard recovery prompt harness</title></head><body></body></html>'
        );
        expect(html).toContain(`import "${REACT_ROUTER_HMR_PREAMBLE_IMPORT}"`);
        expect(html.indexOf(REACT_ROUTER_HMR_PREAMBLE_IMPORT)).toBeGreaterThan(
            html.indexOf('<head>')
        );
        expect(html.indexOf(REACT_ROUTER_HMR_PREAMBLE_IMPORT)).toBeLessThan(
            html.indexOf('</head>')
        );
    });

    it('does not duplicate the preamble when transform or a prior pass already added it', () => {
        const once = ensureReactRouterHmrPreamble('<head></head>');
        expect(ensureReactRouterHmrPreamble(once)).toBe(once);
    });
});
