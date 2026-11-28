import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

import { STATIC_DEV_HTML_PAGES, staticDevHtmlFile } from './serve-static-dev-html';

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
