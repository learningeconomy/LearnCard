import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ bootstrap: vi.fn(), getApp: vi.fn(), handler: vi.fn() }));

vi.mock('@learncard/service-config', () => ({ bootstrapLambda: mocks.bootstrap }));
vi.mock('./src/config/stageConfig', () => ({ base: {}, stages: { dev: {}, production: {} } }));
vi.mock('./oidcLambdaApp', () => ({ oidcHandler: mocks.handler }));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.bootstrap.mockReturnValue(mocks.getApp);
    mocks.getApp.mockResolvedValue({ oidcHandler: mocks.handler });
    mocks.handler.mockResolvedValue({ statusCode: 200 });
});

it('bootstraps the oidc app with checked-in stage config and the deploy stage', async () => {
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'learn-cloud-service-dev-oidc');
    vi.stubEnv('LAMBDA_STAGE', 'dev');
    await import('./oidcLambda');
    expect(mocks.bootstrap).toHaveBeenCalledTimes(1);
    expect(mocks.bootstrap).toHaveBeenCalledWith({
        base: {},
        stages: { dev: {}, production: {} },
        stage: 'dev',
        importApp: expect.any(Function),
    });
    vi.unstubAllEnvs();
});

it('resolves the app once per cold start and forwards every argument', async () => {
    const { oidcHandler } = await import('./oidcLambda');
    const event = {} as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = vi.fn();
    await oidcHandler(event, context, callback);
    await oidcHandler(event, context, callback);
    expect(mocks.getApp).toHaveBeenCalledTimes(2);
    expect(mocks.handler).toHaveBeenLastCalledWith(event, context, callback);
});
