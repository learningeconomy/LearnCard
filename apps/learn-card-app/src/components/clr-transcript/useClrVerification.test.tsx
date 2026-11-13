import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeClrTranscriptDisplayModel } from 'learn-card-base/helpers/credentials/clr/renderer';
import { createClrVerificationSnapshot } from 'learn-card-base/helpers/credentials/clr/verification';
import type { VerificationCheck } from '@learncard/types';
import { useClrVerification } from './useClrVerification';

const { initWallet, verifyCredential } = vi.hoisted(() => ({
    initWallet: vi.fn(),
    verifyCredential: vi.fn(),
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: (...args: unknown[]) => initWallet(...args),
}));

const child = {
    id: 'child-source-id',
    type: ['VerifiableCredential'],
    issuer: { id: 'did:web:district.example', name: 'District' },
    proof: { type: 'DataIntegrityProof', verificationMethod: 'did:web:district.example#key-1' },
    credentialSubject: {
        id: 'did:key:learner',
        achievement: { id: 'course-1', achievementType: 'Course', name: 'Course' },
    },
    credentialStatus: {
        id: 'https://district.example/status',
        type: 'BitstringStatusListEntry',
        statusPurpose: 'suspension',
        statusListIndex: '1',
        statusListCredential: 'https://district.example/list',
    },
};
const model = normalizeClrTranscriptDisplayModel({
    id: 'outer-id',
    type: ['ClrCredential'],
    issuer: { id: 'did:web:publisher.example' },
    proof: { type: 'DataIntegrityProof', verificationMethod: 'did:web:publisher.example#key-1' },
    credentialSubject: { id: 'did:key:learner', verifiableCredential: [child] },
});

const result = (credential: Record<string, unknown>): VerificationCheck => ({
    checks: ['proof'],
    warnings: [],
    errors: [],
    status:
        credential.id === 'child-source-id'
            ? [
                  {
                      entryType: 'BitstringStatusListEntry',
                      statusPurpose: 'suspension',
                      isSet: true,
                      statusListCredential: 'https://district.example/list',
                      statusListIndex: '1',
                  },
              ]
            : [],
});
beforeEach(() => vi.clearAllMocks());

describe('useClrVerification', () => {
    it('passes the raw wallet check through, preserving structured suspension results', async () => {
        initWallet.mockResolvedValue({
            invoke: {
                verifyCredential: verifyCredential.mockImplementation(async credential =>
                    result(credential)
                ),
            },
        });
        const { result: hook } = renderHook(() => useClrVerification(model));
        await waitFor(() =>
            expect(hook.current.snapshot.records[model.records[0].id]?.lifecycle).toBe('suspended')
        );
        expect(verifyCredential).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'child-source-id' }),
            {},
            false
        );
    });

    it('does not create a second verifier when a host supplies a snapshot', () => {
        initWallet.mockClear();
        renderHook(() => useClrVerification(model, createClrVerificationSnapshot(model.canonical)));
        expect(initWallet).not.toHaveBeenCalled();
    });

    it('starts a fresh bounded raw pass on retry', async () => {
        initWallet.mockResolvedValue({
            invoke: {
                verifyCredential: verifyCredential.mockImplementation(async credential =>
                    result(credential)
                ),
            },
        });
        const { result: hook } = renderHook(() => useClrVerification(model));
        await waitFor(() => expect(hook.current.snapshot.complete).toBe(true));
        const before = verifyCredential.mock.calls.length;
        act(() => hook.current.retry());
        await waitFor(() => expect(verifyCredential.mock.calls.length).toBeGreaterThan(before));
    });
    it('cancels before wallet initialization completes and never schedules verification', async () => {
        let resolveWallet!: (wallet: unknown) => void;
        initWallet.mockReturnValue(
            new Promise(resolve => {
                resolveWallet = resolve;
            })
        );
        const { unmount } = renderHook(() => useClrVerification(model));
        await waitFor(() => expect(initWallet).toHaveBeenCalled());
        unmount();
        await act(async () => resolveWallet({ invoke: { verifyCredential } }));
        expect(verifyCredential).not.toHaveBeenCalled();
    });
});
