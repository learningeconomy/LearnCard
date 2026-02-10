import path from 'path';

import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Workspace packages that should not be pre-bundled for HMR support
const workspacePackages = [
    '@learncard/helpers',
    '@learncard/types',
    '@learncard/react',
    '@learncard/init',
    '@learncard/core',
    '@learncard/chapi-plugin',
    '@learncard/lca-api-plugin',
    '@learncard/open-badge-v2-plugin',
    '@learncard/network-brain-client',
    '@learncard/network-plugin',
];

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react(), svgr(), tsconfigPaths({ root: '../../' })],
        build: { target: 'esnext', outDir: path.join(__dirname, 'build') },
        optimizeDeps: {
            // disabled: false,
            include: ['buffer', 'process', 'react-router', 'react-router-dom', 'crypto-browserify'],
            // Exclude workspace packages from pre-bundling to enable HMR when they rebuild
            exclude: workspacePackages,
            esbuildOptions: {
                target: 'esnext',
                define: { global: 'globalThis' },
                plugins: [GlobalPolyfill({ process: true, buffer: true }) as any],
            },
        },
        define: {
            LCN_URL: process.env.LCN_URL && `"${process.env.LCN_URL}"`,
            LCN_API_URL: process.env.LCN_API_URL && `"${process.env.LCN_API_URL}"`,
            CLOUD_URL: process.env.CLOUD_URL && `"${process.env.CLOUD_URL}"`,
            API_URL: process.env.API_URL && `"${process.env.API_URL}"`,
            __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
            IS_PRODUCTION: process.env.NODE_ENV === 'production',
            // SSS Key Manager configuration
            'process.env.REACT_APP_KEY_DERIVATION_PROVIDER': process.env.REACT_APP_KEY_DERIVATION_PROVIDER
                ? JSON.stringify(process.env.REACT_APP_KEY_DERIVATION_PROVIDER)
                : 'undefined',
            'process.env.REACT_APP_SSS_SERVER_URL': process.env.REACT_APP_SSS_SERVER_URL
                ? JSON.stringify(process.env.REACT_APP_SSS_SERVER_URL)
                : 'undefined',
            'process.env.REACT_APP_ENABLE_SSS_MIGRATION': process.env.REACT_APP_ENABLE_SSS_MIGRATION
                ? JSON.stringify(process.env.REACT_APP_ENABLE_SSS_MIGRATION)
                : 'undefined',
            SENTRY_ENV: process.env.SENTRY_ENV ? `"${process.env.SENTRY_ENV}"` : '"development"',
            SENTRY_DSN: process.env.SENTRY_DSN
                ? `"${process.env.SENTRY_DSN}"`
                : '"https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704"',
            GOOGLE_MAPS_API_KEY:
                process.env.GOOGLE_MAPS_API_KEY && `"${process.env.GOOGLE_MAPS_API_KEY}"`,
            // Use values from .env via loadEnv so they're available at build time
            WEB3AUTH_MAINNET_CLIENT_ID: env.WEB3AUTH_MAINNET_CLIENT_ID
                ? JSON.stringify(env.WEB3AUTH_MAINNET_CLIENT_ID)
                : 'undefined',
            WEB3AUTH_TESTNET_CLIENT_ID: env.WEB3AUTH_TESTNET_CLIENT_ID
                ? JSON.stringify(env.WEB3AUTH_TESTNET_CLIENT_ID)
                : 'undefined',
            APP_THEME: env.APP_THEME ? JSON.stringify(env.APP_THEME) : '"colorful"',
        },
        resolve: {
            alias: {
                ...stdlibbrowser,
                '@web3auth/openlogin-adapter':
                    '@web3auth/openlogin-adapter/dist/openloginAdapter.umd.min.js',
                'learn-card-base': path.resolve(__dirname, '../../packages/learn-card-base/src'),
                'apps/learn-card-app': path.resolve(__dirname),
            },
            dedupe: [
                'react',
                'react-dom',
                'react-router',
                'react-router-dom',
                'history',
                '@ionic/react-router',
            ],
        },
        server: {
            port: 3000,
            watch: {
                // Enable polling for Docker volume mounts
                usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
                interval: parseInt(process.env.CHOKIDAR_INTERVAL || '1000', 10),
                // Watch workspace package dist folders for changes (when watcher rebuilds them)
                ignored: ['!**/packages/**/dist/**', '!**/packages/plugins/**/dist/**'],
            },
        },
    };
});
