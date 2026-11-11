// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { ShareLink, ShareRecoveryPlaintext, VC } from '@learncard/types';
import {
    prepareShare,
    prepareShareMetadataUpdate,
    shareWallet,
} from '../../components/share-links/shareLinkFlow';
const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:owner',
    credentialSubject: { id: 'did:example:owner' },
    proof: {
        type: 'Ed25519Signature2020',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:owner#key',
        created: '2026-10-03T00:00:00Z',
        proofValue: 'zfixture',
    },
} as VC;
const setup = async () => {
    const invokes = {
        getProfile: vi.fn(async () => ({ profileId: 'owner' })),
        createDagJwe: vi.fn(async () => ({ protected: 'e30', iv: 'a', ciphertext: 'b', tag: 'c' })),
        issuePresentation: vi.fn(async (vp: object) => ({
            ...vp,
            proof: { ...credential.proof, proofPurpose: 'authentication' },
        })),
        getShareLinkOwnerContent: vi.fn(),
    };
    const wallet = shareWallet({
        id: { did: () => 'did:example:owner' },
        read: { get: vi.fn(async () => credential) },
        index: { LearnCloud: { get: vi.fn(async () => []) } },
        invoke: invokes,
    });
    const reserved = {
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    };
    const attachment = { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', chunkCount: 4 };
    const original = await prepareShare(wallet, ['private:resume'], 'Resume', '', undefined, {
        identity: reserved,
        attachment,
    });
    const share = {
        id: reserved.id,
        version: 4,
        contentVersion: 1,
        status: 'active',
        selectedCount: 1,
        attachmentId: attachment.id,
        attachmentChunkCount: 4,
    } as ShareLink;
    const recovery = {
        shareId: share.id,
        ownerProfileId: 'owner',
        latest: { contentVersion: 1, key: original.key },
    } as ShareRecoveryPlaintext;
    invokes.getShareLinkOwnerContent.mockResolvedValue({
        id: share.id,
        contentVersion: 1,
        envelope: original.input.envelope,
    });
    return { wallet, invokes, original, share, recovery, attachment };
};
describe('managed resume link settings', () => {
    it('keeps the QR-reserved identity and attachment bound to creation', async () => {
        const { original, attachment } = await setup();
        expect(original.input.id).toBe('AAAAAAAAAAAAAAAAAAAAAA');
        expect(original.key).toBe('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        expect(original.input.attachment).toEqual(attachment);
    });
    it('changes metadata without re-signing, advancing the PDF version or deleting its binding', async () => {
        const { wallet, invokes, original, share, recovery } = await setup();
        const updated = await prepareShareMetadataUpdate(
            wallet,
            share,
            recovery,
            'Changed title',
            'Note',
            { passcode: 'passcode-example', notifyOnView: false }
        );
        expect(updated.payload).toEqual(original.payload);
        expect(updated.key).toBe(original.key);
        expect(updated.input).toMatchObject({
            id: share.id,
            expectedVersion: 4,
            title: 'Changed title',
            note: 'Note',
            passcode: 'passcode-example',
        });
        for (const field of [
            'contentVersion',
            'selectedCount',
            'envelope',
            'ownerEncryptedRecovery',
            'attachment',
        ])
            expect(updated.input).not.toHaveProperty(field);
        expect(invokes.issuePresentation).toHaveBeenCalledTimes(1);
    });
    it('fails closed for mismatched owner, stale envelope or recovery version', async () => {
        const { wallet, invokes, share, recovery } = await setup();
        await expect(
            prepareShareMetadataUpdate(
                wallet,
                share,
                { ...recovery, ownerProfileId: 'other' },
                'Title',
                ''
            )
        ).rejects.toThrow();
        invokes.getShareLinkOwnerContent.mockResolvedValue({
            id: share.id,
            contentVersion: 2,
            envelope: {},
        });
        await expect(
            prepareShareMetadataUpdate(wallet, share, recovery, 'Title', '')
        ).rejects.toThrow();
        await expect(
            prepareShareMetadataUpdate(
                wallet,
                share,
                { ...recovery, latest: { ...recovery.latest, contentVersion: 2 } },
                'Title',
                ''
            )
        ).rejects.toThrow();
    });
    it('refuses a second generic share of an existing version-bound resume attachment', async () => {
        const { wallet, invokes, original } = await setup();
        const protectedCredential = structuredClone(credential);
        protectedCredential.credentialSubject = {
            attachments: [
                {
                    url: 'urn:learncard:resume-pdf:aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
                    mediaType: 'application/pdf',
                    descriptions: [
                        'LearnCard protected resume PDF v1',
                        `SHA-256: ${'a'.repeat(64)}`,
                    ],
                    shareId: original.input.id,
                    contentVersion: 1,
                    chunkCount: 1,
                    byteLength: 32,
                    key: original.key,
                },
            ],
        };
        vi.mocked(wallet.read.get).mockResolvedValue(protectedCredential);
        await expect(prepareShare(wallet, ['private:resume'], 'Other link', '')).rejects.toThrow(
            'managed-resume'
        );
        expect(invokes.issuePresentation).toHaveBeenCalledTimes(1);
    });
});
