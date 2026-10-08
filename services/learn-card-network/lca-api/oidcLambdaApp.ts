import serverlessHttp from 'serverless-http';
import * as Sentry from '@sentry/serverless';

import { app as oidcApp } from './src/oidc';
import { sentryBeforeSend, getTracesSampleRate } from './src/helpers/sentry.helpers';
import { environment } from './src/config/environment';
import { toServerlessApplication } from './src/helpers/serverlessApplication';

/**
 * Entry for the `oidc` function only. Unlike lambdaApp it must not import the
 * tRPC app, models, or DIDKit: those open a Mongo connection at load time that
 * this function never awaits, and a connection left pending when the sandbox
 * freezes crashes the next request after thaw. The OIDC routes need only Redis
 * and the signing key.
 */
Sentry.AWSLambda.init({
    dsn: environment.SENTRY_DSN,
    environment: environment.SENTRY_ENV,
    enabled: Boolean(environment.SENTRY_DSN),
    tracesSampleRate: getTracesSampleRate(),
    beforeSend: sentryBeforeSend,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.ContextLines(),
    ],
});

export const oidcHandler = serverlessHttp(toServerlessApplication(oidcApp));
