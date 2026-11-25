import serverlessHttp from 'serverless-http';

import { app as oidcApp } from './src/oidc';
import { toServerlessApplication } from './src/helpers/serverlessApplication';

/**
 * Dedicated OIDC Lambda entrypoint. Unlike `lambdaApp.ts`, this imports only the
 * Fastify OIDC surface and its focused environment, so the OIDC function boots
 * without SEED/MONGO/Postmark/Firebase or a runtime-secrets bundle.
 */
export const oidcHandler = serverlessHttp(toServerlessApplication(oidcApp));
