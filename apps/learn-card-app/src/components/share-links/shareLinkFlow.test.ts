// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import { decryptSharePayload } from 'learn-card-base/helpers/share-links';
import {
    prepareShare,
    proofState,
    readShareAddress,
    shareWallet,
    verifyCredentialTree,
} from './shareLinkFlow';

export const fixtureCredential: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    id: 'urn:credential:one',
    issuer: 'did:example:issuer',
    name: 'Community leadership',
    credentialSubject: {
        id: 'did:example:owner',
        achievement: { name: 'Original signed title', customClaim: 42 },
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-09-21T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
        proofValue: 'fixture',
    },
};
const jwe = { protected: 'e30', iv: 'a', ciphertext: 'b', tag: 'c' };
const mockWallet = () =>
    shareWallet({
        id: { did: () => 'did:example:owner' },
        read: { get: vi.fn().mockResolvedValue(fixtureCredential) },
        index: { LearnCloud: { get: vi.fn().mockResolvedValue([]) } },
        invoke: {
            getProfile: vi.fn().mockResolvedValue({ profileId: 'owner', displayName: 'Alex' }),
            issuePresentation: vi.fn(async (vp: object) => ({
                ...vp,
                proof: { ...fixtureCredential.proof, proofPurpose: 'authentication' },
            })),
            createDagJwe: vi.fn().mockResolvedValue(jwe),
            decryptDagJwe: vi.fn(),
            verifyCredential: vi
                .fn()
                .mockResolvedValue({ checks: ['proof'], warnings: [], errors: [] }),
        },
    });
describe('share publication boundary', () => {
    it('preserves original signed claims and encrypts source URIs only for the owner', async () => {
        const wallet = mockWallet();
        const prepared = await prepareShare(
            wallet,
            ['private:credential'],
            'My credentials',
            'A note'
        );
        const payload = (await decryptSharePayload({
            shareId: prepared.input.id,
            contentVersion: 1,
            key: prepared.key,
            envelope: prepared.input.envelope,
        })) as { presentation: { verifiableCredential: VC[] } };
        expect(payload.presentation.verifiableCredential[0]).toEqual(fixtureCredential);
        expect(JSON.stringify(payload)).not.toContain('private:credential');
        expect(JSON.stringify(prepared.input)).not.toContain(prepared.key);
        expect(wallet.invoke.createDagJwe).toHaveBeenCalledWith(
            expect.objectContaining({
                selection: [{ ref: 'private:credential', order: 0 }],
                latest: { contentVersion: 1, key: prepared.key },
            }),
            ['did:example:owner']
        );
        expect(wallet.invoke.issuePresentation).toHaveBeenCalledWith(expect.anything(), {
            proofPurpose: 'authentication',
        });
    });
    it.each([[], Array(51).fill('source'), ['source', 'source']])(
        'rejects empty, oversized and duplicate selections',
        async refs => {
            await expect(prepareShare(mockWallet(), refs, 'Title', '')).rejects.toThrow();
        }
    );
    it('does not silently omit an unreadable selection', async () => {
        const wallet = mockWallet();
        vi.mocked(wallet.read.get).mockResolvedValueOnce(undefined);
        await expect(prepareShare(wallet, ['source'], 'Title', '')).rejects.toThrow();
        expect(wallet.invoke.issuePresentation).not.toHaveBeenCalled();
    });
    it('does not include private endorsements', async () => {
        const wallet = mockWallet();
        vi.mocked(wallet.index.LearnCloud.get).mockResolvedValue([
            { uri: 'secret', visibility: 'private' },
        ]);
        await prepareShare(wallet, ['source'], 'Title', '');
        expect(wallet.read.get).toHaveBeenCalledTimes(1);
    });
});
it('rejects an oversized selection before it can be sent', async () => {
    const wallet = mockWallet();
    vi.mocked(wallet.read.get).mockResolvedValue({
        ...fixtureCredential,
        largeClaim: 'x'.repeat(512 * 1024),
    });
    await expect(prepareShare(wallet, ['source'], 'Title', '')).rejects.toMatchObject({
        code: 'CIPHERTEXT_TOO_LARGE',
    });
});

describe('recipient validation', () => {
    it('requires a canonical complete fragment before any request', () => {
        expect(readShareAddress('A'.repeat(22), '')).toBeUndefined();
        expect(readShareAddress('A'.repeat(22), '#' + 'A'.repeat(42) + 'B')).toBeUndefined();
        expect(readShareAddress('A'.repeat(22), '#' + 'A'.repeat(43))).toBeDefined();
    });
    it('does not equate empty checks or warnings with verified', () => {
        expect(proofState({ checks: [], warnings: [], errors: [] })).toBe('unavailable');
        expect(
            proofState({ checks: ['proof'], warnings: ['issuer binding unknown'], errors: [] })
        ).toBe('unavailable');
        expect(proofState({ checks: ['proof'], warnings: [], errors: ['bad signature'] })).toBe(
            'failed'
        );
    });
    it('propagates nested CLR signature failures', async () => {
        const wallet = mockWallet();
        vi.mocked(wallet.invoke.verifyCredential)
            .mockResolvedValueOnce({ checks: ['proof'], warnings: [], errors: [] })
            .mockResolvedValueOnce({ checks: [], warnings: [], errors: ['bad'] });
        expect(
            await verifyCredentialTree(wallet, {
                ...fixtureCredential,
                credentialSubject: { verifiableCredential: [fixtureCredential] },
            })
        ).toBe('failed');
        expect(wallet.invoke.verifyCredential).toHaveBeenCalledTimes(2);
    });
});

it('finishes with could-not-check when an issuer never responds', async () => {
    vi.useFakeTimers();
    try {
        const wallet = mockWallet();
        vi.mocked(wallet.invoke.verifyCredential).mockReturnValue(new Promise(() => {}));
        const checking = verifyCredentialTree(wallet, fixtureCredential);
        await vi.advanceTimersByTimeAsync(30_001);
        expect(await checking).toBe('unavailable');
    } finally {
        vi.useRealTimers();
    }
});
