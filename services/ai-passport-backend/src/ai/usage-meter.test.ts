import { expect, test } from 'bun:test';
import {
    createUsageMeter,
    recordUsageRequest,
    reserveProviderRequest,
    usageField,
    withProviderBudget,
    withUsageMeter,
    type UsageKind,
} from './usage-meter';

test('usage is serializable numeric aggregates only, with once-only recording', () => {
    const meter = createUsageMeter();
    withUsageMeter(meter, () => {
        const generation = recordUsageRequest('generation');
        generation({
            inputTokens: 23,
            outputTokens: 7,
            text: 'private',
            requestId: 'secret',
        });
        generation({ inputTokens: 23, outputTokens: 7 });
        recordUsageRequest('embedding')({ inputTokens: 5 });
        recordUsageRequest('privacy')({ textUnits: 3, freeTextUnits: 1 });
    });
    expect(JSON.parse(JSON.stringify(meter))).toEqual({
        generation: {
            requests: 1,
            measuredRequests: 1,
            inputTokens: 23,
            outputTokens: 7,
        },
        embedding: { requests: 1, measuredRequests: 1, inputTokens: 5 },
        privacy: {
            requests: 1,
            measuredRequests: 1,
            textUnits: 3,
            freeTextUnits: 1,
        },
    });
});

test('requests without responses and malformed usage stay unmeasured', () => {
    const meter = createUsageMeter();
    withUsageMeter(meter, () => {
        recordUsageRequest('generation');
        for (const value of [
            undefined,
            null,
            '7',
            -1,
            1.5,
            NaN,
            Infinity,
            1_000_000_001,
            Number.MAX_SAFE_INTEGER,
        ]) {
            recordUsageRequest('generation')({ inputTokens: value, outputTokens: 1 });
            recordUsageRequest('embedding')({ inputTokens: value });
            recordUsageRequest('privacy')({ textUnits: 1, freeTextUnits: value });
        }
        const invalid = recordUsageRequest('generation');
        invalid({ inputTokens: 3 });
        invalid({ inputTokens: 3, outputTokens: 2 });
    });
    expect(meter.generation).toEqual({
        requests: 11,
        measuredRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
    });
    expect(meter.embedding).toEqual({
        requests: 9,
        measuredRequests: 0,
        inputTokens: 0,
    });
    expect(meter.privacy).toEqual({
        requests: 9,
        measuredRequests: 0,
        textUnits: 0,
        freeTextUnits: 0,
    });
});

test('explicit provider zero is measured; missing data is not', () => {
    const meter = createUsageMeter();
    withUsageMeter(meter, () => {
        recordUsageRequest('generation')({ inputTokens: 0, outputTokens: 0 });
        recordUsageRequest('embedding')({ inputTokens: 0 });
        recordUsageRequest('privacy')({ textUnits: 0, freeTextUnits: 0 });
    });
    for (const bucket of Object.values(meter)) expect(bucket.measuredRequests).toBe(1);
});

test('getters, inherited fields and hostile objects cannot affect telemetry or throw', () => {
    const meter = createUsageMeter();
    let accessed = false;
    const getter = {
        get inputTokens() {
            accessed = true;
            throw new Error('private');
        },
    };
    const proxy = new Proxy(
        {},
        {
            getOwnPropertyDescriptor() {
                throw new Error('private');
            },
        }
    );
    withUsageMeter(meter, () => {
        recordUsageRequest('embedding')(getter);
        recordUsageRequest('embedding')(Object.create({ inputTokens: 3 }));
        recordUsageRequest('embedding')(proxy);
    });
    expect(accessed).toBe(false);
    expect(meter.embedding.measuredRequests).toBe(0);
    expect(usageField(proxy, 'usage')).toBeUndefined();
    // Unscoped telemetry does not inspect usage at all.
    expect(() => recordUsageRequest('embedding')(getter)).not.toThrow();
    expect(accessed).toBe(false);
});

test('parallel and nested record scopes remain isolated, including delayed callbacks', async () => {
    const left = createUsageMeter();
    const right = createUsageMeter();
    const nested = createUsageMeter();
    const wait = Promise.withResolvers<void>();
    await Promise.all([
        withUsageMeter(left, async () => {
            const record = recordUsageRequest('generation');
            await wait.promise;
            record({ inputTokens: 11, outputTokens: 2 });
            await withUsageMeter(nested, async () => {
                await Promise.resolve();
                recordUsageRequest('embedding')({ inputTokens: 4 });
            });
            recordUsageRequest('privacy')({ textUnits: 1, freeTextUnits: 0 });
        }),
        withUsageMeter(right, async () => {
            await Promise.resolve();
            recordUsageRequest('generation')({ inputTokens: 5, outputTokens: 1 });
            wait.resolve();
        }),
    ]);
    expect(left.generation.inputTokens).toBe(11);
    expect(left.embedding.requests).toBe(0);
    expect(left.privacy.requests).toBe(1);
    expect(right.generation.inputTokens).toBe(5);
    expect(right.privacy.requests).toBe(0);
    expect(nested.embedding.inputTokens).toBe(4);
    recordUsageRequest('generation')({ inputTokens: 99, outputTokens: 99 });
    expect(left.generation.requests).toBe(1);
    expect(right.generation.requests).toBe(1);
});

test('scope preserves return values and errors; failed attempts retain known usage', async () => {
    const meter = createUsageMeter();
    expect(withUsageMeter(meter, () => 42)).toBe(42);
    const failure = new Error('synthetic failure');
    await expect(
        withUsageMeter(meter, async () => {
            recordUsageRequest('generation')({ inputTokens: 3, outputTokens: 1 });
            throw failure;
        })
    ).rejects.toBe(failure);
    expect(meter.generation.measuredRequests).toBe(1);
});

test('aggregate overflow is rejected without partial mutation', () => {
    const meter = createUsageMeter();
    meter.generation.outputTokens = Number.MAX_SAFE_INTEGER;
    withUsageMeter(meter, () =>
        recordUsageRequest('generation')({ inputTokens: 1, outputTokens: 1 })
    );
    expect(meter.generation).toEqual({
        requests: 1,
        measuredRequests: 0,
        inputTokens: 0,
        outputTokens: Number.MAX_SAFE_INTEGER,
    });
});

test('provider budget is optional and does not mutate usage telemetry', async () => {
    await expect(reserveProviderRequest('generation')).resolves.toBeUndefined();
    const meter = createUsageMeter();
    const reservations: UsageKind[] = [];
    await withUsageMeter(meter, () =>
        withProviderBudget(
            async kind => {
                reservations.push(kind);
            },
            async () => {
                await reserveProviderRequest('generation');
                await reserveProviderRequest('embedding');
                await reserveProviderRequest('privacy');
            }
        )
    );
    expect(reservations).toEqual(['generation', 'embedding', 'privacy']);
    expect(meter).toEqual(createUsageMeter());
    await reserveProviderRequest('generation');
    expect(reservations).toHaveLength(3);
});

test('provider budget awaits reservations and preserves return values and failures', async () => {
    const approved = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    let dispatched = false;
    const pending = withProviderBudget(
        async () => {
            entered.resolve();
            await approved.promise;
        },
        async () => {
            await reserveProviderRequest('embedding');
            dispatched = true;
            return 42;
        }
    );
    await entered.promise;
    expect(dispatched).toBe(false);
    approved.resolve();
    expect(await pending).toBe(42);
    expect(dispatched).toBe(true);
    expect(
        withProviderBudget(
            async () => {},
            () => 23
        )
    ).toBe(23);
    const failure = new Error('reservation rejected');
    await expect(
        withProviderBudget(
            async () => {
                throw failure;
            },
            () => reserveProviderRequest('privacy')
        )
    ).rejects.toBe(failure);
    await expect(
        withProviderBudget(
            async () => {},
            async () => {
                throw failure;
            }
        )
    ).rejects.toBe(failure);
});

test('parallel and nested provider budgets stay isolated and restore the outer scope', async () => {
    const left: UsageKind[] = [];
    const right: UsageKind[] = [];
    const nested: UsageKind[] = [];
    const wait = Promise.withResolvers<void>();
    await Promise.all([
        withProviderBudget(
            async kind => {
                left.push(kind);
            },
            async () => {
                await reserveProviderRequest('generation');
                await wait.promise;
                await withProviderBudget(
                    async kind => {
                        nested.push(kind);
                    },
                    async () => {
                        await Promise.resolve();
                        await reserveProviderRequest('embedding');
                    }
                );
                await expect(
                    withProviderBudget(
                        async () => {
                            throw new Error('denied');
                        },
                        () => reserveProviderRequest('generation')
                    )
                ).rejects.toThrow('denied');
                await reserveProviderRequest('privacy');
            }
        ),
        withProviderBudget(
            async kind => {
                right.push(kind);
            },
            async () => {
                await Promise.resolve();
                await reserveProviderRequest('embedding');
                wait.resolve();
            }
        ),
    ]);
    await reserveProviderRequest('generation');
    expect(left).toEqual(['generation', 'privacy']);
    expect(right).toEqual(['embedding']);
    expect(nested).toEqual(['embedding']);
});
