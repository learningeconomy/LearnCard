import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ bootstrap: vi.fn(), getApp: vi.fn(), handler: vi.fn() }));

vi.mock('@learncard/service-config', () => ({ bootstrapLambda: mocks.bootstrap }));
vi.mock('./src/config/stageConfig', () => ({ base: {}, stages: { dev: {}, production: {} } }));

const LAMBDA_APP_HANDLERS = [
    'trpcHandler',
    'openApiHandler',
    'swaggerUiHandler',
    'skillsViewerHandler',
    'statusListsHandler',
    'credentialRefreshHandler',
    'inboxQueueWorker',
    'inboxQueueDispatcher',
    'inboxDeadLetterWorker',
    'notificationsWorker',
    'inboxMaintenanceHandler',
] as const;

vi.mock('./lambdaApp', () =>
    Object.fromEntries(LAMBDA_APP_HANDLERS.map(name => [name, mocks.handler]))
);

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.bootstrap.mockReturnValue(mocks.getApp);
    mocks.handler.mockResolvedValue({ statusCode: 200 });
});

it('bootstraps the API once with checked-in stage config', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lcn-brain-service-dev-trpc');
    vi.stubEnv('LAMBDA_STAGE', 'dev');
    await import('./lambda');
    expect(mocks.bootstrap).toHaveBeenCalledTimes(1);
    expect(mocks.bootstrap).toHaveBeenCalledWith({
        base: {},
        stages: { dev: {}, production: {} },
        stage: 'dev',
        importApp: expect.any(Function),
    });
    vi.unstubAllEnvs();
});

it('uses CONFIG_STAGE outside Lambda rather than LAMBDA_STAGE', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', '');
    vi.stubEnv('LAMBDA_STAGE', 'production');
    vi.stubEnv('CONFIG_STAGE', 'dev');
    await import('./lambda');
    expect(mocks.bootstrap).toHaveBeenCalledWith(expect.objectContaining({ stage: 'dev' }));
    vi.unstubAllEnvs();
});

it('forwards every handler through its bootstrap accessor', async () => {
    mocks.getApp.mockResolvedValue(
        Object.fromEntries(LAMBDA_APP_HANDLERS.map(name => [name, mocks.handler]))
    );
    const lambda = await import('./lambda');
    const event = {} as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = vi.fn();
    for (const name of LAMBDA_APP_HANDLERS) {
        await (lambda[name] as (...args: unknown[]) => Promise<unknown>)(event, context, callback);
    }
    expect(mocks.bootstrap).toHaveBeenCalledTimes(1);
    expect(mocks.getApp).toHaveBeenCalledTimes(LAMBDA_APP_HANDLERS.length);
    expect(mocks.handler).toHaveBeenCalledTimes(LAMBDA_APP_HANDLERS.length);
    expect(mocks.handler).toHaveBeenCalledWith(event, context, callback);
});
