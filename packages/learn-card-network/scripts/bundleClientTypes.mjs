/**
 * Makes a tRPC client's published type declarations self-contained.
 *
 * The clients only use their service's `AppRouter` *type*. Left as `import type { AppRouter }
 * from '<service>'`, that import forces every consumer to install the whole server (database
 * drivers, Fastify, AWS SDKs, ...) just to type-check. This bundles the declarations reachable
 * from the client's entry point into one file, inlining the service's types, so the service
 * can be a devDependency.
 *
 * Only declarations the router type actually reaches are kept. Server-only types that leak in
 * through request context or route metadata are replaced by the stubs in ./type-stubs.
 */
import { copyFile, readdir, readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Modules replaced by a client-side stand-in. */
const STUBS = {
    'trpc-to-openapi': path.join(here, 'type-stubs/trpc-to-openapi.d.ts'),
    '@learncard/email-templates': path.join(here, 'type-stubs/email-templates.d.ts'),
};

const stubFiles = new Set(Object.values(STUBS));

const isBare = id => !id.startsWith('.') && !path.isAbsolute(id);

const packageName = id =>
    id
        .split('/')
        .slice(0, id.startsWith('@') ? 2 : 1)
        .join('/');

/**
 * @param {object} options
 * @param {Function} options.rollup `rollup` from the client's own devDependencies (>= 4).
 * @param {Function} options.dts `rollup-plugin-dts` from the client's own devDependencies.
 * @param {object} options.ts `typescript`, used to type-check the result.
 * @param {string} options.packageDir Client package directory (contains `dist/index.d.ts`).
 * @param {string[]} options.inline Packages whose types are inlined (the service, plus any
 *   third-party package the service re-exports types from).
 * @param {string[]} options.allowedExternals The only packages the result may import. Each
 *   must be a runtime dependency of the client.
 */
export const bundleClientTypes = async ({
    rollup,
    dts,
    ts,
    packageDir,
    inline,
    allowedExternals,
}) => {
    const dist = path.join(packageDir, 'dist');
    const entry = path.join(dist, 'index.d.ts');
    const bundled = path.join(dist, 'index.bundled.d.ts');
    const inlined = new Set(inline);

    const bundle = await rollup({
        input: entry,
        external: id => isBare(id) && !inlined.has(packageName(id)) && !(id in STUBS),
        plugins: [
            {
                name: 'client-type-stubs',
                resolveId: id => STUBS[id] ?? null,
            },
            dts({ respectExternal: true }),
        ],
        onwarn: warning => {
            if (warning.code === 'UNUSED_EXTERNAL_IMPORT' || warning.code === 'CIRCULAR_DEPENDENCY')
                return;

            // Server-only modules (OpenAPI document builders, ...) import names the stubs do
            // not define. They are tree-shaken away; if one survived, the type-check of the
            // bundled file below fails.
            if (warning.code === 'MISSING_EXPORT' && stubFiles.has(warning.exporter)) return;

            throw new Error(`${warning.code}: ${warning.message}`);
        },
    });

    await bundle.write({ file: bundled, format: 'es' });
    await bundle.close();

    const source = await readFile(bundled, 'utf8');
    const imported = new Set(
        [...source.matchAll(/^(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gm)].map(match =>
            packageName(match[1])
        )
    );
    const unexpected = [...imported].filter(name => !allowedExternals.includes(name));

    if (unexpected.length > 0) {
        await rm(bundled, { force: true });

        throw new Error(
            `${path.relative(process.cwd(), entry)} would import ${unexpected.join(', ')}. ` +
                'Published client types may only import: ' +
                `${allowedExternals.join(', ')}. Inline the package, or add a stub in ` +
                'packages/learn-card-network/scripts/type-stubs.'
        );
    }

    // The bundle is what consumers type-check against, so check it the way a strict consumer
    // would: on its own, with library checking on.
    const program = ts.createProgram([bundled], {
        noEmit: true,
        skipLibCheck: false,
        strict: true,
        types: [],
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
    });
    const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter(diagnostic => diagnostic.file?.fileName === bundled);

    if (diagnostics.length > 0) {
        const report = ts.formatDiagnostics(diagnostics.slice(0, 20), {
            getCanonicalFileName: fileName => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => '\n',
        });

        throw new Error(
            `Bundled client types do not type-check (${diagnostics.length} error(s)):\n${report}`
        );
    }

    // Everything is in the bundle now; drop the per-file declarations tsc emitted.
    for (const file of await readdir(dist)) {
        if (/\.d\.ts(\.map)?$/.test(file) && file !== 'index.bundled.d.ts') {
            await rm(path.join(dist, file));
        }
    }

    await rename(bundled, entry);
    await copyFile(entry, path.join(dist, 'index.d.cts'));

    return { file: entry, bytes: Buffer.byteLength(source), imports: [...imported].sort() };
};
