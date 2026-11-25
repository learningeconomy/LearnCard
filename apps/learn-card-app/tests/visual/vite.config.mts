import path from 'node:path';
import { buildSync } from 'esbuild';
import { defineConfig, type UserConfigFn } from 'vite';
import appConfig from '../../vite.config.mts';

// Exercise the real app pipeline and workspace source, without auth or a backend.
export default defineConfig(async environment => {
    const config = await (appConfig as UserConfigFn)({ ...environment, command: 'serve' });
    const globals = buildSync({
        entryPoints: [path.resolve(import.meta.dirname, 'browser-globals.ts')],
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        minify: true,
    }).outputFiles[0].text;
    return {
        ...config,
        // The command compiles messages once before Vite. Recompiling the entire
        // catalog in the plugin adds no coverage to these fixed-locale fixtures.
        plugins: [
            {
                name: 'visual-signed-in-boundaries',
                enforce: 'pre',
                resolveId(source, importer) {
                    if (!importer || !source.startsWith('.')) return;
                    const resolved = path.resolve(path.dirname(importer.split('?')[0]), source);
                    if (
                        importer.endsWith('/components/sidemenu/SideMenuRootLinks.tsx') &&
                        resolved === path.resolve('src/config/environment')
                    ) {
                        return path.resolve(import.meta.dirname, 'signedInEnvironment.ts');
                    }
                    if (resolved === path.resolve('src/hooks/useLogout')) {
                        return path.resolve(import.meta.dirname, 'disabledLogout.ts');
                    }
                    if (
                        importer.endsWith('/components/mobile-nav-bar/MobileNavBar.tsx') &&
                        resolved === path.resolve('src/Routes')
                    ) {
                        return path.resolve(import.meta.dirname, 'SignedInLaunchpadRoutes.tsx');
                    }
                },
            },
            ...(config.plugins
                ?.flat()
                .filter(
                    plugin =>
                        !plugin ||
                        typeof plugin !== 'object' ||
                        !('name' in plugin) ||
                        plugin.name !== 'unplugin-paraglide-js'
                ) ?? []),
            {
                name: 'visual-browser-globals',
                transformIndexHtml: () => [
                    { tag: 'script', children: globals, injectTo: 'head-prepend' },
                ],
            },
        ],
        build: {
            ...config.build,
            outDir: 'build-visual',
            minify: false,
            reportCompressedSize: false,
            rollupOptions: {
                input: path.resolve(import.meta.dirname, 'tailwind-regression.html'),
                onwarn: config.build?.rollupOptions?.onwarn,
            },
        },
        optimizeDeps: {
            ...config.optimizeDeps,
            entries: ['tests/visual/tailwind-regression.html'],
        },
        server: { ...config.server, host: '127.0.0.1', port: 3026, strictPort: true },
        preview: { host: '127.0.0.1', port: 3026, strictPort: true },
    };
});
