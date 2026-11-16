import { describe, expect, it, vi } from 'vitest';
import type { ParsedSdJwtVc } from '@learncard/sd-jwt-vc-plugin';
import {
    buildAccountInventory,
    INVENTORY_CACHE_MS,
    INVENTORY_READ_BUDGET,
    INVENTORY_READ_CONCURRENCY,
    type DigitalCredentialWallet,
    type InventoryCacheEntry,
    type InventoryScanProgress,
} from './inventory';

const setup = (count = 1) => {
    let uris = Array.from({ length: count }, (_, i) => `credential-${i}`);
    const parsed = {
        holderPublicKey: { kty: 'OKP', crv: 'Ed25519', x: 'account' },
        disclosureKeys: ['course_name'],
        claims: { course_name: 'Course' },
        rawPayload: { vct: 'https://example.com/course' },
        vct: 'https://example.com/course',
    } as unknown as ParsedSdJwtVc;
    const wallet: DigitalCredentialWallet = {
        id: {
            did: () => 'did:example:account',
            keypair: () => ({ kty: 'OKP', crv: 'Ed25519', x: 'account', d: 'private' }),
        },
        index: { LearnCloud: { get: vi.fn(async () => uris.map(uri => ({ uri }))) } },
        read: { get: vi.fn(async uri => `jwt~${uri}`) },
        invoke: {
            parseSdJwtVc: vi.fn(async () => parsed),
            verifySdJwtVc: vi.fn(async () => ({
                checks: ['issuer_signature'],
                errors: [],
                warnings: [],
            })),
            presentSdJwtVc: vi.fn(),
        },
    };
    return {
        wallet,
        parsed,
        remove: () => {
            uris = [];
        },
    };
};

describe('native registry inventory reconciliation', () => {
    it.each(['status', 'credentialStatus'])(
        'excludes unsupported %s instead of treating deferred revocation checks as success',
        async status => {
            const { wallet, parsed } = setup();
            parsed.rawPayload[status] = {
                status_list: { uri: 'https://example.test/status', idx: 1 },
            };
            expect((await buildAccountInventory(wallet, undefined, 'Credential')).entries).toEqual(
                []
            );
            expect(wallet.invoke.verifySdJwtVc).not.toHaveBeenCalled();
        }
    );

    it.each(['expired', 'not_yet_valid', 'signature_invalid'])(
        'removes an indexed credential after a confirmed %s result',
        async reason => {
            const { wallet } = setup();
            const initial = await buildAccountInventory(wallet, undefined, 'Credential');
            vi.mocked(wallet.invoke.verifySdJwtVc).mockResolvedValue({
                checks: [],
                warnings: [],
                errors: [`${reason}: invalid`],
            });
            expect((await buildAccountInventory(wallet, initial, 'Credential')).entries).toEqual(
                []
            );
        }
    );

    it('does not retain a known-expired credential through a temporary read failure', async () => {
        const { wallet, parsed } = setup();
        parsed.expiresAt = new Date(2_000);
        const cache = new Map<string, InventoryCacheEntry>();
        const initial = await buildAccountInventory(wallet, undefined, 'Credential', {
            cache,
            now: () => 1_000,
        });
        expect(initial.entries).toHaveLength(1);
        vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('offline'));
        const expired = await buildAccountInventory(wallet, initial, 'Credential', {
            cache,
            now: () => 2_000,
        });
        expect(expired.entries).toEqual([]);
        expect(expired.retryRequired).toBe(true);
    });

    it('removes a credential whose holder key no longer matches the account', async () => {
        const { wallet, parsed } = setup();
        const initial = await buildAccountInventory(wallet, undefined, 'Credential');
        parsed.holderPublicKey = { kty: 'OKP', crv: 'Ed25519', x: 'different-key' };
        expect((await buildAccountInventory(wallet, initial, 'Credential')).entries).toEqual([]);
    });

    it.each(['read', 'null', 'issuer', 'unknown'])(
        'retains indexed credentials on %s failure, retries, and removes actual deletions',
        async failure => {
            const { wallet, remove } = setup();
            const initial = await buildAccountInventory(wallet, undefined, 'Credential');
            if (failure === 'read')
                vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('offline'));
            if (failure === 'null') vi.mocked(wallet.read.get).mockResolvedValueOnce(null);
            if (failure === 'issuer' || failure === 'unknown')
                vi.mocked(wallet.invoke.verifySdJwtVc).mockResolvedValueOnce({
                    checks: [],
                    warnings: [],
                    errors: [
                        `${failure === 'issuer' ? 'issuer_resolution_failed' : 'unknown'}: offline`,
                    ],
                });
            const failed = await buildAccountInventory(wallet, initial, 'Credential');
            expect(failed.entries).toEqual(initial.entries);
            expect(failed.retryRequired).toBe(true);
            const retried = await buildAccountInventory(wallet, failed, 'Credential');
            expect(retried.entries).toEqual(initial.entries);
            expect(retried.retryRequired).toBe(false);
            remove();
            expect((await buildAccountInventory(wallet, retried, 'Credential')).entries).toEqual(
                []
            );
        }
    );

    it('aborts index failure and never retains a different account or confirmed invalid credential', async () => {
        const { wallet } = setup();
        const initial = await buildAccountInventory(wallet, undefined, 'Credential');
        vi.mocked(wallet.index.LearnCloud.get).mockRejectedValueOnce(new Error('index offline'));
        await expect(buildAccountInventory(wallet, initial, 'Credential')).rejects.toThrow(
            'index offline'
        );
        vi.mocked(wallet.invoke.verifySdJwtVc).mockResolvedValueOnce({
            checks: [],
            warnings: [],
            errors: ['signature_invalid: invalid'],
        });
        const invalid = await buildAccountInventory(wallet, initial, 'Credential');
        expect(invalid.entries).toEqual([]);
        expect(invalid.retryRequired).toBe(false);
        vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('offline'));
        expect(
            (await buildAccountInventory(wallet, { ...initial, owner: 'other' }, 'Credential'))
                .entries
        ).toEqual([]);
    });

    it.each(['claim', 'vct'])(
        'isolates an oversized %s projection from valid entries and reports rejection',
        async field => {
            const { wallet, parsed } = setup(2);
            vi.mocked(wallet.invoke.parseSdJwtVc).mockResolvedValueOnce({
                ...parsed,
                ...(field === 'vct'
                    ? { vct: 'v'.repeat(513) }
                    : {
                          disclosureKeys: ['a'.repeat(101)],
                          claims: { ['a'.repeat(101)]: 'sensitive' },
                      }),
            });
            const onIssue = vi.fn();
            const result = await buildAccountInventory(wallet, undefined, 'Credential', {
                onIssue,
            });
            expect(result.entries).toHaveLength(1);
            expect(result.entries[0].uri).toBe('credential-1');
            expect(onIssue).toHaveBeenCalledWith('projection');
        }
    );

    it('accepts native boundary lengths and rejects overlong titles without poisoning the batch', async () => {
        const { wallet, parsed } = setup();
        parsed.vct = 'v'.repeat(512);
        parsed.disclosureKeys = ['a'.repeat(100)];
        parsed.claims = { ['a'.repeat(100)]: 'value' };
        expect(
            (await buildAccountInventory(wallet, undefined, 't'.repeat(100))).entries
        ).toHaveLength(1);
        expect(
            (await buildAccountInventory(wallet, undefined, 't'.repeat(101))).entries
        ).toHaveLength(0);
    });

    it('bounds simultaneous reads and stops when the 100-entry registry is full', async () => {
        const { wallet } = setup(2_000);
        let active = 0;
        let peak = 0;
        vi.mocked(wallet.read.get).mockImplementation(async uri => {
            active++;
            peak = Math.max(peak, active);
            await new Promise(resolve => setTimeout(resolve, 0));
            active--;
            return `jwt~${uri}`;
        });
        const result = await buildAccountInventory(wallet, undefined, 'Credential');
        expect(result.entries).toHaveLength(100);
        expect(wallet.read.get).toHaveBeenCalledTimes(100);
        expect(peak).toBeLessThanOrEqual(INVENTORY_READ_CONCURRENCY);
    });

    it('bounds mixed-inventory scans, progresses using cached negatives and avoids foreground rescans', async () => {
        const { wallet, parsed } = setup(2_000);
        vi.mocked(wallet.invoke.parseSdJwtVc).mockImplementation(async compact =>
            compact.includes('credential-299') ? parsed : { ...parsed, disclosureKeys: [] }
        );
        const cache = new Map<string, InventoryCacheEntry>();
        const options = { cache, now: () => 1_000 };
        const first = await buildAccountInventory(wallet, undefined, 'Credential', options);
        expect(first.retryRequired).toBe(true);
        expect(wallet.read.get).toHaveBeenCalledTimes(INVENTORY_READ_BUDGET);
        const second = await buildAccountInventory(wallet, first, 'Credential', options);
        expect(second.entries.map(entry => entry.uri)).toEqual(['credential-299']);
        expect(wallet.read.get).toHaveBeenCalledTimes(2 * INVENTORY_READ_BUDGET);
        // A full eligible inventory reuses metadata but still checks authoritative deletion.
        vi.mocked(wallet.invoke.parseSdJwtVc).mockResolvedValue(parsed);
        const full = await buildAccountInventory(wallet, second, 'Credential', options);
        expect(full.entries).toHaveLength(100);
        vi.mocked(wallet.read.get).mockClear();
        await buildAccountInventory(wallet, full, 'Credential', options);
        expect(wallet.read.get).not.toHaveBeenCalled();
        await buildAccountInventory(wallet, full, 'Credential', {
            cache,
            now: () => 1_000 + INVENTORY_CACHE_MS,
        });
        expect(wallet.read.get).toHaveBeenCalledTimes(100);
    });

    it('does not let an unavailable prefix starve new credentials on retry', async () => {
        const { wallet } = setup(2_000);
        vi.mocked(wallet.read.get).mockImplementation(async uri => {
            if (Number(uri.split('-')[1]) < INVENTORY_READ_BUDGET) throw new Error('offline');
            return `jwt~${uri}`;
        });
        const cache = new Map<string, InventoryCacheEntry>();
        const initial = await buildAccountInventory(wallet, undefined, 'Credential', { cache });
        expect(initial.entries).toEqual([]);
        expect(wallet.read.get).toHaveBeenCalledTimes(INVENTORY_READ_BUDGET);
        const next = await buildAccountInventory(wallet, initial, 'Credential', { cache });
        expect(next.entries).toHaveLength(100);
        expect(next.entries[0].uri).toBe('credential-200');
        expect(wallet.read.get).toHaveBeenCalledTimes(INVENTORY_READ_BUDGET + 100);
    });

    it('continues a large mixed inventory after metadata expiry and a new foreground retry burst', async () => {
        const { wallet, parsed } = setup(1_100);
        vi.mocked(wallet.invoke.parseSdJwtVc).mockImplementation(async compact =>
            Number(compact.split('~')[1]?.split('-')[1]) >= 1_000
                ? parsed
                : { ...parsed, disclosureKeys: [] }
        );
        const cache = new Map<string, InventoryCacheEntry>();
        const scanProgress: InventoryScanProgress = {};
        let previous: Awaited<ReturnType<typeof buildAccountInventory>> | undefined;
        // Initial check plus the listener's capped 2s/10s/30s retries reach only
        // the first 800 ineligible entries. The next foreground is after TTL.
        for (const time of [1_000, 3_000, 13_000, 43_000]) {
            const before = vi.mocked(wallet.read.get).mock.calls.length;
            previous = await buildAccountInventory(wallet, previous, 'Credential', {
                cache,
                scanProgress,
                now: () => time,
            });
            expect(vi.mocked(wallet.read.get).mock.calls.length - before).toBe(
                INVENTORY_READ_BUDGET
            );
            expect(previous.entries).toEqual([]);
            expect(previous.retryRequired).toBe(true);
        }
        expect(scanProgress.nextUri).toBe('credential-800');
        for (const time of [121_000, 123_000]) {
            const before = vi.mocked(wallet.read.get).mock.calls.length;
            previous = await buildAccountInventory(wallet, previous, 'Credential', {
                cache,
                scanProgress,
                now: () => time,
            });
            expect(vi.mocked(wallet.read.get).mock.calls.length - before).toBeLessThanOrEqual(
                INVENTORY_READ_BUDGET
            );
        }
        expect(previous!.entries).toHaveLength(100);
        expect(previous!.entries[0].uri).toBe('credential-1000');
        expect(previous!.retryRequired).toBe(false);
    });

    it('does not reuse scan progress or cached entries across account owners', async () => {
        const { wallet } = setup();
        const cache = new Map<string, InventoryCacheEntry>();
        const scanProgress: InventoryScanProgress = {};
        const previous = await buildAccountInventory(wallet, undefined, 'Credential', {
            cache,
            scanProgress,
        });
        wallet.id.keypair = () => ({
            kty: 'OKP',
            crv: 'Ed25519',
            x: 'other-account',
            d: 'private',
        });
        scanProgress.nextUri = 'credential-0';
        const next = await buildAccountInventory(wallet, previous, 'Credential', {
            cache,
            scanProgress,
        });
        expect(next.entries).toEqual([]);
        expect(next.owner).not.toBe(previous.owner);
        expect(scanProgress.owner).toBe(next.owner);
        expect(scanProgress.nextUri).toBeUndefined();
        expect(wallet.read.get).toHaveBeenCalledTimes(2);
    });

    it('detects indexed removal even while the positive cache is fresh', async () => {
        const { wallet, remove } = setup();
        const cache = new Map<string, InventoryCacheEntry>();
        const initial = await buildAccountInventory(wallet, undefined, 'Credential', { cache });
        remove();
        expect(
            (await buildAccountInventory(wallet, initial, 'Credential', { cache })).entries
        ).toEqual([]);
        expect(cache.size).toBe(0);
    });
});
