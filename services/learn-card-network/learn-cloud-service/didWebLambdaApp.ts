import serverlessHttp from 'serverless-http';
import * as Sentry from '@sentry/serverless';

import didWebApp from './src/dids';
import { environment } from './src/config/environment';
import { toServerlessApplication } from './src/helpers/serverlessApplication';

Sentry.AWSLambda.init({
    dsn: environment.SENTRY_DSN,
    environment: environment.SENTRY_ENV,
    enabled: Boolean(environment.SENTRY_DSN),
    tracesSampleRate: 1.0,
    integrations: [
        new Sentry.Integrations.Console(),
        new Sentry.Integrations.Http(),
        new Sentry.Integrations.ContextLines(),
        new Sentry.Integrations.Mongo(),
    ],
});

export const didWebHandler = Sentry.AWSLambda.wrapHandler(
    serverlessHttp(toServerlessApplication(didWebApp))
);
