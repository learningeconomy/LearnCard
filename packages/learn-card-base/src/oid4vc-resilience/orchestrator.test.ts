import { describe, expect, it, vi } from 'vitest';

import { runWithRecovery } from './orchestrator';
import type { OrchestratorTelemetryEvent } from './types';

const makeVciError = (code: string, message: string): Error => {
    const err = new Error(message);
    err.name = 'VciError';
    (err as Error & { code?: string }).code = code;
    return err;
};

const makeFetchError = (): Error => {
    const err = new Error('Failed to fetch');
    err.name = 'TypeError';
    return err;
};

const sigResolutionFailure = (): Error =>
    makeVciError(
        'credential_request_failed',
        'No valid public key JWKs found in DID document for did:web:example'
    );

const SIG_RES_MESSAGE =
    'No valid public key JWKs found in DID document for did:web:example';

const collectTelemetry = () => {
    const events: OrchestratorTelemetryEvent[] = [];
    return {
        events,
        onTelemetry: (e: OrchestratorTelemetryEvent) => {
            events.push(e);
        },
    };
};

describe('runWithRecovery', () => {
    it('returns the runner result on first-attempt success', async () => {
        const result = await runWithRecovery(
            async () => 'ok',
            { availableSigners: ['did:web', 'did:key'] }
        );
        expect(result).toBe('ok');
    });

    it('falls back from did:web → did:key silently on signer-resolution failure', async () => {
        const runner = vi.fn(async ({ strategy }) => {
            if (strategy.id === 'did:web') throw sigResolutionFailure();
            return `success-via-${strategy.id}`;
        });

        const telemetry = collectTelemetry();
        const result = await runWithRecovery(runner, {
            availableSigners: ['did:web', 'did:key'],
        }, { onTelemetry: telemetry.onTelemetry });

        expect(result).toBe('success-via-did:key');
        expect(runner).toHaveBeenCalledTimes(2);
        const decisionEvents = telemetry.events.filter(e => e.type === 'decision_made');
        expect(decisionEvents).toHaveLength(1);
    });

    it('prompts the user before non-did:key signer fallback and respects refusal', async () => {
        const runner = vi.fn(async () => {
            throw sigResolutionFailure();
        });
        const onPrompt = vi.fn(async () => false);

        await expect(
            runWithRecovery(runner, { availableSigners: ['did:web', 'did:jwk'] }, { onPrompt })
        ).rejects.toThrow(SIG_RES_MESSAGE);

        expect(onPrompt).toHaveBeenCalledTimes(1);
        expect(runner).toHaveBeenCalledTimes(1);
    });

    it('continues after a prompt when the user accepts', async () => {
        const runner = vi.fn(async ({ strategy }) => {
            if (strategy.id === 'did:web') throw sigResolutionFailure();
            return `via-${strategy.id}`;
        });
        const onPrompt = vi.fn(async () => true);

        const result = await runWithRecovery(
            runner,
            { availableSigners: ['did:web', 'did:jwk'] },
            { onPrompt }
        );

        expect(result).toBe('via-did:jwk');
        expect(onPrompt).toHaveBeenCalledTimes(1);
        expect(runner).toHaveBeenCalledTimes(2);
    });

    it('retries transport errors with backoff up to the cap', async () => {
        let calls = 0;
        const runner = vi.fn(async () => {
            calls += 1;
            if (calls < 3) throw makeFetchError();
            return 'eventually-ok';
        });

        const result = await runWithRecovery(runner, { availableSigners: ['did:key'] });
        expect(result).toBe('eventually-ok');
        expect(runner).toHaveBeenCalledTimes(3);
    });

    it('rethrows the original raw error when exhausted, NOT the friendly version', async () => {
        const raw = makeFetchError();
        const runner = vi.fn(async () => {
            throw raw;
        });

        await expect(
            runWithRecovery(runner, { availableSigners: ['did:key'] })
        ).rejects.toBe(raw);
    });

    it('emits a complete telemetry trace for a fallback success', async () => {
        const runner = vi.fn(async ({ strategy }) => {
            if (strategy.id === 'did:web') throw sigResolutionFailure();
            return 'ok';
        });
        const telemetry = collectTelemetry();
        await runWithRecovery(
            runner,
            { availableSigners: ['did:web', 'did:key'] },
            { onTelemetry: telemetry.onTelemetry }
        );

        const types = telemetry.events.map(e => e.type);
        expect(types).toEqual([
            'attempt_started',
            'attempt_failed',
            'decision_made',
            'attempt_started',
            'attempt_succeeded',
        ]);
    });

    it('emits orchestrator_exhausted on terminal error', async () => {
        const runner = vi.fn(async () => {
            throw new Error('mysterious');
        });
        const telemetry = collectTelemetry();
        await expect(
            runWithRecovery(
                runner,
                { availableSigners: ['did:key'] },
                { onTelemetry: telemetry.onTelemetry }
            )
        ).rejects.toThrow();

        const exhaustedEvents = telemetry.events.filter(
            e => e.type === 'orchestrator_exhausted'
        );
        expect(exhaustedEvents).toHaveLength(1);
    });

    it('invokes onAttempt with the previous error from attempt 2 onward', async () => {
        const runner = vi.fn(async ({ strategy }) => {
            if (strategy.id === 'did:web') throw sigResolutionFailure();
            return 'ok';
        });
        const onAttempt = vi.fn();

        await runWithRecovery(
            runner,
            { availableSigners: ['did:web', 'did:key'] },
            { onAttempt }
        );

        expect(onAttempt).toHaveBeenCalledTimes(2);
        expect(onAttempt.mock.calls[0][0].previousError).toBeUndefined();
        expect(onAttempt.mock.calls[0][0].attemptNumber).toBe(1);
        expect(onAttempt.mock.calls[1][0].previousError?.kind).toBeDefined();
        expect(onAttempt.mock.calls[1][0].attemptNumber).toBe(2);
    });

    it('refuses empty availableSigners', async () => {
        await expect(
            runWithRecovery(async () => 'x', { availableSigners: [] })
        ).rejects.toThrow(/availableSigners must be non-empty/);
    });

    it('treats omitted onPrompt as "give up"', async () => {
        const runner = vi.fn(async () => {
            throw sigResolutionFailure();
        });

        await expect(
            runWithRecovery(runner, { availableSigners: ['did:web', 'did:jwk'] })
        ).rejects.toThrow(SIG_RES_MESSAGE);
        expect(runner).toHaveBeenCalledTimes(1);
    });

    it('passes the current attempt log snapshot to the runner', async () => {
        const seenLogs: number[] = [];
        const runner = vi.fn(async ({ strategy, attemptLog }) => {
            seenLogs.push(attemptLog.signersTried.length);
            if (strategy.id === 'did:web') throw sigResolutionFailure();
            return 'ok';
        });

        await runWithRecovery(runner, { availableSigners: ['did:web', 'did:key'] });
        expect(seenLogs).toEqual([1, 2]);
    });
});
