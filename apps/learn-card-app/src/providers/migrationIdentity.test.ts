import { describe, expect, it, vi } from 'vitest';

const signing = vi.hoisted(() => ({
    getDidAuthVp: vi.fn().mockResolvedValue('did-auth-jwt'),
}));

vi.mock('learn-card-base', () => ({
    deriveWeb3AuthKey: vi.fn(),
    getAuthConfig: vi.fn(() => ({ providerConfig: {} })),
    resolveAuthProvider: vi.fn(),
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getSigningLearnCard: vi.fn(async () => ({ invoke: { getDidAuthVp: signing.getDidAuthVp } })),
}));

import { createMigrationIdentityVerifier, hasNetworkProfile } from './migrationIdentity';

const didFromPrivateKey = async (key: string): Promise<string> => `did:key:${key}`;

describe('createMigrationIdentityVerifier', () => {
    describe('cached key', () => {
        const check = { privateKey: 'cached', did: 'did:key:cached', source: 'cached' } as const;

        it('matches when the fresh Web3Auth derivation gives the same DID', async () => {
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey: async () => 'cached',
                hasProfile: vi.fn(),
            });

            await expect(verify(check)).resolves.toBe('match');
        });

        it("reports a mismatch for another account's key left on the device", async () => {
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey: async () => 'signed-in-account',
                hasProfile: vi.fn(),
            });

            await expect(verify(check)).resolves.toBe('mismatch');
        });

        it('is unknown without a session to derive from', async () => {
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey: async () => null,
                hasProfile: vi.fn(),
            });

            await expect(verify(check)).resolves.toBe('unknown');
        });
    });

    describe('derived key', () => {
        const check = { privateKey: 'derived', did: 'did:key:derived', source: 'derived' } as const;

        it('matches when a network profile exists for the DID, without re-deriving', async () => {
            const deriveLegacyKey = vi.fn();
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey,
                hasProfile: async () => true,
            });

            await expect(verify(check)).resolves.toBe('match');
            expect(deriveLegacyKey).not.toHaveBeenCalled();
        });

        it('is unknown (never mismatch) when no profile exists', async () => {
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey: vi.fn(),
                hasProfile: async () => false,
            });

            await expect(verify(check)).resolves.toBe('unknown');
        });

        it('lets profile lookup failures reach the coordinator', async () => {
            const verify = createMigrationIdentityVerifier({
                didFromPrivateKey,
                deriveLegacyKey: vi.fn(),
                hasProfile: async () => {
                    throw new Error('offline');
                },
            });

            await expect(verify(check)).rejects.toThrow('offline');
        });
    });
});

describe('hasNetworkProfile', () => {
    const respond = (status: number, body: unknown) =>
        vi.fn().mockResolvedValue({
            ok: status < 400,
            status,
            json: async () => body,
        }) as unknown as typeof fetch;

    it('calls profile.getProfile with a DID-auth bearer and tenant headers', async () => {
        const fetchFn = respond(200, { result: { data: { did: 'did:key:x', profileId: 'p' } } });

        await expect(
            hasNetworkProfile({
                privateKey: 'k',
                networkUrl: 'https://network.example/trpc/',
                headers: { 'X-Tenant-Id': 'learncard' },
                fetchFn,
            })
        ).resolves.toBe(true);

        expect(fetchFn).toHaveBeenCalledWith(
            'https://network.example/trpc/profile.getProfile',
            expect.objectContaining({
                headers: { 'X-Tenant-Id': 'learncard', Authorization: 'Bearer did-auth-jwt' },
            })
        );
        expect(signing.getDidAuthVp).toHaveBeenCalledWith({ proofFormat: 'jwt' });
    });

    it('returns false when the DID has no profile', async () => {
        await expect(
            hasNetworkProfile({
                privateKey: 'k',
                networkUrl: 'https://n/trpc',
                fetchFn: respond(200, { result: {} }),
            })
        ).resolves.toBe(false);
    });

    it('throws on HTTP errors instead of reporting "no profile"', async () => {
        await expect(
            hasNetworkProfile({
                privateKey: 'k',
                networkUrl: 'https://n/trpc',
                fetchFn: respond(401, { error: {} }),
            })
        ).rejects.toThrow('401');
    });
});
