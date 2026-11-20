import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const handlers = vi.hoisted(() => ({
    api: vi.fn(async () => ({ statusCode: 200 })),
    trpc: vi.fn(async () => ({ statusCode: 200 })),
    ensureUserKeysIndexes: vi.fn(async () => undefined),
    createEscrowHoldsIndexes: vi.fn(async () => {
        throw new Error('Escrow hold index initialization failed', {
            cause: { code: 11000, codeName: 'DuplicateKey' },
        });
    }),
}));
vi.mock('serverless-http', () => ({ default: () => vi.fn() }));
vi.mock('@trpc/server/adapters/aws-lambda', () => ({
    awsLambdaRequestHandler: () => handlers.trpc,
}));
vi.mock('@sentry/serverless', () => ({
    AWSLambda: { init: vi.fn(), wrapHandler: (handler: unknown) => handler },
    Integrations: { Console: class {}, Http: class {}, ContextLines: class {}, Mongo: class {} },
}));
vi.mock('./src/openapi', () => ({ default: {} }));
vi.mock('./src/dids', () => ({ default: {} }));
vi.mock('./src/app', () => ({ appRouter: {}, createContext: vi.fn() }));
vi.mock('./src/helpers/learnCard.helpers', () => ({ getEmptyLearnCard: async () => ({}) }));
vi.mock('./src/helpers/shim', () => ({ createOpenApiAwsLambdaHandler: () => handlers.api }));
vi.mock('./src/helpers/sentry.helpers', () => ({
    handleTrpcError: vi.fn(),
    sentryBeforeSend: vi.fn(),
    getTracesSampleRate: () => 0,
}));
vi.mock('./src/config/environment', () => ({ environment: {} }));
vi.mock('./src/helpers/serverlessApplication', () => ({ toServerlessApplication: () => ({}) }));
vi.mock('./src/models', () => handlers);
vi.mock('./src/jobs/escrowHoldReminders', () => ({ runEscrowHoldReminders: vi.fn() }));
vi.mock('./src/jobs/escrowBlobRewrap', () => ({ runEscrowBlobRewrap: vi.fn() }));
vi.mock('./src/services/escrow-enclave', () => ({ checkEscrowRemoteConfig: vi.fn() }));

const event = (method: string): APIGatewayProxyEventV2 => ({
    version: '2.0',
    routeKey: '$default',
    rawPath: '/unrelated',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
    requestContext: {
        accountId: 'test',
        apiId: 'test',
        domainName: 'localhost',
        domainPrefix: 'localhost',
        http: {
            method,
            path: '/unrelated',
            protocol: 'HTTP/1.1',
            sourceIp: '127.0.0.1',
            userAgent: 'test',
        },
        requestId: 'test',
        routeKey: '$default',
        stage: '$default',
        time: '',
        timeEpoch: 0,
    },
});
const context: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test',
    functionVersion: 'test',
    invokedFunctionArn: 'test',
    memoryLimitInMB: '128',
    awsRequestId: 'test',
    logGroupName: 'test',
    logStreamName: 'test',
    getRemainingTimeInMillis: () => 30_000,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
};

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
});
describe('Lambda startup isolation', () => {
    it('retries transient non-escrow startup failures on the next request', async () => {
        const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        handlers.ensureUserKeysIndexes.mockRejectedValueOnce(
            new Error('transient startup failure')
        );
        const app = await import('./lambdaApp');
        await vi.waitFor(() => expect(diagnostic).toHaveBeenCalled());
        await expect(
            app.openApiHandler(event('GET'), context, () => undefined)
        ).resolves.toMatchObject({ statusCode: 200 });
        expect(handlers.ensureUserKeysIndexes).toHaveBeenCalledTimes(2);
        expect(handlers.createEscrowHoldsIndexes).not.toHaveBeenCalled();
        diagnostic.mockRestore();
    });

    it.each(['openApiHandler', 'trpcHandler'] as const)(
        '%s serves unrelated requests and OPTIONS without migrating escrow indexes',
        async name => {
            const app = await import('./lambdaApp');
            await expect(app[name](event('GET'), context, () => undefined)).resolves.toMatchObject({
                statusCode: 200,
            });
            await expect(
                app[name](event('OPTIONS'), context, () => undefined)
            ).resolves.toMatchObject({ statusCode: 200 });
            expect(handlers.ensureUserKeysIndexes).toHaveBeenCalledOnce();
            expect(handlers.createEscrowHoldsIndexes).not.toHaveBeenCalled();
        }
    );
});
