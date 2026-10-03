import { describe, it, expect } from 'vitest';

import {
    generateEscrowCancelToken,
    hashEscrowCancelToken,
    escrowCancelTokenMatches,
} from './escrowCancelToken';

import type { EscrowHold } from '@models';

const baseHold = (overrides: Partial<EscrowHold> = {}): EscrowHold => {
    const now = new Date();
    return {
        holdRecord: {
            hold: {
                holdId: 'hold-id',
                did: 'did:key:test',
                shareVersion: 1,
                blobHash: 'ab'.repeat(32),
                enrollmentEpoch: 1,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: 'public-key',
                createdLo: 0,
                createdHi: 0,
                policyVersion: 1,
                signature: 'test-signature',
            },
            holdDurationMs: 0,
            ledgerSeq: 0,
        },
        _id: 'hold-id',
        authProvider: { type: 'firebase', id: 'user-1' },
        primaryDid: 'did:key:test',
        shareVersion: 1,
        status: 'pending',
        identityProofType: 'auth-token',
        requestedAt: now,
        releaseAfter: now,
        releasePolicy: 'hold',
        clientEphemeralPublicKey: 'public-key',
        resumeTokenHash: 'a'.repeat(64),
        notifications: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
};

describe('escrowCancelToken helpers', () => {
    it('generates unique, high-entropy hex tokens', () => {
        const token = generateEscrowCancelToken();

        expect(token).toMatch(/^[0-9a-f]{64}$/);
        expect(generateEscrowCancelToken()).not.toBe(token);
    });

    it('hashes deterministically without ever equaling the plaintext', () => {
        const token = generateEscrowCancelToken();
        const hash = hashEscrowCancelToken(token);

        expect(hash).toMatch(/^[0-9a-f]{64}$/);
        expect(hash).not.toBe(token);
        expect(hashEscrowCancelToken(token)).toBe(hash);
    });

    it('matches the correct token against a pending, unused hold', () => {
        const token = generateEscrowCancelToken();
        const hold = baseHold({ cancelTokenHash: hashEscrowCancelToken(token) });

        expect(escrowCancelTokenMatches(hold, token)).toBe(true);
    });

    it('rejects a wrong token', () => {
        const token = generateEscrowCancelToken();
        const hold = baseHold({ cancelTokenHash: hashEscrowCancelToken(token) });

        expect(escrowCancelTokenMatches(hold, generateEscrowCancelToken())).toBe(false);
    });

    it('rejects an already-used token', () => {
        const token = generateEscrowCancelToken();
        const hold = baseHold({
            cancelTokenHash: hashEscrowCancelToken(token),
            cancelTokenUsedAt: new Date(),
        });

        expect(escrowCancelTokenMatches(hold, token)).toBe(false);
    });

    it('rejects a non-pending hold even with a correct, unused token', () => {
        const token = generateEscrowCancelToken();

        for (const status of ['cancelled', 'completed', 'expired'] as const) {
            const hold = baseHold({ status, cancelTokenHash: hashEscrowCancelToken(token) });

            expect(escrowCancelTokenMatches(hold, token)).toBe(false);
        }
    });

    it('rejects when no cancel token was ever issued on the hold', () => {
        const hold = baseHold();

        expect(escrowCancelTokenMatches(hold, generateEscrowCancelToken())).toBe(false);
    });
});
