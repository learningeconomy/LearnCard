import { expect, test } from 'bun:test';
import { createReadGenerationControl, type ReadGenerationConfig } from './read-generation-control';
const defaults: ReadGenerationConfig = {
    enabled: true,
    configured: 'openai1536',
    sdkKey: 'synthetic-key',
    flagKey: 'embedding-generation',
    environment: 'test',
    novaEnabled: true,
};
test('disabled integration uses strict deployment config; enabled missing config fails safely without initialization', async () => {
    let calls = 0;
    const initialize = () => {
        calls += 1;
        throw Error('should not initialize');
    };
    for (const config of [
        { ...defaults, enabled: false },
        { ...defaults, sdkKey: undefined },
        { ...defaults, environment: 'did:web:learner' },
    ]) {
        const result = await createReadGenerationControl(() => config, initialize).resolve();
        expect(result.effective).toBe('openai1536');
        expect(result.degraded).toBe(config.enabled);
    }
    expect(calls).toBe(0);
});
test('startup timeout is bounded, shared across callers and stays on OpenAI until restart', async () => {
    let initialized = 0,
        evaluations = 0;
    const control = createReadGenerationControl(
        () => defaults,
        () => {
            initialized += 1;
            return {
                waitForInitialization: () => new Promise(() => {}),
                variationDetail: async () => {
                    evaluations += 1;
                    return { value: 'nova1024v1', reason: { kind: 'OFF' } };
                },
                close() {},
            };
        },
        5
    );
    const results = await Promise.all([control.resolve(), control.resolve()]);
    for (const result of results)
        expect(result).toMatchObject({
            effective: 'openai1536',
            degraded: true,
            reason: 'flag_initialization_failed',
        });
    expect(initialized).toBe(1);
    expect(evaluations).toBe(0);
    expect((await control.resolve()).degraded).toBe(true);
    await control.close();
});
test('allowlisted values, errors and provider disable have explicit safe fallbacks and no learner targeting', async () => {
    let value: unknown = 'nova1024v1',
        kind = 'OFF',
        throws = false,
        config = { ...defaults };
    const contexts: unknown[] = [];
    const control = createReadGenerationControl(
        () => config,
        () => ({
            waitForInitialization: async () => {},
            variationDetail: async (_flag, context) => {
                contexts.push(context);
                if (throws) throw Error('private transport details');
                return { value, reason: { kind } };
            },
            close() {},
        })
    );
    expect((await control.resolve()).effective).toBe('nova1024v1');
    for (const invalid of [true, false, 'Nova', 1024, null]) {
        value = invalid;
        expect(await control.resolve()).toMatchObject({
            effective: 'openai1536',
            degraded: true,
            reason: 'flag_value_invalid',
        });
    }
    value = 'nova1024v1';
    kind = 'ERROR';
    expect((await control.resolve()).reason).toBe('flag_evaluation_failed');
    kind = 'OFF';
    throws = true;
    expect(JSON.stringify(await control.resolve())).not.toContain('private transport');
    throws = false;
    config = { ...config, novaEnabled: false };
    expect((await control.resolve()).reason).toBe('nova_provider_disabled');
    config = { ...defaults, sdkKey: 'different' };
    expect((await control.resolve()).reason).toBe('sdk_configuration_changed');
    expect(
        contexts.every(
            context =>
                JSON.stringify(context) ===
                JSON.stringify({ kind: 'application', key: 'ai-passport-test' })
        )
    ).toBe(true);
    await control.close();
});
test('once legacy writes are retired, every degraded or OpenAI decision stays on Nova', async () => {
    const retired = {
        ...defaults,
        configured: 'nova1024v1' as const,
        legacyRetired: true,
    };
    const flag =
        (value: unknown, kind = 'RULE_MATCH') =>
        () => ({
            waitForInitialization: async () => undefined,
            variationDetail: async () => ({ value, reason: { kind } }),
            close() {},
        });
    const failing = () => {
        throw Error('startup failed');
    };
    for (const [config, initialize, reason] of [
        [{ ...retired, sdkKey: undefined }, failing, 'flag_configuration_missing'],
        [retired, failing, 'flag_evaluation_failed'],
        [retired, flag('openai1536'), 'legacy_generation_retired'],
        [retired, flag('gpt'), 'flag_value_invalid'],
        [retired, flag('nova1024v1', 'ERROR'), 'flag_evaluation_failed'],
    ] as const) {
        const result = await createReadGenerationControl(
            () => config,
            initialize as never
        ).resolve();
        expect(result).toMatchObject({
            effective: 'nova1024v1',
            degraded: true,
            reason,
        });
    }
    expect(
        await createReadGenerationControl(() => retired, flag('nova1024v1')).resolve()
    ).toMatchObject({ effective: 'nova1024v1', degraded: false });
    // Without retirement the OpenAI fallback is unchanged.
    expect(await createReadGenerationControl(() => defaults, flag('gpt')).resolve()).toMatchObject({
        effective: 'openai1536',
        degraded: true,
    });
});
