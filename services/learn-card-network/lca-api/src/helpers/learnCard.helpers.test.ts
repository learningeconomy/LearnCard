import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getSigningAuthorityForDid: vi.fn(async () => ({ seed: 'shared-seed' })),
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

describe('getSigningAuthorityLearnCard', () => {
    it('isolates cached wallets by owner DID when authorities share a seed', async () => {
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
