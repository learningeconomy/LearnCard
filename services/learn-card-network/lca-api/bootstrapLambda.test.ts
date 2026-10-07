import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ load: vi.fn(), imported: vi.fn(), handler: vi.fn() }));
vi.mock('./src/config/runtimeSecrets', () => ({ loadRuntimeSecrets: mocks.load }));
vi.mock('./lambdaApp', () => {
    mocks.imported();
    return Object.fromEntries(
        ['trpcHandler', 'openApiHandler', 'swaggerUiHandler', 'didWebHandler', 'oidcHandler'].map(
            name => [name, mocks.handler]
        )
    );
});

beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.load.mockResolvedValue(undefined);
    mocks.handler.mockResolvedValue({ statusCode: 200 });
});

it('does not import the app before secrets resolve; shares bootstrap and forwards all arguments', async () => {
    let release: () => void = () => {};
    mocks.load.mockReturnValue(
        new Promise<void>(resolve => {
            release = resolve;
        })
    );
    const lambda = await import('./lambda');
    const event = { source: 'serverless-plugin-warmup' } as unknown as APIGatewayProxyEventV2;
    const context = {} as Context;
    const callback = vi.fn();
    expect(mocks.imported).not.toHaveBeenCalled();
    const invocations = [
        lambda.trpcHandler(event, context, callback),
        lambda.openApiHandler(event, context, callback),
    ];
    expect(mocks.imported).not.toHaveBeenCalled();
    release();
    await expect(Promise.all(invocations)).resolves.toEqual([
        { statusCode: 200 },
        { statusCode: 200 },
    ]);
    for (const handler of [lambda.swaggerUiHandler, lambda.didWebHandler, lambda.oidcHandler]) {
        await handler(event, context);
    }
    // loadRuntimeSecrets memoizes internally; the app module is imported exactly once.
    expect(mocks.imported).toHaveBeenCalledTimes(1);
    expect(mocks.handler).toHaveBeenCalledTimes(5);
    expect(mocks.handler).toHaveBeenCalledWith(event, context, callback);
});

it('does not import the app on failure and retries bootstrap on the next invocation', async () => {
    mocks.load.mockRejectedValueOnce(new Error('Unable to load runtime secrets bundle'));
    const { oidcHandler } = await import('./lambda');
    await expect(oidcHandler({}, {} as Context)).rejects.toThrow(
        'Unable to load runtime secrets bundle'
    );
    expect(mocks.imported).not.toHaveBeenCalled();
    await expect(oidcHandler({}, {} as Context)).resolves.toEqual({ statusCode: 200 });
    expect(mocks.load).toHaveBeenCalledTimes(2);
});
