import { expect, mock, test } from 'bun:test';
import { LearnCardTimeoutError } from '../learncard/errors';
import { reuseRequestConsentRead } from '../learncard/requestScope';

mock.module('../services/dataErasure', () => ({
    withOwnerOperation: async (_did: string, operation: () => Promise<unknown>) => operation(),
}));
mock.module('../ai/privacy', () => ({
    runWithAiPrivacyContext: (_did: string, operation: () => Promise<unknown>) => operation(),
}));

const { runMcpOwnerOperation } = await import('./ownerOperation');

test('MCP owner operations share one consent contract read for the request', async () => {
    let reads = 0;
    const read = async () => {
        reads += 1;
        return reads;
    };

    await runMcpOwnerOperation('did:example:alice', async () => {
        expect(
            await Promise.all([
                reuseRequestConsentRead('did:example:alice', read),
                reuseRequestConsentRead('did:example:alice', read),
            ])
        ).toEqual([1, 1]);
        expect(await reuseRequestConsentRead('did:example:alice', read)).toBe(1);
        return 'ok';
    });

    // Outside an MCP operation there is still no request scope, so each read
    // hits the network again — the same as in-app code outside a request.
    expect(await reuseRequestConsentRead('did:example:alice', read)).toBe(2);
    expect(await reuseRequestConsentRead('did:example:alice', read)).toBe(3);
});

test('MCP owner operations time out a hung tool well under the client deadline', async () => {
    const previous = process.env.MCP_TOOL_TIMEOUT_MS;
    process.env.MCP_TOOL_TIMEOUT_MS = '40';
    const started = Date.now();
    try {
        const error = await runMcpOwnerOperation(
            'did:example:alice',
            () => new Promise(() => {})
        ).then(
            () => undefined,
            (value: unknown) => value
        );
        expect(error).toBeInstanceOf(LearnCardTimeoutError);
        expect(Date.now() - started).toBeLessThan(1000);
    } finally {
        if (previous === undefined) delete process.env.MCP_TOOL_TIMEOUT_MS;
        else process.env.MCP_TOOL_TIMEOUT_MS = previous;
    }
});

test('MCP startup warms the shared LearnCard instance the same way the API does', async () => {
    const mcp = await Bun.file(new URL('./index.ts', import.meta.url)).text();
    const api = await Bun.file(new URL('../index.ts', import.meta.url)).text();
    expect(mcp).toContain('getLearnCard.warm');
    expect(api).toContain('getLearnCard.warm');
    expect(mcp).toContain('learncard_warm_ready');
});
