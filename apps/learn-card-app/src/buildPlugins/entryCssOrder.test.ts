import { describe, expect, it } from 'vitest';

import type { BundleChunk } from './chunkPrefetchList';
import { cssModulesInEvaluationOrder, entryCssFiles, orderEntryCss } from './entryCssOrder';

// entry.client → App → [AppRoot → AppContent.tsx → app-shell.css], core.css, swiper/css
const graph: Record<string, string[]> = {
    'entry.client.tsx': ['App.tsx'],
    'App.tsx': ['AppRoot.tsx', 'core.css', 'swiper.css', 'App.tsx'],
    'AppRoot.tsx': ['AppContent.tsx'],
    'AppContent.tsx': ['app-shell.css'],
};

const chunk = (
    fileName: string,
    imports: string[],
    moduleIds: string[],
    css: string[]
): [string, BundleChunk & { moduleIds: string[] }] => [
    fileName,
    { type: 'chunk', fileName, imports, moduleIds, viteMetadata: { importedCss: new Set(css) } },
];

// manualChunks put swiper in its own chunk; App and the global CSS sit in the entry chunk.
const bundle = () =>
    Object.fromEntries([
        chunk(
            'entry.client.js',
            ['AppContent.js', 'swiper.js'],
            ['entry.client.tsx', 'App.tsx', 'AppRoot.tsx', 'core.css'],
            ['entry.css']
        ),
        chunk('AppContent.js', [], ['AppContent.tsx', 'app-shell.css'], ['AppContent.css']),
        chunk('swiper.js', [], ['swiper.css'], ['swiper.css-file.css']),
    ]);

describe('entry CSS order', () => {
    it('lists CSS modules in evaluation order and survives cycles', () => {
        expect(cssModulesInEvaluationOrder('entry.client.tsx', id => graph[id] ?? [])).toEqual([
            'app-shell.css',
            'core.css',
            'swiper.css',
        ]);
    });

    it('orders the stylesheets by the CSS modules they hold', () => {
        const modules = cssModulesInEvaluationOrder('entry.client.tsx', id => graph[id] ?? []);
        expect(entryCssFiles(bundle(), 'entry.client.js', modules)).toEqual([
            'AppContent.css',
            'entry.css',
            'swiper.css-file.css',
        ]);
    });

    it('keeps stylesheets the walk misses, after the rest', () => {
        const chunks = bundle();
        orderEntryCss(chunks, 'entry.client.js', ['core.css']);
        expect([...(chunks['entry.client.js'].viteMetadata?.importedCss ?? [])]).toEqual([
            'entry.css',
            'AppContent.css',
            'swiper.css-file.css',
        ]);
    });
});
