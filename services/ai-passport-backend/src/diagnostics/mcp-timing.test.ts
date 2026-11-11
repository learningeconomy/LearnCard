import { expect, test } from 'bun:test';

import { runWithMcpProgress } from './mcp-progress';
import { mcpTimingSnapshot, recordMcpCredentialCount, timeMcpStage } from './mcp-timing';
import { logSafeEvent } from '../logging';

test('stages are counted with summed ms, and a still-running stage counts up to now', async () => {
    const context = { tool: 'get_user_context' as const, requestId: 'req_timingunit01' };
    await runWithMcpProgress(context, async () => {
        recordMcpCredentialCount(3);
        await timeMcpStage('read', async () => undefined);
        await timeMcpStage('read', async () => undefined);
        void timeMcpStage('llm', () => new Promise(() => undefined));
    });
    const snapshot = mcpTimingSnapshot(context);
    expect(snapshot.credentialCount).toBe(3);
    expect(snapshot.stageTimings.read?.count).toBe(2);
    expect(snapshot.stageTimings.llm?.count).toBe(1);
    expect(Object.keys(snapshot.stageTimings).sort()).toEqual(['llm', 'read']);
});

test('outside an MCP call, timing is a pass-through', async () => {
    expect(await timeMcpStage('read', async () => 7)).toBe(7);
});

test('mcp_tool_timing keeps allowlisted stage keys and integer counts only', () => {
    const lines: unknown[] = [];
    const originalInfo = console.info;
    console.info = ((...data: unknown[]) => {
        lines.push(...data);
    }) as typeof console.info;
    try {
        logSafeEvent('info', 'mcp_tool_timing', {
            mcpTool: 'get_user_context',
            mcpRequestId: 'req_timingunit01',
            mcpOutcome: 'timeout',
            durationMs: 20_100,
            credentialCount: 140,
            stageTimings: {
                read: { count: 40, ms: 5_000 },
                verify: { count: 40, ms: 1.5 },
                'did:example:private': { count: 1, ms: 1 },
            } as never,
        });
    } finally {
        console.info = originalInfo;
    }
    expect(lines).toEqual([
        {
            event: 'mcp_tool_timing',
            mcpTool: 'get_user_context',
            mcpRequestId: 'req_timingunit01',
            mcpOutcome: 'timeout',
            durationMs: 20_100,
            credentialCount: 140,
            stageTimings: { read: { count: 40, ms: 5_000 } },
        },
    ]);
});
