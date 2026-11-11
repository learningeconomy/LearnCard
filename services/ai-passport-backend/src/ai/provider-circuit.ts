import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { AI_PROVIDER_QUOTA_COOLDOWN_SECONDS, REDIS_PREFIX } from '../constants/env';
import cache from '../utils/cache';
import { AiProviderError, normalizeAiProviderError, type AiErrorCode } from './errors';

type CircuitStore = Pick<Redis, 'del' | 'get' | 'set'>;

type CircuitState = {
    code: Extract<AiErrorCode, 'ai_provider_quota_exhausted'>;
    openedAt: number;
    retryAt: number;
};

type CircuitPermit = { mode: 'closed' } | { mode: 'probe'; token: string };

const PROBE_TTL_MS = 30_000;

export class AiProviderCircuit {
    private readonly localStates = new Map<string, CircuitState>();
    private readonly localProbes = new Map<string, number>();

    constructor(
        private readonly store: CircuitStore = cache.redis ?? cache.node,
        private readonly cooldownMs = AI_PROVIDER_QUOTA_COOLDOWN_SECONDS * 1000,
        private readonly prefix = REDIS_PREFIX,
        private readonly now = Date.now
    ) {}

    private stateKey(provider: string): string {
        return `${this.prefix}:ai-provider-circuit:${provider}:state`;
    }

    private probeKey(provider: string): string {
        return `${this.prefix}:ai-provider-circuit:${provider}:probe`;
    }

    private async getState(provider: string): Promise<CircuitState | undefined> {
        try {
            const value = await this.store.get(this.stateKey(provider));

            if (!value) return this.localStates.get(provider);

            const parsed = JSON.parse(value) as CircuitState;
            this.localStates.set(provider, parsed);

            return parsed;
        } catch {
            return this.localStates.get(provider);
        }
    }

    private async setState(provider: string, state: CircuitState): Promise<void> {
        this.localStates.set(provider, state);

        try {
            await this.store.set(this.stateKey(provider), JSON.stringify(state));
        } catch {
            // The process-local state still prevents a tight retry loop during Redis outages.
        }
    }

    private async clearState(provider: string): Promise<void> {
        this.localStates.delete(provider);
        this.localProbes.delete(provider);

        try {
            await this.store.del(this.stateKey(provider), this.probeKey(provider));
        } catch {
            // The local circuit is already closed; Redis recovery will overwrite stale state.
        }
    }

    private async releaseProbe(provider: string): Promise<void> {
        this.localProbes.delete(provider);

        try {
            await this.store.del(this.probeKey(provider));
        } catch {
            // The probe key has a short TTL, so a failed delete cannot lock recovery forever.
        }
    }

    private async acquireProbe(provider: string): Promise<boolean> {
        const now = this.now();
        const localProbeUntil = this.localProbes.get(provider) ?? 0;

        if (localProbeUntil > now) return false;

        const token = randomUUID();

        try {
            const acquired = await this.store.set(
                this.probeKey(provider),
                token,
                'PX',
                PROBE_TTL_MS,
                'NX'
            );

            if (acquired !== 'OK') return false;
        } catch {
            this.localProbes.set(provider, now + PROBE_TTL_MS);

            return true;
        }

        this.localProbes.set(provider, now + PROBE_TTL_MS);

        return true;
    }

    async assertAvailable(provider: string): Promise<CircuitPermit> {
        const state = await this.getState(provider);

        if (!state) return { mode: 'closed' };

        if (state.retryAt > this.now() || !(await this.acquireProbe(provider))) {
            throw new AiProviderError({
                code: state.code,
                provider,
                retryable: false,
                httpStatus: 503,
            });
        }

        return { mode: 'probe', token: randomUUID() };
    }

    async recordSuccess(provider: string, permit: CircuitPermit): Promise<void> {
        if (permit.mode === 'probe') await this.clearState(provider);
    }

    async recordFailure(
        provider: string,
        permit: CircuitPermit,
        error: AiProviderError
    ): Promise<void> {
        if (error.code === 'ai_provider_quota_exhausted') {
            const openedAt = this.now();

            await this.setState(provider, {
                code: error.code,
                openedAt,
                retryAt: openedAt + this.cooldownMs,
            });

            if (permit.mode === 'probe') await this.releaseProbe(provider);

            console.warn('AI provider quota circuit opened', {
                provider,
                code: error.code,
                retryAt: openedAt + this.cooldownMs,
            });

            return;
        }

        if (permit.mode === 'probe') await this.clearState(provider);
    }

    async execute<T>(
        provider: string,
        operation: () => Promise<T>,
        options: { signal?: AbortSignal } = {}
    ): Promise<T> {
        const permit = await this.assertAvailable(provider);

        try {
            const result = await operation();

            await this.recordSuccess(provider, permit);

            return result;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error;
            /* The caller's own deadline is not a provider failure: hand it on as is.
         The SDK's request timeout also names itself TimeoutError, but fires
         while the caller's signal is still live, so it is still counted. */
            if (error instanceof Error && error.name === 'TimeoutError' && options.signal?.aborted)
                throw error;

            const normalized = normalizeAiProviderError(error, provider);

            await this.recordFailure(provider, permit, normalized);

            throw normalized;
        }
    }

    async reset(provider: string): Promise<void> {
        await this.clearState(provider);
    }
}

export const aiProviderCircuit = new AiProviderCircuit();

export const withAiProviderCircuit = <T>(
    provider: string,
    operation: () => Promise<T>,
    options?: { signal?: AbortSignal }
): Promise<T> => aiProviderCircuit.execute(provider, operation, options);
