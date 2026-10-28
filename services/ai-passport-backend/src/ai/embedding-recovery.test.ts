import { afterEach, expect, mock, spyOn, test } from 'bun:test';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import {
    withEmbeddingRecovery,
    managedEmbeddingTimeout,
    waitForEmbeddingRetry,
    type EmbeddingRecovery,
} from './embedding-recovery';
import { createUsageMeter, withUsageMeter } from './usage-meter';
const consent = mock(async () => {});
mock.module('./privacy', () => ({ assertCurrentAiConsent: consent }));
const { novaEmbeddings } = await import('./nova-embeddings');
process.env.AWS_REGION = 'us-east-1';
process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
for (const key of [
    'AWS_ENDPOINT_URL',
    'AWS_ENDPOINT_URL_BEDROCK',
    'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
])
    delete process.env[key];
afterEach(() => {
    mock.restore();
    consent.mockReset();
    consent.mockImplementation(async () => {});
});
const vector = () => ({
    body: new TextEncoder().encode(
        JSON.stringify({
            embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
        })
    ),
});
const timeout = () =>
    Object.assign(new Error('Stream timed out because of no activity for 15000 ms'), {
        name: 'TimeoutError',
    });
function scope() {
    const attempts = new Map<number, number>();
    const recovery: EmbeddingRecovery = {
        deadline: Date.now() + 360000,
        reserve: async ordinal => {
            const count = attempts.get(ordinal) ?? 0;
            if (count >= 3) throw new Error('exhausted');
            attempts.set(ordinal, count + 1);
        },
        failed: async ordinal => (attempts.get(ordinal) ?? 0) < 3,
    };
    return { recovery, attempts };
}
test('SDK timeout recovers only failed ordinal, retaining earlier vectors and requests', async () => {
    const { recovery, attempts } = scope();
    let calls = 0;
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async (_command, options) => {
            expect(typeof options === 'object' ? options.requestTimeout : undefined).toBe(60000);
            calls += 1;
            if (calls === 2) throw timeout();
            return vector() as never;
        }
    );
    const meter = createUsageMeter();
    const result = await withUsageMeter(meter, () =>
        withEmbeddingRecovery(recovery, () =>
            novaEmbeddings(['first', 'second', 'third'], 'document')
        )
    );
    expect(result).toHaveLength(3);
    expect(send).toHaveBeenCalledTimes(4);
    expect([...attempts]).toEqual([
        [1, 1],
        [2, 2],
        [3, 1],
    ]);
    expect(meter.embedding.requests).toBe(4);
});
test('exhaustion stops at three calls; nontransient validation and auth errors never retry', async () => {
    for (const raw of [
        timeout(),
        Object.assign(new Error('denied'), { $metadata: { httpStatusCode: 403 } }),
    ]) {
        const { recovery } = scope();
        const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
            throw raw;
        });
        await expect(
            withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document'))
        ).rejects.toBe(raw);
        expect(send).toHaveBeenCalledTimes(raw.name === 'TimeoutError' ? 3 : 1);
        send.mockRestore();
    }
    const { recovery } = scope();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async () => ({ body: new TextEncoder().encode('{}') }) as never
    );
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document'))
    ).rejects.toThrow('Invalid Nova');
    expect(send).toHaveBeenCalledTimes(1);
});
test('caller cancellation never retries; cancellation interrupts durable backoff', async () => {
    const { recovery } = scope();
    const caller = new AbortController();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        caller.abort();
        throw timeout();
    });
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document', caller.signal))
    ).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
    const controller = new AbortController();
    const wait = waitForEmbeddingRetry(Date.now() + 60000, controller.signal);
    controller.abort();
    await expect(wait).rejects.toThrow();
});
test('remaining deadline caps attempt and protects finalization; queries/ordinary calls retain 15s config and no retries', async () => {
    expect(managedEmbeddingTimeout(360000, 0)).toBe(60000);
    expect(managedEmbeddingTimeout(360000, 330000)).toBe(15000);
    expect(() => managedEmbeddingTimeout(360000, 345000)).toThrow();
    const { recovery } = scope();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        throw timeout();
    });
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['query'], 'query'))
    ).rejects.toThrow();
    await expect(novaEmbeddings(['ordinary'], 'document')).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(2);
});
test('budget and consent denial after backoff prevent another transport call', async () => {
    const { recovery } = scope();
    let reserves = 0;
    recovery.reserve = async () => {
        reserves += 1;
        if (reserves > 1) throw new Error('budget exhausted');
    };
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        throw timeout();
    });
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document'))
    ).rejects.toThrow('budget exhausted');
    expect(send).toHaveBeenCalledTimes(1);
});

test('attempt deadline aborts stalled SDK while caller stays active and cannot spend finalization reserve', async () => {
    const { recovery } = scope();
    recovery.deadline = Date.now() + 15_050;
    const caller = new AbortController();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async (_command, options) => {
            if (typeof options !== 'object' || !(options.abortSignal instanceof AbortSignal))
                throw new Error('Missing attempt signal');
            const signal = options.abortSignal;
            return await new Promise<never>((_resolve, reject) => {
                signal.addEventListener(
                    'abort',
                    () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
                    { once: true }
                );
            });
        }
    );
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document', caller.signal))
    ).rejects.toThrow('finalization deadline');
    expect(caller.signal.aborted).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
});

test('consent revoked during reservation prevents dispatch and automatic retry', async () => {
    const { recovery } = scope();
    recovery.reserve = async () => {
        consent.mockImplementation(async () => {
            throw new Error('consent revoked');
        });
    };
    const send = spyOn(BedrockRuntimeClient.prototype, 'send');
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(['first'], 'document'))
    ).rejects.toThrow('consent revoked');
    expect(send).not.toHaveBeenCalled();
});

test('managed group preserves ordinal order with five bounded in-flight calls', async () => {
    const { recovery } = scope();
    let active = 0,
        peak = 0;
    const pending: (() => void)[] = [];
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        const ordinal = pending.length;
        active += 1;
        peak = Math.max(peak, active);
        return await new Promise<never>(resolve => {
            pending.push(() => {
                active -= 1;
                const embedding = Array(1024).fill(0);
                embedding[ordinal] = 1;
                resolve({
                    body: new TextEncoder().encode(
                        JSON.stringify({ embeddings: [{ embeddingType: 'TEXT', embedding }] })
                    ),
                } as never);
            });
            if (pending.length === 5) for (const finish of [...pending].reverse()) finish();
        });
    });
    const result = await withEmbeddingRecovery(recovery, () =>
        novaEmbeddings(['a', 'b', 'c', 'd', 'e'], 'document')
    );
    expect(peak).toBe(5);
    expect(active).toBe(0);
    expect(send).toHaveBeenCalledTimes(5);
    for (let i = 0; i < 5; i += 1) expect(result[i]?.[i]).toBe(1);
    await expect(
        withEmbeddingRecovery(recovery, () => novaEmbeddings(Array(6).fill('bounded'), 'document'))
    ).rejects.toThrow('ordinal bound');
    expect(send).toHaveBeenCalledTimes(5);
});

test('fatal group failure aborts and drains siblings before returning the triggering error', async () => {
    const { recovery } = scope();
    const started = Promise.withResolvers<void>(),
        release = Promise.withResolvers<void>();
    const original = Object.assign(new Error('synthetic access denied'), {
        $metadata: { httpStatusCode: 403 },
    });
    let count = 0,
        drained = 0,
        finished = false;
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async (_command, options) => {
            const ordinal = count;
            count += 1;
            if (count === 5) started.resolve();
            await started.promise;
            if (ordinal === 4) throw original;
            if (typeof options !== 'object' || !(options.abortSignal instanceof AbortSignal))
                throw new Error('Missing signal');
            const signal = options.abortSignal;
            try {
                await new Promise<never>((_resolve, reject) => {
                    const abort = () =>
                        reject(
                            Object.assign(new Error('synthetic group abort'), {
                                name: 'AbortError',
                            })
                        );
                    if (signal.aborted) abort();
                    else signal.addEventListener('abort', abort, { once: true });
                });
            } finally {
                await release.promise;
                drained += 1;
            }
        }
    );
    const work = withEmbeddingRecovery(recovery, () =>
        novaEmbeddings(['a', 'b', 'c', 'd', 'e'], 'document')
    ).catch(error => {
        finished = true;
        return error;
    });
    await started.promise;
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(finished).toBe(false);
    release.resolve();
    expect(await work).toBe(original);
    expect(drained).toBe(4);
    expect(send).toHaveBeenCalledTimes(5);
});
