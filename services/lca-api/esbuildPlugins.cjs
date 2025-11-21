const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');

module.exports = [
    sentryEsbuildPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
    }),
];
