import { describe, expect, it } from 'vitest';

import {
    chunkPrefetchElementHtml,
    chunkPrefetchFiles,
    devChunkPrefetchList,
    type BundleChunk,
} from './chunkPrefetchList';

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

    it('skips files any entry already loads (React Router loads route modules and the client entry)', () => {
        expect(
            chunkPrefetchFiles(
                bundle,
                ['assets/index.js', 'assets/PhoneForm.js'],
                '/app/src/Modal.tsx'
            )
        ).toEqual([]);
    });
});

describe('chunk prefetch element', () => {
    it('lists source modules in dev', () => {
        expect(devChunkPrefetchList('/')).toEqual({
            'my-learncard': ['/src/components/learncard/MyLearnCardModalContent.tsx'],
        });
    });

    it('escapes < so the JSON cannot close the script element', () => {
        expect(chunkPrefetchElementHtml({ 'my-learncard': ['/a</script>.js'] })).toBe(
            '<script type="application/json" id="lc-chunk-prefetch">{"my-learncard":["/a\\u003c/script>.js"]}</script>'
        );
    });
});
