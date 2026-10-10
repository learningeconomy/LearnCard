import type { Context } from 'aws-lambda';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ bootstrap: vi.fn(), getApp: vi.fn(), handler: vi.fn() }));

vi.mock('@learncard/service-config', () => ({ bootstrapLambda: mocks.bootstrap }));
vi.mock('./src/config/stageConfig', () => ({ base: {}, stages: { dev: {}, production: {} } }));
vi.mock('./seedMigrationApp', () => ({ handler: mocks.handler }));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.bootstrap.mockReturnValue(mocks.getApp);
    mocks.getApp.mockResolvedValue({ handler: mocks.handler });
    mocks.handler.mockResolvedValue({ phase: 'prepare', done: true });
});

it('bootstraps the migration app with checked-in stage config and the deploy stage', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lca-api-production-seedMigration');
    vi.stubEnv('LAMBDA_STAGE', 'production');
    await import('./seedMigrationLambda');
    expect(mocks.bootstrap).toHaveBeenCalledTimes(1);
    expect(mocks.bootstrap).toHaveBeenCalledWith({
        base: {},
        stages: { dev: {}, production: {} },
        stage: 'production',
        importApp: expect.any(Function),
    });
    vi.unstubAllEnvs();
});

it('resolves the app once per cold start and forwards every argument', async () => {
    const { handler } = await import('./seedMigrationLambda');
    const event = { phase: 'prepare' };
    const context = {} as Context;
    await expect(handler(event, context)).resolves.toEqual({ phase: 'prepare', done: true });
    await handler(event, context);
    expect(mocks.getApp).toHaveBeenCalledTimes(2);
    expect(mocks.handler).toHaveBeenLastCalledWith(event, context);
});
