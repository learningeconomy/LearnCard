import { describe, expect, it, spyOn } from 'bun:test';
import MemoryRedis from 'ioredis-mock';
import { AiProviderCircuit } from './provider-circuit';

describe('AI provider quota circuit', () => {
    it('blocks concurrent calls after quota exhaustion and recovers through one probe', async () => {
        const store = new MemoryRedis();
        let now = 1_000;
        const circuit = new AiProviderCircuit(store, 20, 'circuit-test', () => now);
        let providerCalls = 0;

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                throw {
                    status: 429,
                    error: { code: 'insufficient_quota' },
                };
            })
        ).rejects.toMatchObject({
            code: 'ai_provider_quota_exhausted',
            retryable: false,
        });

        const blocked = await Promise.allSettled(
            Array.from({ length: 20 }, () =>
                circuit.execute('openai', async () => {
                    providerCalls += 1;

                    return 'unexpected';
                })
            )
        );

        expect(providerCalls).toBe(1);
        expect(blocked.every(({ status }) => status === 'rejected')).toBe(true);

        now += 21;

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                return 'recovered';
            })
        ).resolves.toBe('recovered');

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                return 'closed';
            })
        ).resolves.toBe('closed');

        expect(providerCalls).toBe(3);
    });

    it('does not open for transient rate limiting', async () => {
        const circuit = new AiProviderCircuit(new MemoryRedis(), 20, 'transient-test');
        let providerCalls = 0;

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                throw { status: 429, code: 'rate_limit_exceeded' };
            })
        ).rejects.toMatchObject({
            code: 'ai_provider_rate_limited',
            retryable: true,
        });

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                return 'retried';
            })
        ).resolves.toBe('retried');

        expect(providerCalls).toBe(2);
    });
    it('clears stale quota state when a recovery probe finds a transient failure', async () => {
        let now = 1_000;
        const circuit = new AiProviderCircuit(
            new MemoryRedis(),
            20,
            'probe-classification-test',
            () => now
        );
        let providerCalls = 0;

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                throw { status: 429, code: 'insufficient_quota' };
            })
        ).rejects.toMatchObject({ code: 'ai_provider_quota_exhausted' });

        now += 21;

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                throw { status: 429, code: 'rate_limit_exceeded' };
            })
        ).rejects.toMatchObject({ code: 'ai_provider_rate_limited' });

        await expect(
            circuit.execute('openai', async () => {
                providerCalls += 1;

                return 'recovered';
            })
        ).resolves.toBe('recovered');

        expect(providerCalls).toBe(3);
    });

    it('preserves abort errors', async () => {
        const circuit = new AiProviderCircuit(new MemoryRedis(), 20, 'abort-test');
        const abort = new DOMException('Superseded', 'AbortError');

        await expect(
            circuit.execute('openai', async () => {
                throw abort;
            })
        ).rejects.toBe(abort);
    });

    it("hands the caller's own deadline back unchanged and does not record it", async () => {
        const circuit = new AiProviderCircuit(new MemoryRedis(), 20, 'deadline-test');
        const recordFailure = spyOn(circuit, 'recordFailure');
        const deadline = new AbortController();
        const reason = new DOMException('Session plan deadline exceeded', 'TimeoutError');
        deadline.abort(reason);

        await expect(
            circuit.execute(
                'bedrock-embeddings',
                async () => {
                    throw reason;
                },
                { signal: deadline.signal }
            )
        ).rejects.toBe(reason);
        expect(recordFailure).not.toHaveBeenCalled();
    });

    it("still classifies and records the SDK's own request timeout", async () => {
        const circuit = new AiProviderCircuit(new MemoryRedis(), 20, 'sdk-timeout-test');
        const recordFailure = spyOn(circuit, 'recordFailure');
        const live = new AbortController();
        const sdkTimeout = Object.assign(new Error('Embedding request timeout'), {
            name: 'TimeoutError',
        });

        await expect(
            circuit.execute(
                'bedrock-embeddings',
                async () => {
                    throw sdkTimeout;
                },
                { signal: live.signal }
            )
        ).rejects.toMatchObject({
            name: 'AiProviderError',
            code: 'ai_request_timeout',
        });
        expect(recordFailure).toHaveBeenCalledTimes(1);
    });
});
