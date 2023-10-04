import serverlessHttp from 'serverless-http';
import * as Sentry from '@sentry/serverless';

import didWebApp from './src/dids';

Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    enabled: Boolean(process.env.SENTRY_DSN),
    tracesSampleRate: 1.0,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http(),
        new Sentry.Integrations.ContextLines(),
        new Sentry.Integrations.Mongo(),
    ],
});

export const didWebHandler = Sentry.AWSLambda.wrapHandler(serverlessHttp(didWebApp));
