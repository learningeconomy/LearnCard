import { describe, expect, it, vi } from 'vitest';
import type { SentCredentialInfo, SharePayload } from '@learncard/types';
import { findSavedSharePresentation, type ShareWallet } from './shareLinkFlow';

const payload = {
    shareId: 'A'.repeat(22),
    sharer: { profileId: 'alice', displayName: 'Alice Sender' },
    presentation: {
        type: ['VerifiablePresentation'],
        verifiableCredential: [
            { name: 'Alice’s degree', credentialSubject: { id: 'did:key:alice' } },
        ],
    },
} as unknown as SharePayload;
const record: SentCredentialInfo = {
    uri: 'lc:network:retained',
    from: 'bob',
    to: 'bob',
    sent: '2026-11-06T12:00:00.000Z',
    metadata: {
        type: 'learncard.share-link.v1',
        shareId: payload.shareId,
        title: 'Degree',
        sharer: payload.sharer,
    },
};
const walletFor = (presentation: unknown) =>
    ({ read: { get: vi.fn(async () => presentation) } }) as unknown as ShareWallet;

describe('saved share presentation identity', () => {
    it('recognizes retained signed content independently of JSON object key order', async () => {
        const stored = {
            verifiableCredential: [
                { credentialSubject: { id: 'did:key:alice' }, name: 'Alice’s degree' },
            ],
            type: ['VerifiablePresentation'],
        };
        await expect(
            findSavedSharePresentation(walletFor(stored), [record], payload, 'bob')
        ).resolves.toEqual(record);
    });
    it('does not confuse an earlier selection at the same URL with the current collection', async () => {
        const stored = {
            ...payload.presentation,
            verifiableCredential: [{ name: 'Another credential' }],
        };
        await expect(
            findSavedSharePresentation(walletFor(stored), [record], payload, 'bob')
        ).resolves.toBeUndefined();
    });
    it.each([
        {
            label: 'another link',
            change: { metadata: { ...record.metadata, shareId: `B${'A'.repeat(21)}` } },
        },
        { label: 'another recipient', change: { from: 'carol', to: 'carol' } },
        { label: 'an external send', change: { from: 'alice' } },
        {
            label: 'another sender',
            change: {
                metadata: {
                    ...record.metadata,
                    sharer: { profileId: 'carol', displayName: 'Carol' },
                },
            },
        },
    ])('rejects $label even when the presentation contents match', async ({ change }) => {
        await expect(
            findSavedSharePresentation(
                walletFor(payload.presentation),
                [{ ...record, ...change }],
                payload,
                'bob'
            )
        ).resolves.toBeUndefined();
    });
    it('does not report saved when retained content cannot be read', async () => {
        const wallet = walletFor(null);
        vi.mocked(wallet.read.get).mockRejectedValue(new Error('unavailable'));
        await expect(
            findSavedSharePresentation(wallet, [record], payload, 'bob')
        ).resolves.toBeUndefined();
    });
    it('finds a readable matching snapshot after an unreadable earlier save', async () => {
        const matching = { ...record, uri: 'lc:network:matching' };
        const wallet = walletFor(payload.presentation);
        vi.mocked(wallet.read.get).mockRejectedValueOnce(new Error('old snapshot unavailable'));
        await expect(
            findSavedSharePresentation(wallet, [record, matching], payload, 'bob')
        ).resolves.toEqual(matching);
    });
});
