// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { VC, VerificationCheck } from '@learncard/types';
import { decryptSharePayload } from 'learn-card-base/helpers/share-links';
import {
    classifySharePublication,
    createVerificationBudget,
    mapWithConcurrency,
    prepareShare,
    prepareShareUpdate,
    proofState,
    readShareAddress,
    resolveExpiryIso,
    shareLinkOrigin,
    buildAppShareLinkUrl,
    shareWallet,
    verifyCredentialTree,
    verifySharedPresentation,
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
            verifyPresentation: vi
                .fn()
                .mockResolvedValue({ checks: ['proof'], warnings: [], errors: [] }),
        },
    });
describe('share publication boundary', () => {
    it.each([
        ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/v2'],
        [
            'https://evil.example/https://www.w3.org/ns/credentials/v2',
            'https://www.w3.org/2018/credentials/v1',
        ],
        [
            'https://www.w3.org/ns/credentials/v2.evil.example',
            'https://www.w3.org/2018/credentials/v1',
        ],
    ])('matches the entire context URL: %s', async (context, expected) => {
        const wallet = mockWallet();
        vi.mocked(wallet.read.get).mockResolvedValue({
            ...fixtureCredential,
            '@context': [context],
        });
        await prepareShare(wallet, ['private:credential'], 'My credentials', '');
        expect(wallet.invoke.issuePresentation).toHaveBeenCalledWith(
            expect.objectContaining({ '@context': [expected] }),
            expect.anything()
        );
    });

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
    it('replaces content at the same link id and key with the next content version', async () => {
        const wallet = mockWallet();
        const key = 'A'.repeat(43);
        const updated = await prepareShareUpdate(
            wallet,
            {
                id: 'A'.repeat(22),
                title: 'Old title',
                selectedCount: 1,
                version: 4,
                contentVersion: 2,
                status: 'active',
                contentState: 'finalized',
                createdAt: '2026-09-20T00:00:00.000Z',
                updatedAt: '2026-09-21T00:00:00.000Z',
                expiresAt: null,
                stoppedAt: null,
                lastViewedAt: null,
                passcodeProtected: true,
                notifyOnView: true,
                minorPolicy: {
                    isMinor: false,
                    policyResolved: true,
                    defaultExpiryDays: 365,
                    viewCountingEnabled: true,
                },
            },
            {
                protocol: 'lc-share-recovery/v1',
                shareId: 'A'.repeat(22),
                ownerProfileId: 'owner',
                createdAt: '2026-09-20T00:00:00.000Z',
                latest: { contentVersion: 2, key },
                selection: [{ ref: 'private:credential', order: 0 }],
                endorsements: [],
            },
            ['private:credential'],
            'Updated title',
            '',
            { passcode: '8642', notifyOnView: false }
        );

        expect(updated.key).toBe(key);
        expect(updated.input).toMatchObject({
            id: 'A'.repeat(22),
            expectedVersion: 4,
            contentVersion: 3,
            title: 'Updated title',
            note: null,
            passcode: '8642',
            notifyOnView: false,
        });
        const payload = (await decryptSharePayload({
            shareId: updated.input.id,
            contentVersion: 3,
            key,
            envelope: updated.input.envelope!,
        })) as { contentVersion: number };
        expect(payload.contentVersion).toBe(3);
        expect(wallet.invoke.createDagJwe).toHaveBeenCalledWith(
            expect.objectContaining({ latest: { contentVersion: 3, key } }),
            ['did:example:owner']
        );
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
            await verifyCredentialTree(
                wallet,
                {
                    ...fixtureCredential,
                    credentialSubject: { verifiableCredential: [fixtureCredential] },
                },
                createVerificationBudget()
            )
        ).toBe('failed');
        expect(wallet.invoke.verifyCredential).toHaveBeenCalledTimes(2);
    });
});

describe('shared verification budget', () => {
    it('reports remaining time and expires at the deadline', () => {
        let now = 1_000;
        const budget = createVerificationBudget(500, () => now);
        expect(budget.remaining()).toBe(500);
        expect(budget.expired()).toBe(false);
        now = 1_500;
        expect(budget.remaining()).toBe(0);
        expect(budget.expired()).toBe(true);
    });
    it('cancellation rejects its waiter and marks the pass expired', async () => {
        const budget = createVerificationBudget();
        const waiter = budget.whenCancelled().catch((error: Error) => error.message);
        budget.cancel();
        expect(budget.cancelled()).toBe(true);
        expect(budget.expired()).toBe(true);
        expect(await waiter).toBe('verification cancelled');
    });
    it('finishes with could-not-check when an issuer never responds', async () => {
        vi.useFakeTimers();
        try {
            const wallet = mockWallet();
            vi.mocked(wallet.invoke.verifyCredential).mockReturnValue(new Promise(() => {}));
            const checking = verifyCredentialTree(
                wallet,
                fixtureCredential,
                createVerificationBudget()
            );
            await vi.advanceTimersByTimeAsync(30_001);
            expect(await checking).toBe('unavailable');
        } finally {
            vi.useRealTimers();
        }
    });
    it('bounds holder verification by the same budget', async () => {
        vi.useFakeTimers();
        try {
            const wallet = mockWallet();
            vi.mocked(wallet.invoke.verifyPresentation).mockReturnValue(new Promise(() => {}));
            const checking = verifySharedPresentation(
                wallet,
                { presentation: fixtureCredential } as never,
                createVerificationBudget()
            );
            await vi.advanceTimersByTimeAsync(30_001);
            expect(await checking).toBe('unavailable');
        } finally {
            vi.useRealTimers();
        }
    });
    it('never reports an omitted nested check as verified', async () => {
        vi.useFakeTimers();
        try {
            const wallet = mockWallet();
            vi.mocked(wallet.invoke.verifyCredential)
                .mockResolvedValueOnce({ checks: ['proof'], warnings: [], errors: [] })
                .mockReturnValueOnce(new Promise(() => {}));
            const checking = verifyCredentialTree(
                wallet,
                {
                    ...fixtureCredential,
                    credentialSubject: { verifiableCredential: [fixtureCredential] },
                },
                createVerificationBudget()
            );
            await vi.advanceTimersByTimeAsync(30_001);
            expect(await checking).toBe('unavailable');
        } finally {
            vi.useRealTimers();
        }
    });
    it('stops scheduling new checks once the deadline has passed', async () => {
        vi.useFakeTimers();
        try {
            const wallet = mockWallet();
            vi.mocked(wallet.invoke.verifyCredential).mockReturnValue(new Promise(() => {}));
            const budget = createVerificationBudget();
            const first = verifyCredentialTree(wallet, fixtureCredential, budget);
            await vi.advanceTimersByTimeAsync(30_001);
            expect(await first).toBe('unavailable');
            const calls = vi.mocked(wallet.invoke.verifyCredential).mock.calls.length;
            expect(await verifyCredentialTree(wallet, fixtureCredential, budget)).toBe(
                'unavailable'
            );
            expect(vi.mocked(wallet.invoke.verifyCredential).mock.calls.length).toBe(calls);
        } finally {
            vi.useRealTimers();
        }
    });
    it('ignores a stale verified result after cancellation', async () => {
        const wallet = mockWallet();
        let resolveVerification: (result: VerificationCheck) => void = () => {};
        vi.mocked(wallet.invoke.verifyCredential).mockReturnValueOnce(
            new Promise<VerificationCheck>(resolve => {
                resolveVerification = resolve;
            })
        );
        const budget = createVerificationBudget();
        const checking = verifyCredentialTree(wallet, fixtureCredential, budget);
        budget.cancel();
        resolveVerification({ checks: ['proof'], warnings: [], errors: [] } as VerificationCheck);
        expect(await checking).toBe('unavailable');
    });
    it('stops a nested tree at cancellation without reporting verified', async () => {
        const wallet = mockWallet();
        let resolveNested: (result: VerificationCheck) => void = () => {};
        vi.mocked(wallet.invoke.verifyCredential)
            .mockResolvedValueOnce({ checks: ['proof'], warnings: [], errors: [] })
            .mockReturnValueOnce(
                new Promise<VerificationCheck>(resolve => {
                    resolveNested = resolve;
                })
            );
        const budget = createVerificationBudget();
        const checking = verifyCredentialTree(
            wallet,
            {
                ...fixtureCredential,
                credentialSubject: { verifiableCredential: [fixtureCredential] },
            },
            budget
        );
        await Promise.resolve();
        await Promise.resolve();
        budget.cancel();
        resolveNested({ checks: ['proof'], warnings: [], errors: [] } as VerificationCheck);
        expect(await checking).toBe('unavailable');
    });
});

describe('publication outcomes', () => {
    const share = { status: 'active', expiresAt: null } as never;
    it('maps every create and status tag without conflating them', () => {
        expect(classifySharePublication({ status: 'completed', share } as never)).toMatchObject({
            status: 'active',
        });
        expect(
            classifySharePublication({ status: 'pending', id: 'share', operationId: 'op' } as never)
        ).toMatchObject({ status: 'pending', operation: { id: 'share', operationId: 'op' } });
        expect(
            classifySharePublication({
                status: 'found',
                share: { status: 'stopped', expiresAt: null } as never,
            } as never)
        ).toMatchObject({ status: 'inactive' });
        expect(classifySharePublication({ status: 'not_found', id: 'share' } as never)).toEqual({
            status: 'abandoned',
            id: 'share',
        });
    });
});

describe('bounded picker reads', () => {
    it('keeps result order and never exceeds the concurrency cap', async () => {
        let active = 0;
        let peak = 0;
        const seen: number[] = [];
        const result = await mapWithConcurrency([0, 1, 2, 3, 4, 5, 6, 7], 4, async item => {
            active += 1;
            peak = Math.max(peak, active);
            await new Promise(resolve => setTimeout(resolve, (7 - item) % 3));
            seen.push(item);
            active -= 1;
            return item * 2;
        });
        expect(result).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
        expect(peak).toBeLessThanOrEqual(4);
        expect(active).toBe(0);
    });
});

describe('link base and expiry', () => {
    it('only accepts an https tenant base', () => {
        expect(shareLinkOrigin('https://learncard.app')).toBe('https://learncard.app');
        expect(shareLinkOrigin('http://localhost:3000')).toBeUndefined();
        expect(shareLinkOrigin('not a url')).toBeUndefined();
    });
    it('allows HTTP only for explicit loopback development, preserving the key', () => {
        const id = 'A'.repeat(22);
        const key = 'A'.repeat(43);
        for (const host of ['localhost:3000', '127.0.0.1:3000']) {
            expect(buildAppShareLinkUrl('http://' + host, id, key, true)).toBe(
                'http://' + host + '/s/' + id + '#' + key
            );
            expect(shareLinkOrigin('http://' + host, false)).toBeUndefined();
        }
        for (const host of ['learncard.app', 'localhost.evil.test', '192.168.1.2']) {
            expect(shareLinkOrigin('http://' + host, true)).toBeUndefined();
            expect(() => buildAppShareLinkUrl('http://' + host, id, key, true)).toThrow();
        }
        expect(shareLinkOrigin('http://user@localhost:3000', true)).toBeUndefined();
        expect(() => buildAppShareLinkUrl('http://localhost:3000', id, 'bad', true)).toThrow();
    });
    it('pins 7/30/365/never and defaults conservatively', () => {
        const now = Date.parse('2026-01-01T00:00:00.000Z');
        expect(resolveExpiryIso('never', now)).toBeNull();
        expect(resolveExpiryIso('7', now)).toBe('2026-01-08T00:00:00.000Z');
        expect(resolveExpiryIso('30', now)).toBe('2026-01-31T00:00:00.000Z');
        expect(resolveExpiryIso('365', now)).toBe('2027-01-01T00:00:00.000Z');
    });
    it('passes an explicit expiry (and null) into the create input', async () => {
        const pinned = '2026-02-01T00:00:00.000Z';
        const withExpiry = await prepareShare(mockWallet(), ['source'], 'Title', '', pinned);
        expect(withExpiry.input.expiresAt).toBe(pinned);
        const never = await prepareShare(mockWallet(), ['source'], 'Title', '', null);
        expect(never.input.expiresAt).toBeNull();
        const omitted = await prepareShare(mockWallet(), ['source'], 'Title', '');
        expect(omitted.input.expiresAt).toBeUndefined();
    });
});
