/**
 * React Router's Vite plugin reloads vite.config.mts for its child compiler via
 * `vite.loadConfigFromFile(env, path)` with no loader argument, so Vite defaults
 * to the bundle loader. That resolver uses production Node conditions and looks
 * up `@learncard/helpers` at its published dist entry, which the verification
 * runtime job never builds.
 *
 * Vite's native loader (and this process's `bun --conditions=development`)
 * resolves the package's development export to TypeScript source instead.
 * This preload wraps `loadConfigFromFile` so an omitted loader argument is
 * `native`, including that React Router reload.
 *
 * Spawn the verification frontend with `bun --preload <this file>` so the
 * wrapper is registered before any `import("vite")`.
 */
import { plugin } from 'bun';

const realVite = await import(import.meta.resolve('vite'));
const loadConfigFromFile = realVite.loadConfigFromFile;

const loadConfigFromFileNatively: typeof loadConfigFromFile = (
    configEnv,
    configFile,
    configRoot,
    logLevel,
    customLogger,
    configLoader = 'native'
) => loadConfigFromFile(configEnv, configFile, configRoot, logLevel, customLogger, configLoader);

plugin({
    name: 'lc-native-vite-config-loader',
    setup(builder) {
        builder.module('vite', () => ({
            loader: 'object',
            exports: { ...realVite, loadConfigFromFile: loadConfigFromFileNatively },
        }));
    },
});
