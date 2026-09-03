import serverlessHttp from 'serverless-http';

type ServerlessApplication = Parameters<typeof serverlessHttp>[0];

/** serverless-http supports Fastify at runtime, but its published input type omits it. */
export const toServerlessApplication = (application: unknown): ServerlessApplication =>
    application as ServerlessApplication;
