/**
 * Lists the files a lazy chunk needs, so the app can warm the HTTP cache for it with plain
 * fetch() (see helpers/prefetchChunk.ts). It needs real file names because a speculative
 * import() is not safe: when it fails, Firefox and some Chromium versions remember the failed
 * module and a later import() of the same URL fails without a new request.
 */

/** The parts of a Rollup output chunk this reads. */
export type BundleChunk = {
    type: 'chunk' | 'asset';
    fileName: string;
    facadeModuleId?: string | null;
    imports?: string[];
    viteMetadata?: { importedCss: Set<string> };
};

export const CHUNK_PREFETCH_ELEMENT_ID = 'lc-chunk-prefetch';

const staticClosure = (bundle: Record<string, BundleChunk>, start: string): Set<string> => {
    const seen = new Set<string>();
    const visit = (fileName: string) => {
        const chunk = bundle[fileName];
        if (seen.has(fileName) || chunk?.type !== 'chunk') return;
        seen.add(fileName);
        chunk.imports?.forEach(visit);
    };
    visit(start);
    return seen;
};

const cssOf = (bundle: Record<string, BundleChunk>, files: Set<string>): Set<string> =>
    new Set([...files].flatMap(file => [...(bundle[file]?.viteMetadata?.importedCss ?? [])]));

/**
 * Files (relative to the build root) that loading `moduleId` will request and the entry page
 * hasn't already loaded: its chunk, its static imports, and their CSS. Empty when no chunk has
 * that module as its facade.
 */
export const chunkPrefetchFiles = (
    bundle: Record<string, BundleChunk>,
    entryFileName: string,
    moduleId: string
): string[] => {
    const target = Object.values(bundle).find(
        chunk => chunk.type === 'chunk' && chunk.facadeModuleId === moduleId
    );
    if (!target) return [];
    const loaded = staticClosure(bundle, entryFileName);
    const needed = [...staticClosure(bundle, target.fileName)].filter(file => !loaded.has(file));
    const loadedCss = cssOf(bundle, loaded);
    const css = [...cssOf(bundle, new Set(needed))].filter(file => !loadedCss.has(file));
    return [...needed, ...css];
};
