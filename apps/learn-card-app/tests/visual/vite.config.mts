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
                input: path.resolve(import.meta.dirname, '../../tailwind-regression.html'),
                onwarn: config.build?.rollupOptions?.onwarn,
            },
        },
        optimizeDeps: { ...config.optimizeDeps, entries: ['tailwind-regression.html'] },
        server: { ...config.server, host: '127.0.0.1', port: 3026, strictPort: true },
        preview: { host: '127.0.0.1', port: 3026, strictPort: true },
    };
});
