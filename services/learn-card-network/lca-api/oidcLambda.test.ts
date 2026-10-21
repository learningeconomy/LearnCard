import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ applyStage: vi.fn(), handler: vi.fn(), importApp: vi.fn() }));
vi.mock('./src/config/stageConfig', () => ({ applyLcaApiStageConfig: mocks.applyStage }));

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.handler.mockResolvedValue({ statusCode: 200 });
    vi.doMock('./oidcLambdaApp', () => {
        mocks.importApp();
        expect(mocks.applyStage).toHaveBeenCalledTimes(1);
        return { oidcHandler: mocks.handler };
    });
});
afterEach(() => vi.unstubAllEnvs());

it.each([
    ['lca-api-dev-oidc', 'dev'],
    ['', 'local'],
])(
    'applies the appropriate stage before the isolated OIDC import (%s)',
    async (functionName, expectedStage) => {
        vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', functionName);
        vi.stubEnv('LAMBDA_STAGE', 'dev');
        vi.stubEnv('CONFIG_STAGE', 'local');
        const { handler } = await import('./oidcLambda');
        const event = {} as APIGatewayProxyEventV2;
        const context = {} as Context;
        const callback = vi.fn();
        await Promise.all([handler(event, context, callback), handler(event, context, callback)]);
        expect(mocks.applyStage).toHaveBeenCalledExactlyOnceWith(expectedStage);
        expect(mocks.importApp).toHaveBeenCalledTimes(1);
        expect(mocks.handler).toHaveBeenCalledTimes(2);
        expect(mocks.handler).toHaveBeenLastCalledWith(event, context, callback);
    }
);
