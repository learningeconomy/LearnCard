import { describe, expect, it, vi } from 'vitest';
import { resolveMigrationKey } from './resolveMigrationKey';

describe('resolveMigrationKey', () => {
    const archived = { privateKey: 'a'.repeat(64), did: 'did:key:zArchive' };

    it('uses the archive without deriving and anchors the expected DID', async () => {
        const deriveLegacyKey = vi.fn();
        expect(
            await resolveMigrationKey({
                fetchArchivedKey: vi.fn().mockResolvedValue(archived),
                deriveLegacyKey,
            })
        ).toEqual({
            privateKey: archived.privateKey,
            source: 'archive',
            expectedDid: archived.did,
        });
        expect(deriveLegacyKey).not.toHaveBeenCalled();
    });

    it.each(['miss', 'error'])('derives only after an archive %s', async outcome => {
        const order: string[] = [];
        const result = await resolveMigrationKey({
            fetchArchivedKey: async () => {
                order.push('archive');
                if (outcome === 'error') throw new Error('lookup failed');
                return null;
            },
            deriveLegacyKey: async () => {
                order.push('derive');
                return 'legacy-key';
            },
        });
        expect(order).toEqual(['archive', 'derive']);
        expect(result).toEqual({ privateKey: 'legacy-key', source: 'derived' });
    });

    it('preserves a server-provided expected DID even when the archive differs', async () => {
        expect(
            await resolveMigrationKey({
                fetchArchivedKey: async () => archived,
                deriveLegacyKey: vi.fn(),
                existingExpectedDid: 'did:key:zServer',
            })
        ).toMatchObject({ expectedDid: 'did:key:zServer' });
    });

    it('preserves null and throwing legacy derivation outcomes', async () => {
        const fetchArchivedKey = async (): Promise<null> => null;
        expect(
            await resolveMigrationKey({ fetchArchivedKey, deriveLegacyKey: async () => null })
        ).toBeNull();
        const error = new Error('derivation failed');
        await expect(
            resolveMigrationKey({
                fetchArchivedKey,
                deriveLegacyKey: async () => {
                    throw error;
                },
            })
        ).rejects.toBe(error);
    });

    it.each(['hit', 'miss', 'error'])(
        'discards an obsolete archive %s without deriving',
        async outcome => {
            let current = true;
            const deriveLegacyKey = vi.fn();
            expect(
                await resolveMigrationKey({
                    fetchArchivedKey: async () => {
                        current = false;
                        if (outcome === 'error') throw new Error('lookup failed');
                        return outcome === 'hit' ? archived : null;
                    },
                    deriveLegacyKey,
                    isCurrentAttempt: () => current,
                })
            ).toBeNull();
            expect(deriveLegacyKey).not.toHaveBeenCalled();
        }
    );

    it('discards a legacy result when its attempt becomes obsolete', async () => {
        let current = true;
        expect(
            await resolveMigrationKey({
                fetchArchivedKey: async () => null,
                deriveLegacyKey: async () => {
                    current = false;
                    return 'legacy-key';
                },
                isCurrentAttempt: () => current,
            })
        ).toBeNull();
    });
});
