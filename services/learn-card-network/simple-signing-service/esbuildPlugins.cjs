const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');

const forceCjsSodiumWrapperPlugin = {
    name: 'force-cjs-sodium-wrapper',
    setup(build) {
        build.onResolve({ filter: /^libsodium-wrappers$/ }, () => ({
            path: require.resolve('libsodium-wrappers'),
        }));
    },
};

module.exports = [
    forceCjsSodiumWrapperPlugin,
    sentryEsbuildPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
    }),
];
