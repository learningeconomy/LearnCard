import path from 'path';

import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(async () => {
    return {
        plugins: [react(), svgr(), tsconfigPaths({ root: '../../' })],
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
            LCN_URL: process.env.LCN_URL && `"${process.env.LCN_URL}"`,
            LCN_API_URL: process.env.LCN_API_URL && `"${process.env.LCN_API_URL}"`,
            CLOUD_URL: process.env.CLOUD_URL && `"${process.env.CLOUD_URL}"`,
            API_URL: process.env.API_URL && `"${process.env.API_URL}"`,
            __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
            IS_PRODUCTION: process.env.NODE_ENV === 'production',
            SENTRY_ENV: process.env.SENTRY_ENV ? `"${process.env.SENTRY_ENV}"` : '"development"',
            SENTRY_DSN: process.env.SENTRY_DSN
                ? `"${process.env.SENTRY_DSN}"`
                : '"https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704"',
            GOOGLE_MAPS_API_KEY:
                process.env.GOOGLE_MAPS_API_KEY && `"${process.env.GOOGLE_MAPS_API_KEY}"`,
            WEB3AUTH_MAINNET_CLIENT_ID:
                process.env.WEB3AUTH_MAINNET_CLIENT_ID &&
                `"${process.env.WEB3AUTH_MAINNET_CLIENT_ID}"`,
            WEB3AUTH_TESTNET_CLIENT_ID:
                process.env.WEB3AUTH_TESTNET_CLIENT_ID &&
                `"${process.env.WEB3AUTH_TESTNET_CLIENT_ID}"`,
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
        server: { port: 3000 },
    };
});
