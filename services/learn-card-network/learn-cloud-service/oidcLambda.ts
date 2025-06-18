import serverlessHttp from 'serverless-http';
import * as Sentry from '@sentry/serverless';

import oidcApp from './src/oidc';

Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    enabled: Boolean(process.env.SENTRY_DSN),
    tracesSampleRate: 1,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http(),
        new Sentry.Integrations.ContextLines(),
        new Sentry.Integrations.Mongo(),
    ],
});

export const oidcHandler = Sentry.AWSLambda.wrapHandler(serverlessHttp(oidcApp));
