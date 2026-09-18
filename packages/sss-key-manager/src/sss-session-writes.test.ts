import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSSStrategy, type SSSStorageFunctions } from './sss-strategy';

vi.mock('./escrow-attestation', () => ({
    verifyEnclaveAttestation: async () => ({ publicKey: 'test-key', keyId: 'test-key' }),
}));
vi.mock('./escrow-crypto', () => ({ encryptEscrowBlob: async () => ({}) }));

const deferred = <T>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(done => {
        resolve = done;
    });
    return { promise, resolve };
};

const setup = () => {
    let device: string | null = 'previous-share';
    const storage: SSSStorageFunctions = {
        getDeviceShare: async () => device,
        hasDeviceShare: async () => device !== null,
        storeDeviceShare: vi.fn(async share => {
            device = share;
        }),
        clearAllShares: vi.fn(async () => {
            device = null;
        }),
        getShareVersion: async () => 1,
        storeShareVersion: vi.fn(async () => {}),
    };
    const strategy = createSSSStrategy({
        serverUrl: 'https://example.test',
        storage,
        escrow: {
            enabled: true,
            attestation: { mode: 'software', pinnedPublicKeys: ['test-key'] },
        },
    });
    const enroll = () =>
        strategy.ensureEscrowEnrollment!({
            token: 'token',
            providerType: 'firebase',
            privateKey: 'a'.repeat(64),
            signDidAuthVp: async () => 'proof',
        });
    return { strategy, storage, enroll };
};

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const keyStatus = { primaryDid: 'did:key:test', shareVersion: 1, recoveryMethods: [] };

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('session-scoped enrollment writes', () => {
    it('does not write a device share when attestation resumes after forgetting the device', async () => {
        const { strategy, storage, enroll } = setup();
        const started = deferred<void>();
        const attestation = deferred<Response>();
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) => {
                if (url.endsWith('/attestation')) {
                    started.resolve();
                    return attestation.promise;
                }
                return response(keyStatus);
            })
        );
        const pending = enroll();
        await started.promise;
        await strategy.clearLocalKeys();
        attestation.resolve(response({ attestation: {} }));
        await expect(pending).rejects.toThrow();
        expect(storage.storeDeviceShare).not.toHaveBeenCalled();
        expect(await strategy.getLocalKey()).toBeNull();
    });

    it.each([200, 500])(
        'blocks late version writes and rollback after server response %s',
        async status => {
            const { strategy, storage, enroll } = setup();
            const started = deferred<void>();
            const authWrite = deferred<Response>();
            vi.stubGlobal(
                'fetch',
                vi.fn(async (url: string, init?: RequestInit) => {
                    if (url.endsWith('/auth-share') && init?.method === 'PUT') {
                        started.resolve();
                        return authWrite.promise;
                    }
                    if (url.endsWith('/challenge')) return response({ challenge: 'nonce' });
                    if (url.endsWith('/attestation')) return response({ attestation: {} });
                    return response(keyStatus);
                })
            );
            const pending = enroll();
            await started.promise;
            expect(storage.storeDeviceShare).toHaveBeenCalledTimes(1);
            await strategy.clearLocalKeys();
            authWrite.resolve(response({ shareVersion: 2 }, status));
            await expect(pending).rejects.toThrow();
            expect(storage.storeDeviceShare).toHaveBeenCalledTimes(1);
            expect(storage.storeShareVersion).not.toHaveBeenCalled();
            expect(await strategy.getLocalKey()).toBeNull();
        }
    );
});
