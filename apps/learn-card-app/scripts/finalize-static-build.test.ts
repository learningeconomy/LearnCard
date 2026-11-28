/**
 * Run with: bun test scripts/finalize-static-build.test.ts (cwd: apps/learn-card-app).
 * Not under src/, so it's outside vitest.config.ts's `include` — uses Bun's runner.
 */
import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    existsSync,
    readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'bun:test';

import { CHUNK_PREFETCH_LIST_FILE, finalizeStaticBuild } from './finalize-static-build';

const page = '<html><head><title>LC</title></head><body></body></html>';

const fixture = (files: Record<string, string>): string => {
    const build = mkdtempSync(join(tmpdir(), 'lc-finalize-'));
    for (const [name, contents] of Object.entries(files)) {
        mkdirSync(dirname(join(build, name)), { recursive: true });
        writeFileSync(join(build, name), contents);
    }
    return build;
};

const site = (extra: Record<string, string> = {}) =>
    fixture({
        'client/index.html': page,
        'client/login/index.html': page,
        'client/assets/entry.js': '',
        [`client/${CHUNK_PREFETCH_LIST_FILE}`]: JSON.stringify({
            'my-learncard': ['/assets/m.js'],
        }),
        'stats-from-last-build.html': 'stale',
        ...extra,
    });

describe('finalizeStaticBuild', () => {
    it('flattens build/client into build/ and writes the prefetch list into every page', async () => {
        const build = site();
        await expect(finalizeStaticBuild(build, ['/login'])).resolves.toEqual({
            html: ['/', '/login'],
        });
        expect(readdirSync(build).sort()).toEqual(['assets', 'index.html', 'login']);
        for (const file of ['index.html', 'login/index.html']) {
            expect(readFileSync(join(build, file), 'utf8')).toContain(
                '<script type="application/json" id="lc-chunk-prefetch">{"my-learncard":["/assets/m.js"]}</script></head>'
            );
        }
    });

    it.each([
        'client/s/abc/index.html',
        'client/share-boost/index.html',
        'client/verify/resume.html',
    ])('fails when %s is emitted', async file => {
        const build = site({ [file]: page });
        await expect(finalizeStaticBuild(build, ['/login'])).rejects.toThrow(/private paths/);
        expect(existsSync(join(build, 'client'))).toBe(true);
    });

    it('fails when a configured prerender path is missing', async () => {
        await expect(finalizeStaticBuild(site(), ['/login', '/legal/terms'])).rejects.toThrow(
            /missing prerendered HTML: \/legal\/terms/
        );
    });
});
