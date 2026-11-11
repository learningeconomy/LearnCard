import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import netlify from '@astrojs/netlify';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const monorepoRoot = path.resolve(__dirname, '../../..');

// Workspace SDK source imports named exports from CommonJS. Keep these dependencies
// bundled for production and prebundle them as ESM for Vite's development SSR runner.
const ssrOptimizedDependencies = ['lodash'];

const verification = process.env.LC_VERIFICATION === '1';
if (verification) {
    if (!/^[a-f0-9]{64}$/i.test(process.env.LEARNCARD_ISSUER_SEED ?? '')) {
        throw new Error(
            'Verification requires an explicit disposable 32-byte LEARNCARD_ISSUER_SEED'
        );
    }
    for (const key of ['LEARNCARD_NETWORK_URL', 'LEARNCARD_CLOUD_URL']) {
        const value = process.env[key];
        if (!value) throw new Error(`Verification requires explicit ${key}`);
        const url = new URL(value);
        if (
            url.protocol !== 'http:' ||
            !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
            url.username ||
            url.password
        ) {
            throw new Error(`Verification requires a loopback HTTP ${key}`);
        }
    }
}

export default defineConfig({
    output: 'server',
    // No edge functions here; local edge emulation breaks on Deno 2.9+.
    adapter: netlify({
        devFeatures: { environmentVariables: false, images: true, edgeFunctions: false },
    }),
    integrations: [],

    build: {
        assets: '_astro',
        client: './client/',
        concurrency: 1,
        format: 'directory',
        inlineStylesheets: 'auto',
        redirects: true,
        server: './server/',
        serverEntry: 'entry.mjs',
    },

    image: {
        remotePatterns: [],
    },

    vite: {
        // Astro's own env loader also respects this: never read the developer's .env in verification.
        ...(verification && { envDir: false }),
        plugins: [tailwindcss()],
        ssr: {
            // hex-lite advertises an absent .mjs entry; Node must load its actual CommonJS entry.
            external: ['hex-lite'],
            noExternal: ssrOptimizedDependencies,
        },
        environments: {
            ssr: {
                // SSR discovery is disabled by default. noExternal alone would execute raw
                // CommonJS as ESM; explicit optimization supplies named-export interop.
                optimizeDeps: { include: ssrOptimizedDependencies },
            },
        },
        resolve: {
            alias: {
                // learn-card-helpers externalizes `filter-obj`; force Vite to the
                // package entry that the current package manager resolved instead
                // of relying on an installer-specific node_modules layout.
                'filter-obj': require.resolve('filter-obj', { paths: [monorepoRoot] }),
            },
        },
    },
});
