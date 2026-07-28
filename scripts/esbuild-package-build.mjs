import path from 'path';
import fs from 'fs/promises';

import esbuild from 'esbuild';

/**
 * Shared esbuild build for publishable @learncard/* packages.
 *
 * Policy: dist bundles ONLY the package's own source. Everything declared in
 * `dependencies` / `peerDependencies` / `optionalDependencies` is externalized
 * (exact specifier + subpaths) in both ESM and CJS outputs — npm consumers get
 * those deps installed via package.json, and monorepo apps dedupe a single
 * shared copy instead of one inlined copy per package.
 *
 * Deliberate failure mode: an import that is NOT declared in package.json is
 * still bundled (esbuild default), so builds never silently rely on undeclared
 * deps at runtime — they just don't dedupe until the dep is declared.
 *
 * @param {object} options
 * @param {string} options.packageDir - Absolute path to the package root (pass `import.meta.dirname/..` equivalent).
 * @param {string} options.outfileBase - Dist file base name, e.g. 'openid4vc-plugin' → dist/openid4vc-plugin.esm.js.
 * @param {string} [options.entry] - Entry point relative to packageDir.
 * @param {string} [options.target]
 * @param {string[]} [options.extraExternals] - Additional externals (node builtins, polyfills) not in package.json.
 * @param {string[]} [options.bundleInCjs] - Declared deps to keep inlined in CJS outputs (ESM-only dep escape hatch).
 * @param {boolean} [options.cjsPlatformNode] - Set platform:'node' on CJS builds (emits cjs-module-lexer named-export annotations).
 * @param {import('esbuild').Plugin[]} [options.esmPlugins]
 * @param {import('esbuild').Plugin[]} [options.cjsPlugins]
 */
export const buildPackage = async ({
    packageDir,
    outfileBase,
    entry = 'src/index.ts',
    target = 'es2020',
    extraExternals = [],
    bundleInCjs = [],
    cjsPlatformNode = false,
    esmPlugins = [],
    cjsPlugins = [],
}) => {
    const pkg = JSON.parse(await fs.readFile(path.join(packageDir, 'package.json'), 'utf8'));

    const declaredDeps = [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.peerDependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
    ];

    const toExternalPatterns = deps => deps.flatMap(dep => [dep, `${dep}/*`]);

    const esmExternal = [...toExternalPatterns(declaredDeps), ...extraExternals];
    const cjsExternal = [
        ...toExternalPatterns(declaredDeps.filter(dep => !bundleInCjs.includes(dep))),
        ...extraExternals,
    ];

    const shared = {
        keepNames: true,
        bundle: true,
        sourcemap: 'external',
        tsconfig: path.join(packageDir, 'tsconfig.json'),
        entryPoints: [path.join(packageDir, entry)],
        target,
    };

    const configurations = [
        {
            ...shared,
            format: 'cjs',
            external: cjsExternal,
            plugins: cjsPlugins,
            ...(cjsPlatformNode ? { platform: 'node' } : {}),
            outfile: path.join(packageDir, `dist/${outfileBase}.cjs.development.cjs`),
        },
        {
            ...shared,
            format: 'cjs',
            minify: true,
            external: cjsExternal,
            plugins: cjsPlugins,
            ...(cjsPlatformNode ? { platform: 'node' } : {}),
            outfile: path.join(packageDir, `dist/${outfileBase}.cjs.production.min.cjs`),
        },
        {
            ...shared,
            format: 'esm',
            external: esmExternal,
            plugins: esmPlugins,
            outfile: path.join(packageDir, `dist/${outfileBase}.esm.js`),
        },
    ];

    await fs
        .rm(path.join(packageDir, 'dist'), { recursive: true, force: true })
        .catch(() => console.log('Unable to delete dist directory'));

    try {
        await Promise.all(configurations.map(config => esbuild.build(config)));
    } catch (err) {
        console.error('❌ Build failed', err);
        process.exit(1);
    }

    console.log('✔ Build successful');
};
