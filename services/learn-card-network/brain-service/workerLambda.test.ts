import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    bootstrap: vi.fn(),
    getApp: vi.fn(),
    contractEvents: vi.fn(),
    shareLink: vi.fn(),
    didWeb: vi.fn(),
}));

vi.mock('@learncard/service-config', () => ({ bootstrapLambda: mocks.bootstrap }));
vi.mock('./src/config/stageConfig', () => ({ base: {}, stages: { dev: {}, production: {} } }));
vi.mock('./contractEventsLambdaApp', () => ({ contractEventsHandler: mocks.contractEvents }));
vi.mock('./shareLinkMaintenanceLambdaApp', () => ({
    shareLinkMaintenanceHandler: mocks.shareLink,
}));
vi.mock('./didWebLambdaApp', () => ({ didWebHandler: mocks.didWeb }));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.bootstrap.mockReturnValue(mocks.getApp);
});

describe.each([
    {
        name: 'contractEventsLambda',
        entry: './contractEventsLambda',
        handlerName: 'contractEventsHandler',
        appHandler: mocks.contractEvents,
        appModule: './contractEventsLambdaApp',
        result: { status: 'ok' },
    },
    {
        name: 'shareLinkMaintenanceLambda',
        entry: './shareLinkMaintenanceLambda',
        handlerName: 'shareLinkMaintenanceHandler',
        appHandler: mocks.shareLink,
        appModule: './shareLinkMaintenanceLambdaApp',
        result: { status: 'idle' },
    },
    {
        name: 'didWebLambda',
        entry: './didWebLambda',
        handlerName: 'didWebHandler',
        appHandler: mocks.didWeb,
        appModule: './didWebLambdaApp',
        result: { statusCode: 200 },
    },
])('$name thin bootstrap entry', ({ entry, handlerName, appHandler, appModule, result }) => {
    it('bootstraps once with checked-in stage config and the deploy stage', async () => {
        vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lcn-brain-service-production-worker');
        vi.stubEnv('LAMBDA_STAGE', 'production');
        await import(entry);
        expect(mocks.bootstrap).toHaveBeenCalledTimes(1);
        expect(mocks.bootstrap).toHaveBeenCalledWith({
            base: {},
            stages: { dev: {}, production: {} },
            stage: 'production',
            importApp: expect.any(Function),
        });
        vi.unstubAllEnvs();
    });

    it('uses CONFIG_STAGE outside Lambda rather than LAMBDA_STAGE', async () => {
        vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', '');
        vi.stubEnv('LAMBDA_STAGE', 'production');
        vi.stubEnv('CONFIG_STAGE', 'dev');
        await import(entry);
        expect(mocks.bootstrap).toHaveBeenCalledWith(expect.objectContaining({ stage: 'dev' }));
        vi.unstubAllEnvs();
    });

    it('imports the app module lazily through the bootstrap accessor', async () => {
        await import(entry);
        const call = mocks.bootstrap.mock.calls.at(-1)?.[0] as {
            importApp: () => Promise<unknown>;
        };
        const imported = await call.importApp();
        expect(imported).toHaveProperty(handlerName);
        expect(imported).toBe(await import(appModule));
    });

    it('resolves the app once per cold start and forwards every argument', async () => {
        appHandler.mockResolvedValue(result);
        mocks.getApp.mockResolvedValue(await import(appModule));
        const module = await import(entry);
        const handler = module[handlerName as keyof typeof module] as (
            ...args: unknown[]
        ) => Promise<unknown>;
        const event = {} as APIGatewayProxyEventV2;
        const context = { getRemainingTimeInMillis: () => 50_000 } as Context;
        await expect(handler(event, context)).resolves.toEqual(result);
        await handler(event, context);
        expect(mocks.getApp).toHaveBeenCalledTimes(2);
        expect(appHandler).toHaveBeenCalledTimes(2);
        expect(appHandler).toHaveBeenLastCalledWith(event, context);
    });
});
