import * as Sentry from '@sentry/serverless';
import packageJson from '../package.json';

import dotenv from 'dotenv';

dotenv.config();

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT,
        release: `${packageJson.name}@${packageJson.version}`,
        maxBreadcrumbs: 50,
        enableTracing: true,
        tracesSampleRate: 1,
        debug: true,
    });
    console.log(
        '✅ SENTRY ENABLED',
        process.env.SENTRY_ENVIRONMENT,
        `${packageJson.name}@${packageJson.version}`
    );
    Sentry.captureMessage('✅ SENTRY ENABLED');
}
