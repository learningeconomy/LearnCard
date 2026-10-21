import { describe, expect, it, vi } from 'vitest';
import {
    createSSSStrategy,
    EscrowPinMismatchError,
    type EscrowAuthorityState,
} from '@learncard/sss-key-manager';
import { runCanary } from './runner';
import { RunnerAuthError } from './auth';
import { createMetrics } from './metrics';
import type { Config } from './config';
import type { AccountSecret } from './secrets';
import type { Sdk } from './sdk';

const config: Config = {
    environment: 'staging',
    serverUrl: 'https://api.example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test-api-key',
    keyId: 'test-key',
    authorityGeneration: 'test-generation',
    measurements: [{ pcr0: 'a'.repeat(96), pcr1: 'b'.repeat(96), pcr2: 'c'.repeat(96) }],
    accounts: [0, 1, 2].map(n => ({
        id: `account-${n}`,
        secretArn: `arn:aws:secretsmanager:us-east-1:000000000000:secret:test-${n}`,
    })) as Config['accounts'],
};
const fixture = (tier: 1 | 2 = 2) => {
    const time = Date.now();
    const index = tier === 1 ? 0 : 1 + (Math.floor(time / 1_800_000) % 2);
    let stored: AccountSecret = {
        accountId: config.accounts[index].id,
        privateKey: 'a'.repeat(64),
        did: 'did:key:test',
        pin: '738195',
        refreshToken: 'secret-refresh',
        recoveryEmail: 'test@example.invalid',
        recoveryLanguage: 'en',
        deviceState: { shares: { old: 'secret-share' }, versions: { old: 1 } },
        wrongPinWeek: Math.floor((time - Date.UTC(1970, 0, 5)) / 604_800_000),
    };
    const writes: AccountSecret[] = [];
    const lines: string[] = [];
    const recovery = vi.fn(async (_params: unknown) => ({
        privateKey: stored.privateKey,
        did: stored.did,
    }));
    const reset = vi.fn(async (_params: unknown) => undefined);
    const state: EscrowAuthorityState = {
        tenant: 'test',
        authorityGeneration: 'test-generation',
        did: stored.did,
        enrollmentVersion: 1,
        enrollmentEpoch: 1,
        status: 'active',
        envelope: null,
        shareVersion: 1,
        hasPin: true,
        pinGeneration: 1,
        attemptsUsed: 0,
    };
    const sdk: Sdk = {
        attest: vi.fn(async () => ({
            publicKey: 'key',
            keyId: 'test-key',
            previousKeyIds: [],
            mode: 'nitro' as const,
            authority: { ledgerPublicKey: 'ledger', measurement: 'measurement' },
        })),
        authority: vi.fn(async () => state),
        did: vi.fn(async () => stored.did),
        sign: vi.fn(async () => 'proof'),
        strategy: storage => {
            const strategy = createSSSStrategy({ serverUrl: config.serverUrl, storage });
            strategy.executeRecovery = async params => {
                expect(await storage.getDeviceShare()).toBeNull();
                const result = await recovery(params);
                await storage.storeDeviceShare('new-secret-share');
                await storage.storeShareVersion(2);
                return result;
            };
            strategy.setEscrowPin = async params => {
                await reset(params);
                await storage.storeDeviceShare('reset-secret-share');
                await storage.storeShareVersion(3);
            };
            return strategy;
        },
    };
    const deps = {
        sdk,
        emit: createMetrics('staging', tier, line => lines.push(line)),
        refresh: vi.fn(async () => ({
            token: 'secret-id-token',
            refreshToken: 'rotated-secret-refresh',
        })),
        secrets: {
            read: vi.fn(async () => structuredClone(stored)),
            write: vi.fn(async (_arn: string, value: AccountSecret) => {
                stored = structuredClone(value);
                writes.push(stored);
            }),
        },
    };
    return {
        deps,
        sdk,
        state,
        lines,
        writes,
        recovery,
        reset,
        secret: stored,
        event: { tier, time: new Date(time).toISOString() },
    };
};

describe('scheduled canary orchestration', () => {
    it('tier 1 verifies attestation and signed authority without mutation', async () => {
        const f = fixture(1);
        await runCanary(f.event, config, f.deps);
        expect(f.sdk.attest).toHaveBeenCalledOnce();
        expect(f.sdk.authority).toHaveBeenCalledOnce();
        expect(f.reset).not.toHaveBeenCalled();
        expect(f.lines.join()).toContain('"Tier1.Success":1');
        expect(f.writes[0].refreshToken).toBe('rotated-secret-refresh');
    });
    it.each(['nonce', 'pcr'])('tier 1 fails closed on %s', async reason => {
        const f = fixture(1);
        vi.mocked(f.sdk.attest).mockRejectedValue({ reason, message: 'secret payload' });
        await runCanary(f.event, config, f.deps);
        expect(f.sdk.authority).not.toHaveBeenCalled();
        expect(f.lines.join()).toContain('"Tier1.Success":0');
        expect(f.lines.join()).toContain(`"Reason":"${reason}"`);
    });
    it('recovers from empty storage and checkpoints before and after PIN reset', async () => {
        const f = fixture();
        await runCanary(f.event, config, f.deps);
        expect(f.recovery).toHaveBeenCalledOnce();
        expect(f.reset).toHaveBeenCalledOnce();
        expect(f.writes[1]).toMatchObject({
            needsPinReset: true,
            deviceState: { shares: { 'sss-device-share': 'new-secret-share' } },
        });
        expect(f.writes[2]).toMatchObject({
            needsPinReset: false,
            deviceState: { shares: { 'sss-device-share': 'reset-secret-share' } },
        });
        expect(f.lines.join()).toContain('"Tier2.Success":1');
    });
    it.each([false, true])(
        'repairs a retired PIN / interrupted run before recovery (%s)',
        async interrupted => {
            const f = fixture();
            f.state.hasPin = interrupted;
            f.secret.needsPinReset = interrupted;
            await runCanary(f.event, config, f.deps);
            expect(f.reset).toHaveBeenCalledTimes(2);
            expect(f.reset.mock.invocationCallOrder[0]).toBeLessThan(
                f.recovery.mock.invocationCallOrder[0]
            );
        }
    );
    it('weekly mismatch uses a separate recovery call then correct PIN; weekly marker is durable first', async () => {
        const f = fixture();
        f.secret.wrongPinWeek = -1;
        f.recovery.mockRejectedValueOnce(new EscrowPinMismatchError(9));
        await runCanary(f.event, config, f.deps);
        expect(f.recovery).toHaveBeenCalledTimes(2);
        expect(f.writes[0].wrongPinWeek).not.toBe(-1);
        expect(f.lines.join()).toContain('"Tier2.Success":1');
    });
    it('does not mistake arbitrary wrong-PIN errors for a mismatch', async () => {
        const f = fixture();
        f.secret.wrongPinWeek = -1;
        f.recovery.mockRejectedValueOnce(new Error('secret transport payload'));
        await runCanary(f.event, config, f.deps);
        expect(f.recovery).toHaveBeenCalledOnce();
        expect(f.lines.join()).toContain('"Tier2.Success":0');
    });
    it('emits separate auth failure, does not call escrow, and never logs secrets', async () => {
        const f = fixture();
        f.deps.refresh.mockRejectedValue(new RunnerAuthError());
        await runCanary(f.event, config, f.deps);
        expect(f.sdk.attest).not.toHaveBeenCalled();
        expect(f.lines.join()).toContain('"Runner.AuthFailure":1');
        expect(f.lines.join()).not.toMatch(
            /secret-refresh|secret-share|secret-id-token|did:key|example.invalid|738195/
        );
    });
    it('suppresses duplicate slots and never reports their success', async () => {
        const f = fixture();
        f.secret.lastSlot = Math.floor(Date.parse(f.event.time) / 1_800_000);
        await runCanary(f.event, config, f.deps);
        expect(f.deps.refresh).not.toHaveBeenCalled();
        expect(f.recovery).not.toHaveBeenCalled();
        expect(f.lines.join()).not.toContain('Tier2.Success');
    });
    it('secret write failure stops before recovery', async () => {
        const f = fixture();
        f.deps.secrets.write.mockRejectedValue(new Error('secret-refresh'));
        await runCanary(f.event, config, f.deps);
        expect(f.recovery).not.toHaveBeenCalled();
        expect(f.lines.join()).toContain('"Tier2.Success":0');
        expect(f.lines.join()).not.toContain('secret-refresh');
    });
});
