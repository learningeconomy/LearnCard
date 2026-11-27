import type { BundleChunk } from './chunkPrefetchList';

const CSS_MODULE = /\.(?:css|scss|sass|less)(?:$|\?)/;

/**
 * CSS modules the entry imports, in module evaluation order (each module's static imports
 * first, in source order). That is the order the dev server applies them in, and the order
 * the old index.html linked the startup stylesheets in.
 */
export const cssModulesInEvaluationOrder = (
    entryId: string,
    staticImports: (id: string) => readonly string[]
): string[] => {
    const seen = new Set<string>();
    const css: string[] = [];
    const visit = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        staticImports(id).forEach(visit);
        if (CSS_MODULE.test(id)) css.push(id);
    };
    visit(entryId);
    return css;
};

/**
 * The stylesheets of the entry's static closure, ordered by the CSS modules they hold. Files the
 * module walk does not reach keep their chunk order, after the rest.
 */
export const entryCssFiles = (
    bundle: Record<string, BundleChunk & { moduleIds?: string[] }>,
    entryFileName: string,
    cssModules: readonly string[]
): string[] => {
    const closure: string[] = [];
    const visit = (name: string) => {
        const chunk = bundle[name];
        if (closure.includes(name) || chunk?.type !== 'chunk') return;
        closure.push(name);
        chunk.imports?.forEach(visit);
    };
    visit(entryFileName);
    const chunkOf = new Map<string, string>();
    for (const name of closure)
        for (const id of bundle[name].moduleIds ?? []) if (!chunkOf.has(id)) chunkOf.set(id, name);
    const files = new Set<string>();
    const add = (name: string | undefined) =>
        name && bundle[name].viteMetadata?.importedCss.forEach(file => files.add(file));
    cssModules.forEach(id => add(chunkOf.get(id)));
    closure.forEach(add);
    return [...files];
};

/**
 * React Router links the root route's CSS by walking the client entry chunk before its imports
 * (and Vite would put imports first). Neither matches the source order once manualChunks splits
 * CSS into vendor chunks, so give the entry chunk its whole closure's CSS in evaluation order;
 * React Router keeps the first occurrence of each file.
 */
export const orderEntryCss = (
    bundle: Record<string, BundleChunk & { moduleIds?: string[] }>,
    entryFileName: string,
    cssModules: readonly string[]
): void => {
    const entry = bundle[entryFileName];
    if (entry?.type !== 'chunk' || !entry.viteMetadata) return;
    entry.viteMetadata.importedCss = new Set(entryCssFiles(bundle, entryFileName, cssModules));
};
