import { describe, expect, it } from 'vitest';

import { chunkPrefetchFiles, type BundleChunk } from './chunkPrefetchList';

const chunk = (
    fileName: string,
    imports: string[] = [],
    extra: Partial<BundleChunk> = {}
): [string, BundleChunk] => [fileName, { type: 'chunk', fileName, imports, ...extra }];

const css = (...files: string[]) => ({ viteMetadata: { importedCss: new Set(files) } });

const bundle = Object.fromEntries([
    chunk('assets/index.js', ['assets/vendor-react.js'], css('assets/index.css')),
    chunk('assets/vendor-react.js'),
    chunk('assets/Modal.js', ['assets/vendor-react.js', 'assets/PhoneForm.js'], {
        facadeModuleId: '/app/src/Modal.tsx',
        ...css('assets/index.css', 'assets/Modal.css'),
    }),
    chunk('assets/PhoneForm.js', ['assets/Modal.js'], css('assets/PhoneForm.css')),
]);

describe('chunkPrefetchFiles', () => {
    it("lists the module's chunk, its static imports and their CSS, minus what the entry loads", () => {
        expect(chunkPrefetchFiles(bundle, 'assets/index.js', '/app/src/Modal.tsx')).toEqual([
            'assets/Modal.js',
            'assets/PhoneForm.js',
            'assets/Modal.css',
            'assets/PhoneForm.css',
        ]);
    });

    it('is empty when no chunk is built for the module', () => {
        expect(chunkPrefetchFiles(bundle, 'assets/index.js', '/app/src/Missing.tsx')).toEqual([]);
    });
});
