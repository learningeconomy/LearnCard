import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    bootstrap: vi.fn(),
    getApp: vi.fn(),
    handler: vi.fn(),
    migrate: vi.fn(),
}));

vi.mock('@learncard/service-config', () => ({ bootstrapLambda: mocks.bootstrap }));
vi.mock('./src/config/stageConfig', () => ({ base: {}, stages: { dev: {}, production: {} } }));
vi.mock('./src/helpers/consentflow-legacy-migration.helpers', () => ({
    migrateLegacyConsentFlowContracts: mocks.migrate,
}));

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

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.bootstrap.mockReturnValue(mocks.getApp);
    mocks.getApp.mockResolvedValue(
        Object.fromEntries(LAMBDA_APP_HANDLERS.map(name => [name, mocks.handler]))
    );
    mocks.handler.mockResolvedValue({ statusCode: 200 });
    mocks.migrate.mockResolvedValue(undefined);
});

it('uses CONFIG_STAGE outside Lambda rather than LAMBDA_STAGE', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', '');
    vi.stubEnv('LAMBDA_STAGE', 'production');
    vi.stubEnv('CONFIG_STAGE', 'dev');
    await import('./lambda');
    expect(mocks.bootstrap).toHaveBeenCalledWith(expect.objectContaining({ stage: 'dev' }));
    vi.unstubAllEnvs();
});

it('does not serve a request until legacy access is migrated', async () => {
    let finishMigration!: () => void;
    mocks.migrate.mockReturnValue(
        new Promise<void>(resolve => {
            finishMigration = resolve;
        })
    );
    const lambda = await import('./lambda');
    let finished = false;
    const request = lambda
        .trpcHandler({} as APIGatewayProxyEventV2, {} as Context, vi.fn())
        .finally(() => {
            finished = true;
        });
    await vi.waitFor(() => expect(mocks.migrate).toHaveBeenCalled());
    expect(finished).toBe(false);
    finishMigration();
    await request;
    expect(finished).toBe(true);
});

it('retries a failed migration and serves concurrent and subsequent healthy requests', async () => {
    const failure = new Error('Database unavailable');
    let finishMigration!: () => void;
    mocks.migrate
        .mockRejectedValueOnce(failure)
        .mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    finishMigration = resolve;
                })
        )
        .mockResolvedValue(undefined);
    const lambda = await import('./lambda');
    await expect(
        lambda.trpcHandler({} as APIGatewayProxyEventV2, {} as Context, vi.fn())
    ).rejects.toBe(failure);

    let firstFinished = false;
    let secondFinished = false;
    const first = lambda
        .trpcHandler({} as APIGatewayProxyEventV2, {} as Context, vi.fn())
        .finally(() => {
            firstFinished = true;
        });
    const second = lambda.openApiHandler({} as never, {} as never, vi.fn()).finally(() => {
        secondFinished = true;
    });
    await vi.waitFor(() => expect(mocks.migrate).toHaveBeenCalledTimes(2));
    expect(firstFinished).toBe(false);
    expect(secondFinished).toBe(false);
    finishMigration();
    await Promise.all([first, second]);
    expect(mocks.migrate).toHaveBeenCalledTimes(2);

    await expect(
        lambda.trpcHandler({} as APIGatewayProxyEventV2, {} as Context, vi.fn())
    ).resolves.toEqual({ statusCode: 200 });
    expect(mocks.migrate).toHaveBeenCalledTimes(2);
});
