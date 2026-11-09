import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParsedSdJwtVc } from '@learncard/sd-jwt-vc-plugin';
import type { AccountInventory, DigitalCredentialWallet } from './inventory';
import { INVENTORY_CACHE_MS } from './inventory';
import { clearNativeInventory, synchronizeNativeInventory } from './runtime';

const native = vi.hoisted(() => ({
    ids: [] as string[],
    stored: null as AccountInventory | null,
    register: vi.fn(),
    clear: vi.fn(),
}));
vi.mock('learn-card-base', () => ({ getLogger: () => ({ warn: vi.fn() }) }));
vi.mock('localforage', () => ({
    default: {
        getItem: async () => native.stored,
        setItem: async (_key: string, value: AccountInventory) => {
            native.stored = value;
        },
        removeItem: async () => {
            native.stored = null;
        },
    },
}));
vi.mock('./plugin', () => ({
    nativeDigitalCredentials: {
        status: async () => ({ enabled: true, registeredEntryIds: native.ids }),
        register: native.register,
        clear: native.clear,
    },
}));

beforeEach(async () => {
    vi.restoreAllMocks();
    native.clear.mockImplementation(async () => {
        native.ids = [];
    });
    native.register.mockImplementation(async ({ entries }: { entries: Array<{ id: string }> }) => {
        native.ids = entries.map(entry => entry.id);
    });
    await clearNativeInventory();
    vi.clearAllMocks();
});

const setup = () => {
    const wallet: DigitalCredentialWallet = {
        id: {
            did: () => 'did:example:holder',
            keypair: () => ({ kty: 'OKP', crv: 'Ed25519', x: 'account', d: 'private' }),
        },
        index: { LearnCloud: { get: vi.fn(async () => [{ uri: 'encrypted-course' }]) } },
        read: { get: vi.fn(async () => 'jwt~course') },
        invoke: {
            parseSdJwtVc: vi.fn(
                async () =>
                    ({
                        vct: 'https://example.com/course',
                        rawPayload: {},
                        disclosureKeys: ['course_name'],
                        claims: { course_name: 'Course' },
                        holderPublicKey: { kty: 'OKP', crv: 'Ed25519', x: 'account' },
                    }) as unknown as ParsedSdJwtVc
            ),
            verifySdJwtVc: vi.fn(async () => ({ checks: [], errors: [], warnings: [] })),
            presentSdJwtVc: vi.fn(),
        },
    };
    let time = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    return {
        wallet,
        expire: () => {
            time += INVENTORY_CACHE_MS;
        },
    };
};

describe('native registration replacement', () => {
    it('returns a status refresh deadline after suspension clears every registry entry', async () => {
        const { wallet, expire } = setup();
        const parsed = await wallet.invoke.parseSdJwtVc('jwt~course');
        vi.mocked(wallet.invoke.parseSdJwtVc).mockResolvedValue({
            ...parsed,
            rawPayload: {
                status: { status_list: { uri: 'https://issuer.example.test/status', idx: 0 } },
            },
        });
        let value = 0;
        vi.mocked(wallet.invoke.verifySdJwtVc).mockImplementation(async () => ({
            checks: ['issuer_signature', 'credential_status'],
            warnings: [],
            errors: value ? ['status_suspended: suspended'] : [],
            statusList: { value, checkedAt: Date.now(), validUntil: Date.now() + 1000 },
        }));
        expect(
            (await synchronizeNativeInventory(wallet, () => true, 'Credential')).nextRefreshAt
        ).toBe(2000);
        expect(native.ids).toHaveLength(1);
        expire();
        value = 2;
        const suspended = await synchronizeNativeInventory(wallet, () => true, 'Credential');
        expect(native.ids).toEqual([]);
        expect(native.stored?.entries).toEqual([]);
        expect(suspended.nextRefreshAt).toBe(Date.now() + 1000);
        expire();
        value = 0;
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        expect(native.ids).toHaveLength(1);
    });

    it('reasserts unchanged metadata after an OS reset even if local status still lists it', async () => {
        const { wallet } = setup();
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        expect(native.register).toHaveBeenCalledTimes(1);
        await synchronizeNativeInventory(wallet, () => true, 'Credential', true);
        expect(native.register).toHaveBeenCalledTimes(2);
    });

    it('returns the credential expiration deadline even when no registration changed', async () => {
        const { wallet } = setup();
        const parsed = await wallet.invoke.parseSdJwtVc('jwt~course');
        vi.mocked(wallet.invoke.parseSdJwtVc).mockResolvedValue({
            ...parsed,
            expiresAt: new Date(5_000),
        });
        expect(await synchronizeNativeInventory(wallet, () => true, 'Credential')).toEqual({
            retryRequired: false,
            nextRefreshAt: 5_000,
        });
        expect(await synchronizeNativeInventory(wallet, () => true, 'Credential')).toEqual({
            retryRequired: false,
            nextRefreshAt: 5_000,
        });
        expect(native.register).toHaveBeenCalledTimes(1);
        expect(native.stored?.entries[0].expiresAt).toBe(5_000);
    });

    it('removes local account mappings even when platform clear fails and retries empty clears', async () => {
        const { wallet } = setup();
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        native.clear.mockImplementationOnce(async () => {
            native.ids = [];
            throw new Error('platform unavailable');
        });
        await expect(clearNativeInventory()).rejects.toThrow('Native registry clear unavailable');
        expect(native.stored).toBeNull();
        vi.mocked(wallet.index.LearnCloud.get).mockResolvedValue([]);
        native.clear.mockRejectedValueOnce(new Error('platform unavailable'));
        await expect(
            synchronizeNativeInventory(wallet, () => true, 'Credential')
        ).rejects.toThrow();
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        expect(native.clear).toHaveBeenCalledTimes(3);
    });

    it('retries a failed register without trusting the saved mapping', async () => {
        const { wallet } = setup();
        native.register.mockRejectedValueOnce(new Error('platform unavailable'));
        await expect(
            synchronizeNativeInventory(wallet, () => true, 'Credential')
        ).rejects.toThrow();
        expect(native.ids).toEqual([]);
        expect(native.stored?.entries).toHaveLength(1);
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        expect(native.ids).toHaveLength(1);
    });

    it.each(['read', 'issuer'])(
        'preserves the registered handle through %s failures, retries, then clears on deletion',
        async failure => {
            const { wallet, expire } = setup();
            await synchronizeNativeInventory(wallet, () => true, 'Credential');
            const original = [...native.ids];
            expect(original).toHaveLength(1);
            expire();
            if (failure === 'read')
                vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('offline'));
            else
                vi.mocked(wallet.invoke.verifySdJwtVc).mockResolvedValueOnce({
                    checks: [],
                    warnings: [],
                    errors: ['issuer_resolution_failed: offline'],
                });
            expect(await synchronizeNativeInventory(wallet, () => true, 'Credential')).toEqual({
                retryRequired: true,
            });
            expect(native.ids).toEqual(original);
            expect(native.clear).not.toHaveBeenCalled();
            expect(await synchronizeNativeInventory(wallet, () => true, 'Credential')).toEqual({
                retryRequired: false,
            });
            expect(native.ids).toEqual(original);
            vi.mocked(wallet.index.LearnCloud.get).mockResolvedValue([]);
            await synchronizeNativeInventory(wallet, () => true, 'Credential');
            expect(native.ids).toEqual([]);
            expect(native.stored?.entries).toEqual([]);
        }
    );

    it('preserves the registry and mapping when the authoritative index is unavailable', async () => {
        const { wallet } = setup();
        await synchronizeNativeInventory(wallet, () => true, 'Credential');
        const original = native.stored;
        vi.mocked(wallet.index.LearnCloud.get).mockRejectedValueOnce(new Error('index offline'));
        await expect(synchronizeNativeInventory(wallet, () => true, 'Credential')).rejects.toThrow(
            'index offline'
        );
        expect(native.stored).toBe(original);
        expect(native.clear).not.toHaveBeenCalled();
    });
});
