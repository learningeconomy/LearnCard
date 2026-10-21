import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getSigningAuthorityForDid: vi.fn(),
    initLearnCard: vi.fn(async (options: { didWeb?: string }) => ({
        did: options.didWeb ?? 'did:key:cached-test',
    })),
}));

vi.mock('@accesslayer/signing-authority/read', () => ({
    getSigningAuthorityForDid: mocks.getSigningAuthorityForDid,
}));

vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));

vi.mock('@learncard/didkit-plugin-node', () => ({
    getDidKitPlugin: vi.fn(async () => ({})),
}));

import { getSigningAuthorityLearnCard } from './learnCard.helpers';
import { seedEncryption } from './seedEncryption.helpers';

describe('getSigningAuthorityLearnCard', () => {
    it('isolates cached wallets by owner DID when authorities share a seed', async () => {
        const authorities = await Promise.all(
            ['did:key:z6MkOwner', 'did:web:example.com:owner'].map(async ownerDid => {
                const identity = { _id: ownerDid, ownerDid, name: 'shared-authority' };
                return { ...identity, ...(await seedEncryption.encrypt('a'.repeat(64), identity)) };
            })
        );
        mocks.getSigningAuthorityForDid.mockImplementation(async ownerDid =>
            authorities.find(authority => authority.ownerDid === ownerDid)
        );
        const didKeyWallet = await getSigningAuthorityLearnCard(
            'did:key:z6MkOwner',
            'shared-authority'
        );

        const didWebWallet = await getSigningAuthorityLearnCard(
            'did:web:example.com:owner',
            'shared-authority'
        );

        const cachedDidWebWallet = await getSigningAuthorityLearnCard(
            'did:web:example.com:owner',
            'shared-authority'
        );

        expect(didWebWallet).not.toBe(didKeyWallet);
        expect(cachedDidWebWallet).toBe(didWebWallet);
        expect(mocks.initLearnCard).toHaveBeenCalledTimes(2);
        expect(mocks.initLearnCard).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ didWeb: 'did:web:example.com:owner' })
        );
    });
});
