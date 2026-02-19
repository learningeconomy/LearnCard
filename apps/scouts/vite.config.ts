import path from 'path';

import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            svgr(),
            basicSsl(),
            tsconfigPaths({ projects: [path.resolve(__dirname, 'tsconfig.json')] }),
        ],
        build: { target: 'esnext', outDir: path.join(__dirname, 'build') },
        optimizeDeps: {
            // disabled: false,
            include: ['buffer', 'process', 'react-router', 'react-router-dom', 'crypto-browserify'],
            esbuildOptions: {
                target: 'esnext',
                define: { global: 'globalThis' },
                plugins: [GlobalPolyfill({ process: true, buffer: true }) as any],
            },
        },
        define: {
            LCN_URL: env.LCN_URL ? JSON.stringify(env.LCN_URL) : 'undefined',
            LCN_API_URL: env.LCN_API_URL ? JSON.stringify(env.LCN_API_URL) : 'undefined',
            CLOUD_URL: env.CLOUD_URL ? JSON.stringify(env.CLOUD_URL) : 'undefined',
            LEARN_CLOUD_XAPI_URL: env.LEARN_CLOUD_XAPI_URL
                ? JSON.stringify(env.LEARN_CLOUD_XAPI_URL)
                : 'undefined',
            API_URL: env.API_URL ? JSON.stringify(env.API_URL) : 'undefined',
            __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
            'process.version': '"1.0.0"',
            'process.env': env,
            IS_PRODUCTION: env.NODE_ENV === 'production',
            SENTRY_ENV: env.SENTRY_ENV ? JSON.stringify(env.SENTRY_ENV) : '"scouts-development"',
            SENTRY_DSN: env.SENTRY_DSN
                ? JSON.stringify(env.SENTRY_DSN)
                : '"https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704"',
            GOOGLE_MAPS_API_KEY: env.GOOGLE_MAPS_API_KEY
                ? JSON.stringify(env.GOOGLE_MAPS_API_KEY)
                : 'undefined',
            // SSS Key Manager configuration
            'process.env.REACT_APP_KEY_DERIVATION_PROVIDER': env.REACT_APP_KEY_DERIVATION_PROVIDER
                ? JSON.stringify(env.REACT_APP_KEY_DERIVATION_PROVIDER)
                : 'undefined',
            'process.env.REACT_APP_SSS_SERVER_URL': env.REACT_APP_SSS_SERVER_URL
                ? JSON.stringify(env.REACT_APP_SSS_SERVER_URL)
                : 'undefined',
            'process.env.REACT_APP_ENABLE_SSS_MIGRATION': env.REACT_APP_ENABLE_SSS_MIGRATION
                ? JSON.stringify(env.REACT_APP_ENABLE_SSS_MIGRATION)
                : 'undefined',
        },
        resolve: {
            alias: [
                ...Object.entries(stdlibbrowser).map(([find, replacement]) => ({
                    find,
                    replacement,
                })),
                {
                    find: /^learn-card-base$/,
                    replacement: path.resolve(__dirname, '../../packages/learn-card-base/src'),
                },
                {
                    find: /^learn-card-base\/(.*)$/,
                    replacement:
                        path.resolve(__dirname, '../../packages/learn-card-base/src') + '/$1',
                },
                {
                    find: '@web3auth/openlogin-adapter',
                    replacement: '@web3auth/openlogin-adapter/dist/openloginAdapter.umd.min.js',
                },
                { find: 'apps/scouts', replacement: path.resolve(__dirname) },
            ],
            dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
        },
        server: {
            port: 3000,
            proxy: {
                // Proxy SSS key-manager API requests to the lca-api Docker service.
                // Used when VITE_SSS_SERVER_URL is set to '/lca-api' (e.g. in docker-start)
                // to avoid CORS issues during local development.
                '/lca-api': {
                    target: 'http://localhost:5100',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/lca-api/, '/api'),
                },
            },
        },
    };
});
