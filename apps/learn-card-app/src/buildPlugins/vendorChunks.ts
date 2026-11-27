/**
 * Chunk groups for the production build (build.rollupOptions.output.manualChunks).
 *
 * Vite 8 bundles with Rolldown, which only accepts the function form. The old object form named
 * a few packages per vendor chunk and Rollup pulled in their static dependencies. This keeps the
 * same groups, plus three things the startup bundle needs under Rolldown:
 *
 * - Stylesheets stay out of vendor groups. A CSS module is a side-effect import, so grouping
 *   swiper's CSS with swiper's JS made every importer load all of swiper at startup.
 * - Modules a vendor only loads through import() stay out of the group, as they were under
 *   Rollup.
 * - Paraglide's base-locale messages and the dispatchers that call them share one chunk. Split
 *   apart, the dispatcher chunk imports ~8k names from the locale chunk, ~65 KB gzip of
 *   import/export lists on the startup path.
 */

/** The parts of Rolldown's module info this reads. */
export type ChunkModuleInfo = {
    importers: readonly string[];
    dynamicImporters: readonly string[];
};

export type ChunkMeta = {
    getModuleInfo: (id: string) => ChunkModuleInfo | null;
};

const VENDOR_CHUNKS: Record<string, readonly string[]> = {
    'vendor-react': ['react', 'react-dom', 'react-router', 'scheduler'],
    'vendor-firebase': ['firebase', '@firebase'],
    'vendor-sentry': ['@sentry', '@sentry-internal'],
    'vendor-launchdarkly': ['launchdarkly-react-client-sdk', 'launchdarkly-js-client-sdk'],
    'vendor-swiper': ['swiper'],
    'vendor-lottie': ['react-lottie-player'],
    'vendor-tanstack': ['@tanstack/react-query', '@tanstack/query-core'],
};

export const PARAGLIDE_MESSAGES_CHUNK = 'paraglide-messages';

const PACKAGE_IN_PATH = /[\\/]node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/g;
const STYLESHEET = /\.(?:css|scss|sass|less)(?:\?|$)/;

/** npm package that owns a module id (the innermost node_modules), or undefined for app code. */
export const packageOf = (id: string): string | undefined => {
    let name: string | undefined;
    for (const match of id.matchAll(PACKAGE_IN_PATH)) name = match[1].replace(/\\/g, '/');
    return name;
};

/** Vendor group for a module id by package name alone; undefined for app code and stylesheets. */
export const vendorChunkOf = (id: string): string | undefined => {
    if (STYLESHEET.test(id)) return undefined;
    const pkg = packageOf(id);
    if (!pkg) return undefined;
    for (const [chunk, packages] of Object.entries(VENDOR_CHUNKS)) {
        if (packages.some(p => pkg === p || pkg.startsWith(`${p}/`))) return chunk;
    }
    return undefined;
};

/**
 * Creates the manualChunks function. `paraglideBaseLocale` is the locale Paraglide keeps static
 * (project.inlang baseLocale); the other locales load lazily and keep their own chunks.
 */
export const createManualChunks = ({ paraglideBaseLocale }: { paraglideBaseLocale: string }) => {
    const paraglideStartup = new RegExp(
        String.raw`[\\/]paraglide[\\/](?:runtime|registry|messages[\\/](?:_index|${paraglideBaseLocale}))\.js$`
    );
    const lazyOnly = new Map<string, boolean>();

    // True when every way to reach `id` goes through an import() inside the same vendor group.
    const onlyLoadedLazily = (id: string, group: string, meta: ChunkMeta): boolean => {
        const known = lazyOnly.get(id);
        if (known !== undefined) return known;
        lazyOnly.set(id, false); // cycles: assume reachable until shown otherwise
        const info = meta.getModuleInfo(id);
        const result =
            !!info &&
            info.dynamicImporters.length + info.importers.length > 0 &&
            info.importers.every(
                importer =>
                    vendorChunkOf(importer) === group && onlyLoadedLazily(importer, group, meta)
            ) &&
            info.dynamicImporters.every(importer => vendorChunkOf(importer) === group);
        lazyOnly.set(id, result);
        return result;
    };

    return (id: string, meta: ChunkMeta): string | undefined => {
        if (paraglideStartup.test(id)) return PARAGLIDE_MESSAGES_CHUNK;
        const vendor = vendorChunkOf(id);
        if (!vendor || onlyLoadedLazily(id, vendor, meta)) return undefined;
        return vendor;
    };
};
