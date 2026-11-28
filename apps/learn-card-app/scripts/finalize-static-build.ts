import { existsSync } from 'node:fs';
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

import {
    chunkPrefetchElementHtml,
    type PrefetchChunkList,
} from '../src/buildPlugins/chunkPrefetchList';
import { isNeverPrerendered } from '../src/routing/prerender';

/** Written into the client build by the chunk-prefetch plugin; consumed and removed here. */
export const CHUNK_PREFETCH_LIST_FILE = '.lc-chunk-prefetch.json';

/** HTML pages, and React Router's prerendered route data (`<path>.data`), which hosts cache too. */
const staticFiles = async (directory: string): Promise<string[]> => {
    const entries = await readdir(directory, { withFileTypes: true, recursive: true });
    return entries
        .filter(entry => entry.isFile() && /\.(?:html|data)$/.test(entry.name))
        .map(entry => join(entry.parentPath, entry.name));
};

/** URL path a static file answers: `login/index.html` → `/login`, `s/abc.data` → `/s/abc`. */
const pathFor = (root: string, file: string): string =>
    `/${relative(root, file).split(sep).join('/')}`.replace(/(?:\/index)?\.(?:html|data)$/, '') ||
    '/';

/**
 * Runs after `react-router build` has prerendered. Leaves one flat static site in `build/`, where
 * Capacitor (webDir), Capgo, Netlify, nginx and Playwright already look:
 *
 * 1. Fails if HTML or route data exists for a path that must never be static (see
 *    routing/prerender.ts), or a configured prerender path is missing.
 * 2. Writes the lazy-chunk prefetch list (#2104) into every HTML file's head.
 * 3. Replaces `build/` with the contents of `build/client` (the server build is already gone in
 *    SPA mode; anything else in `build/` is from an earlier build).
 */
export const finalizeStaticBuild = async (
    buildDirectory: string,
    prerenderPaths: readonly string[]
): Promise<{ html: string[] }> => {
    const client = join(buildDirectory, 'client');
    const emitted = await staticFiles(client);
    const unsafe = emitted.map(file => pathFor(client, file)).filter(isNeverPrerendered);
    if (unsafe.length > 0)
        throw new Error(
            `[finalize-static-build] private paths were prerendered: ${unsafe.join(', ')}`
        );
    const files = emitted.filter(file => file.endsWith('.html'));
    const paths = files.map(file => pathFor(client, file));
    const missing = ['/', ...prerenderPaths].filter(path => !paths.includes(path));
    if (missing.length > 0)
        throw new Error(`[finalize-static-build] missing prerendered HTML: ${missing.join(', ')}`);

    const listFile = join(client, CHUNK_PREFETCH_LIST_FILE);
    const list = JSON.parse(await readFile(listFile, 'utf8')) as PrefetchChunkList;
    const element = chunkPrefetchElementHtml(list);
    for (const file of files) {
        const html = await readFile(file, 'utf8');
        if (html.split('</head>').length !== 2)
            throw new Error(`[finalize-static-build] expected one </head> in ${file}`);
        await writeFile(
            file,
            html.replace('</head>', () => `${element}</head>`)
        );
    }
    await rm(listFile);

    for (const entry of await readdir(buildDirectory)) {
        if (entry !== 'client')
            await rm(join(buildDirectory, entry), { recursive: true, force: true });
    }
    for (const entry of await readdir(client)) {
        await rename(join(client, entry), join(buildDirectory, entry));
    }
    await rm(client, { recursive: true });
    if (!existsSync(join(buildDirectory, 'index.html')))
        throw new Error('[finalize-static-build] build/index.html (SPA fallback) is missing');
    return { html: paths.sort() };
};
