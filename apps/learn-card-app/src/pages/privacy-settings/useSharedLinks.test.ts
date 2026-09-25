import { describe, expect, it, vi } from 'vitest';
import type { VC, VP } from '@learncard/types';

import type { ShareWallet } from '../../components/share-links/shareLinkFlow';
import { loadSavedCredentialCollections } from './savedCollections';

const proof = {
    type: 'Ed25519Signature2020',
    created: '2026-09-20T12:00:00.000Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:key:zIssuer#zIssuer',
    jws: 'signed',
};

const credential = (name: string): VC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:key:zIssuer',
    issuanceDate: '2026-09-20T12:00:00.000Z',
    credentialSubject: { id: 'did:key:zRecipient', name },
    proof,
});

const presentation = (...credentials: VC[]): VP => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    holder: 'did:key:zRecipient',
    verifiableCredential: credentials,
    proof: { ...proof, proofPurpose: 'authentication' },
});

describe('loadSavedCredentialCollections', () => {
    it('hydrates received presentations and sorts the newest collection first', async () => {
        const wallet = {
            invoke: {
                getReceivedPresentations: vi.fn(async () => [
                    {
                        uri: 'lc:network:older',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-20T12:00:00.000Z',
                        received: '2026-09-20T12:01:00.000Z',
                    },
                    {
                        uri: 'lc:network:newer',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-24T12:00:00.000Z',
                        received: '2026-09-24T12:01:00.000Z',
                        metadata: {
                            type: 'learncard.share-link.v1',
                            shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
                            title: 'Career highlights',
                            note: 'Selected credentials for applications',
                            sharer: {
                                profileId: 'mister-localhost',
                                displayName: 'Mister Localhost',
                            },
                        },
                    },
                ]),
            },
            read: {
                get: vi.fn(async (uri: string) =>
                    uri.endsWith('newer')
                        ? presentation(credential('Badge'), credential('Certificate'))
                        : presentation(credential('Course'))
                ),
            },
        } as unknown as ShareWallet;

        const collections = await loadSavedCredentialCollections(wallet);

        expect(collections.map(collection => collection.uri)).toEqual([
            'lc:network:newer',
            'lc:network:older',
        ]);
        expect(collections.map(collection => collection.credentialCount)).toEqual([2, 1]);
        expect(collections[0]).toMatchObject({
            shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
            title: 'Career highlights',
            note: 'Selected credentials for applications',
            sharer: { profileId: 'mister-localhost', displayName: 'Mister Localhost' },
        });
    });

    it('keeps only the newest save for the same private share', async () => {
        const metadata = {
            type: 'learncard.share-link.v1',
            shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
            title: 'Career highlights',
            sharer: { profileId: 'sender', displayName: 'Alex' },
        };
        const wallet = {
            invoke: {
                getReceivedPresentations: vi.fn(async () => [
                    {
                        uri: 'lc:network:first',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-24T12:00:00.000Z',
                        received: '2026-09-24T12:01:00.000Z',
                        metadata,
                    },
                    {
                        uri: 'lc:network:second',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-25T12:00:00.000Z',
                        received: '2026-09-25T12:01:00.000Z',
                        metadata,
                    },
                ]),
            },
            read: { get: vi.fn(async () => presentation(credential('Badge'))) },
        } as unknown as ShareWallet;

        await expect(loadSavedCredentialCollections(wallet)).resolves.toMatchObject([
            { uri: 'lc:network:second', title: 'Career highlights' },
        ]);
    });

    it('collapses identical legacy presentations that have no share metadata', async () => {
        const savedPresentation = presentation(credential('Badge'));
        const wallet = {
            invoke: {
                getReceivedPresentations: vi.fn(async () => [
                    {
                        uri: 'lc:network:first',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-24T12:00:00.000Z',
                    },
                    {
                        uri: 'lc:network:second',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-25T12:00:00.000Z',
                    },
                ]),
            },
            read: { get: vi.fn(async () => savedPresentation) },
        } as unknown as ShareWallet;

        await expect(loadSavedCredentialCollections(wallet)).resolves.toMatchObject([
            { uri: 'lc:network:second', credentialCount: 1 },
        ]);
    });

    it('keeps valid collections when one received presentation cannot be read', async () => {
        const wallet = {
            invoke: {
                getReceivedPresentations: vi.fn(async () => [
                    {
                        uri: 'lc:network:valid',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-24T12:00:00.000Z',
                    },
                    {
                        uri: 'lc:network:missing',
                        from: 'recipient',
                        to: 'recipient',
                        sent: '2026-09-23T12:00:00.000Z',
                    },
                ]),
            },
            read: {
                get: vi.fn(async (uri: string) => {
                    if (uri.endsWith('missing')) throw new Error('missing');
                    return presentation(credential('Badge'));
                }),
            },
        } as unknown as ShareWallet;

        await expect(loadSavedCredentialCollections(wallet)).resolves.toMatchObject([
            { uri: 'lc:network:valid', credentialCount: 1 },
        ]);
    });
});
