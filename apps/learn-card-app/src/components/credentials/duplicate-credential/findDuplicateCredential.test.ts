import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { findDuplicateCredential } from './findDuplicateCredential';

vi.mock('learn-card-base/hooks/useWallet', () => ({
    getCategoryForCredential: vi.fn().mockResolvedValue('Achievement'),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (value?: VC) =>
        value?.type?.includes('CertifiedBoostCredential') && value.boostCredential
            ? value.boostCredential
            : value,
}));

const credential = { id: 'urn:uuid:credential-id', type: ['VerifiableCredential'] } as VC;

const createWallet = ({
    exactRecords = [],
    boostRecords = [],
    categoryRecords = [],
    credentialsByUri = {},
}: {
    exactRecords?: { uri: string; id?: string; boostUri?: string }[];
    boostRecords?: { uri: string; id?: string; boostUri?: string }[];
    categoryRecords?: { uri: string; id?: string; boostUri?: string }[];
    credentialsByUri?: Record<string, VC>;
} = {}): BespokeLearnCard => {
    const get = vi
        .fn()
        .mockImplementation(({ id, boostUri }: { id?: string; boostUri?: string }) =>
            Promise.resolve(id ? exactRecords : boostUri ? boostRecords : categoryRecords)
        );

    return {
        index: { LearnCloud: { get } },
        read: {
            get: vi
                .fn()
                .mockImplementation((uri: string) => Promise.resolve(credentialsByUri[uri])),
        },
    } as unknown as BespokeLearnCard;
};

describe('findDuplicateCredential', () => {
    it('uses an exact index record without resolving its credential', async () => {
        const wallet = createWallet({
            exactRecords: [
                {
                    uri: 'lc:credential:existing',
                    id: 'urn:uuid:credential-id',
                },
            ],
        });
        vi.mocked(wallet.read.get).mockRejectedValue(new Error('temporary read failure'));

        await expect(findDuplicateCredential(wallet, credential)).resolves.toMatchObject({
            record: {
                uri: 'lc:credential:existing',
                id: 'urn:uuid:credential-id',
            },
            credential,
        });
        expect(wallet.read.get).not.toHaveBeenCalled();
    });

    it('finds legacy records whose wallet index ID differs from the credential ID', async () => {
        const wallet = createWallet({
            categoryRecords: [{ uri: 'lc:credential:legacy', id: 'random-index-id' }],
            credentialsByUri: { 'lc:credential:legacy': credential },
        });

        await expect(
            findDuplicateCredential(wallet, credential, { compareByContent: true })
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:legacy' },
            credential,
        });
    });

    it('compares the inner credential ID for saved CertifiedBoost credentials', async () => {
        const wrappedCredential = {
            id: 'urn:uuid:wrapper-id',
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: credential,
        } as VC;
        const wallet = createWallet({
            exactRecords: [{ uri: 'lc:credential:wrapped' }],
            credentialsByUri: { 'lc:credential:wrapped': wrappedCredential },
        });

        await expect(findDuplicateCredential(wallet, wrappedCredential)).resolves.toMatchObject({
            record: { uri: 'lc:credential:wrapped' },
        });
    });

    it('checks every category page until it finds a legacy duplicate', async () => {
        const wallet = createWallet({
            credentialsByUri: { 'lc:credential:second-page': credential },
        });
        const getPage = vi
            .fn()
            .mockResolvedValueOnce({
                records: [{ uri: 'lc:credential:first-page' }],
                hasMore: true,
                cursor: 'next-page',
            })
            .mockResolvedValueOnce({
                records: [{ uri: 'lc:credential:second-page' }],
                hasMore: false,
            });
        wallet.index.LearnCloud.getPage = getPage;

        await expect(
            findDuplicateCredential(wallet, credential, { compareByContent: true })
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:second-page' },
        });
        expect(getPage).toHaveBeenNthCalledWith(
            2,
            { category: 'Achievement' },
            { cursor: 'next-page', limit: 50 }
        );
    });
    it('matches a repeated claim link by boost URI when issuance creates a new credential ID', async () => {
        const boostUri = 'lc:network:example.org/trpc:boost:boost-id';
        const previewCredential = {
            id: 'urn:uuid:boost-template',
            type: ['VerifiableCredential', 'BoostCredential'],
        } as VC;
        const issuedCredential = {
            id: 'urn:uuid:issued-instance',
            type: ['VerifiableCredential', 'BoostCredential'],
            boostId: boostUri,
        } as VC;
        const wallet = createWallet({
            boostRecords: [{ uri: 'lc:credential:issued', boostUri }],
        });

        await expect(
            findDuplicateCredential(wallet, previewCredential, { boostUri })
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:issued', boostUri },
            credential: previewCredential,
        });
        expect(wallet.read.get).not.toHaveBeenCalled();
        expect(wallet.index.LearnCloud.get).toHaveBeenCalledWith({ boostUri });
    });

    it('uses the issued credential Boost URI for a repeated VC API interaction claim', async () => {
        const boostUri = 'lc:network:localhost%3A4000/trpc:boost:boost-id';
        const interactionCredential = {
            id: 'urn:uuid:new-interaction-issuance',
            type: ['VerifiableCredential', 'BoostCredential'],
            boostId: boostUri,
        } as VC;
        const savedCredential = {
            ...interactionCredential,
            id: 'urn:uuid:previous-interaction-issuance',
        } as VC;
        const wallet = createWallet({
            boostRecords: [{ uri: 'lc:credential:previous', boostUri }],
            credentialsByUri: { 'lc:credential:previous': savedCredential },
        });

        await expect(findDuplicateCredential(wallet, interactionCredential)).resolves.toMatchObject(
            {
                record: { uri: 'lc:credential:previous', boostUri },
                credential: interactionCredential,
            }
        );
    });

    it('matches legacy interaction claims by credential contents when no Boost URI was stored', async () => {
        const boostUri = 'lc:network:localhost%3A4000/trpc:boost:boost-id';
        const interactionCredential = {
            id: 'urn:uuid:new-open-badge',
            issuer: 'did:web:localhost%3A4000:users:kai-lef',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            validFrom: '2026-08-10T18:00:00.000Z',
            credentialSubject: {
                id: 'did:key:learner',
                type: ['AchievementSubject'],
                achievement: { type: ['Achievement'], name: 'Duplicate Claim Test' },
            },
            proof: { proofValue: 'new-proof' },
        } as VC;
        const savedCredential = {
            ...interactionCredential,
            id: 'urn:uuid:previous-open-badge',
            validFrom: '2026-08-10T17:00:00.000Z',
            proof: { proofValue: 'previous-proof' },
        } as VC;
        const wallet = createWallet({
            categoryRecords: [{ uri: 'lc:credential:legacy-interaction' }],
            credentialsByUri: { 'lc:credential:legacy-interaction': savedCredential },
        });

        await expect(
            findDuplicateCredential(wallet, interactionCredential, {
                boostUri,
                compareByContent: true,
            })
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:legacy-interaction' },
            credential: savedCredential,
        });
    });

    it('matches repeated notification claims by stable contents without a source Boost URI', async () => {
        const notificationCredential = {
            id: 'urn:uuid:new-notification-instance',
            issuer: 'did:web:localhost%3A4000:users:kai-lef',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            validFrom: '2026-08-12T18:00:00.000Z',
            credentialSubject: {
                id: 'did:key:learner',
                type: ['AchievementSubject'],
                achievement: { type: ['Achievement'], name: 'Notification Duplicate Test' },
            },
            proof: { proofValue: 'new-proof' },
        } as VC;
        const savedCredential = {
            ...notificationCredential,
            id: 'urn:uuid:previous-notification-instance',
            validFrom: '2026-08-12T17:00:00.000Z',
            proof: { proofValue: 'previous-proof' },
        } as VC;
        const wallet = createWallet({
            categoryRecords: [{ uri: 'lc:credential:previous-notification' }],
            credentialsByUri: { 'lc:credential:previous-notification': savedCredential },
        });

        await expect(
            findDuplicateCredential(wallet, notificationCredential, { compareByContent: true })
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:previous-notification' },
            credential: savedCredential,
        });
    });

    it('uses the caller-provided cached resolver for legacy content comparison', async () => {
        const wallet = createWallet({
            categoryRecords: [{ uri: 'lc:credential:legacy' }],
        });
        const resolveCredential = vi.fn().mockResolvedValue({
            ...credential,
            id: 'urn:uuid:previous-instance',
        });

        await expect(
            findDuplicateCredential(
                wallet,
                credential,
                { compareByContent: true },
                resolveCredential
            )
        ).resolves.toMatchObject({
            record: { uri: 'lc:credential:legacy' },
        });
        expect(resolveCredential).toHaveBeenCalledWith('lc:credential:legacy');
        expect(wallet.read.get).not.toHaveBeenCalled();
    });

    it('does not scan legacy records unless content comparison is explicitly requested', async () => {
        const wallet = createWallet({
            categoryRecords: [{ uri: 'lc:credential:legacy', id: 'random-index-id' }],
            credentialsByUri: { 'lc:credential:legacy': credential },
        });

        await expect(findDuplicateCredential(wallet, credential)).resolves.toBeNull();
        expect(wallet.read.get).not.toHaveBeenCalled();
        expect(wallet.index.LearnCloud.get).toHaveBeenCalledTimes(1);
    });

    it('does not scan the wallet when the incoming credential has no stable ID', async () => {
        const wallet = createWallet();

        await expect(
            findDuplicateCredential(wallet, { type: ['VerifiableCredential'] } as VC)
        ).resolves.toBeNull();
        expect(wallet.index.LearnCloud.get).not.toHaveBeenCalled();
    });
});
