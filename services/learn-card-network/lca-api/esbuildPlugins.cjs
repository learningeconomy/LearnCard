const { sentryEsbuildPlugin } = require('@sentry/esbuild-plugin');

const authToken = process.env.SENTRY_AUTH_TOKEN;
const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;
const releaseName = process.env.SENTRY_RELEASE;

module.exports =
    authToken && org && project
        ? [
              sentryEsbuildPlugin({
                  authToken,
                  org,
                  project,
                  telemetry: false,
                  release: releaseName ? { name: releaseName } : undefined,
              }),
          ]
        : [];
