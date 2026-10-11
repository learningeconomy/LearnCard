import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isEscrowRolloutEnabledFor } from '../escrowRollout';
import { clearAuthConfigOverrides, setAuthConfigOverrides } from '../authConfig';

const sha256Hex = async (input: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
};

describe('isEscrowRolloutEnabledFor', () => {
    beforeEach(() => clearAuthConfigOverrides());
    afterEach(() => clearAuthConfigOverrides());

    it('excludes everybody at 0%', async () => {
        for (const userKey of ['did:key:a', 'did:key:b', 'did:key:c', 'did:key:d']) {
            await expect(
                isEscrowRolloutEnabledFor({ tenantId: 'learncard', userKey, percent: 0 })
            ).resolves.toBe(false);
        }
    });

    it('includes everybody at 100%', async () => {
        for (const userKey of ['did:key:a', 'did:key:b', 'did:key:c', 'did:key:d']) {
            await expect(
                isEscrowRolloutEnabledFor({ tenantId: 'learncard', userKey, percent: 100 })
            ).resolves.toBe(true);
        }
    });

    it('is deterministic for the same tenant/user/percent', async () => {
        const input = { tenantId: 'learncard', userKey: 'did:key:zStableUser', percent: 42 };

        const first = await isEscrowRolloutEnabledFor(input);
        const second = await isEscrowRolloutEnabledFor(input);
        const third = await isEscrowRolloutEnabledFor({ ...input });

        expect(second).toBe(first);
        expect(third).toBe(first);
    });

    it('buckets independently per tenant for the same user', async () => {
        const userKey = 'did:key:zSameUserDifferentTenants';
        const results = await Promise.all(
            Array.from({ length: 20 }, (_, i) =>
                isEscrowRolloutEnabledFor({ tenantId: `tenant-${i}`, userKey, percent: 50 })
            )
        );

        // Not every tenant should land on the same side of a 50% bucket for the same user —
        // proves the tenant id actually participates in the hash rather than being ignored.
        expect(new Set(results).size).toBe(2);
    });

    it('is roughly uniform across 10k synthetic ids at 25%', async () => {
        const percent = 25;
        const total = 10_000;
        let included = 0;

        for (let i = 0; i < total; i++) {
            // eslint-disable-next-line no-await-in-loop -- sequential is fine for a deterministic fixture generator
            if (
                await isEscrowRolloutEnabledFor({
                    tenantId: 'learncard',
                    userKey: `did:key:zSynthetic${i}`,
                    percent,
                })
            ) {
                included++;
            }
        }

        const rate = (included / total) * 100;
        expect(rate).toBeGreaterThanOrEqual(23);
        expect(rate).toBeLessThanOrEqual(27);
    });

    it('allows an allowlisted user regardless of percent', async () => {
        const userKey = 'did:key:zInternalTester';
        const allowlistHash = await sha256Hex(userKey);

        await expect(
            isEscrowRolloutEnabledFor({
                tenantId: 'learncard',
                userKey,
                percent: 0,
                allowlist: [allowlistHash],
            })
        ).resolves.toBe(true);
    });

    it('is case-insensitive when matching allowlist hashes', async () => {
        const userKey = 'did:key:zInternalTesterUppercase';
        const allowlistHash = (await sha256Hex(userKey)).toUpperCase();

        await expect(
            isEscrowRolloutEnabledFor({
                tenantId: 'learncard',
                userKey,
                percent: 0,
                allowlist: [allowlistHash],
            })
        ).resolves.toBe(true);
    });

    it('does not allow a non-allowlisted user at 0%, even with other allowlist entries present', async () => {
        const allowlistHash = await sha256Hex('did:key:zSomeoneElse');

        await expect(
            isEscrowRolloutEnabledFor({
                tenantId: 'learncard',
                userKey: 'did:key:zNotAllowlisted',
                percent: 0,
                allowlist: [allowlistHash],
            })
        ).resolves.toBe(false);
    });

    it('falls back to the active tenant config when percent/allowlist are omitted', async () => {
        setAuthConfigOverrides({
            providerConfig: {
                sss: { escrowEnclaveMode: 'off', escrowEnclavePublicKeys: [] },
            },
            escrowRolloutPercent: 100,
            escrowRolloutAllowlist: [],
        });

        await expect(
            isEscrowRolloutEnabledFor({ tenantId: 'learncard', userKey: 'did:key:zAnyUser' })
        ).resolves.toBe(true);
    });

    it('never logs the stable id or its hash', async () => {
        const logSpies = [
            vi.spyOn(console, 'log').mockImplementation(() => {}),
            vi.spyOn(console, 'info').mockImplementation(() => {}),
            vi.spyOn(console, 'warn').mockImplementation(() => {}),
            vi.spyOn(console, 'error').mockImplementation(() => {}),
            vi.spyOn(console, 'debug').mockImplementation(() => {}),
        ];

        const userKey = 'did:key:zNeverLogged';
        await isEscrowRolloutEnabledFor({ tenantId: 'learncard', userKey, percent: 50 });
        await isEscrowRolloutEnabledFor({ tenantId: 'learncard', userKey, percent: 0 });
        await isEscrowRolloutEnabledFor({
            tenantId: 'learncard',
            userKey,
            percent: 0,
            allowlist: [await sha256Hex(userKey)],
        });

        for (const spy of logSpies) expect(spy).not.toHaveBeenCalled();
    });
});
