// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { prepareFixtureById, buildFinalTranscriptVariant, wallet } = vi.hoisted(() => {
    const prepare = vi.fn(() => ({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: 'urn:uuid:stable-transcript',
        type: ['VerifiableCredential', 'ClrCredential'],
        issuer: 'did:web:issuer',
        validFrom: '2026-09-03T12:00:00.000Z',
        credentialSubject: { id: 'did:web:holder', privateGrade: 'A' },
    }));
    const finalVariant = vi.fn((credential: Record<string, unknown>, options) => ({
        ...credential,
        name: 'Final Transcript',
        validFrom: options.validFrom,
    }));
    const invoke = {
        allocateCredentialRefresh: vi.fn().mockResolvedValue({
            refreshId: 'safe-refresh-id',
            refreshService: {
                id: 'https://network.example/refresh/safe-refresh-id',
                type: '1EdTechCredentialRefresh',
                authorization: { type: 'LearnCardDIDAuth' },
            },
        }),
        issueCredential: vi
            .fn()
            .mockImplementation(async credential => ({ ...credential, proof: { type: 'proof' } })),
        sendRefreshableCredential: vi.fn().mockResolvedValue('lc:network:credential:one'),
        acceptCredential: vi.fn().mockResolvedValue(true),
        publishCredentialRefresh: vi.fn().mockResolvedValue({
            refreshId: 'safe-refresh-id',
            version: 2,
            publishedAt: '2026-09-03T12:01:00.000Z',
            notification: 'queued',
        }),
    };

    return {
        prepareFixtureById: prepare,
        buildFinalTranscriptVariant: finalVariant,
        wallet: { invoke },
    };
});

vi.mock('@learncard/credential-library', () => ({
    prepareFixtureById,
    buildFinalTranscriptVariant,
}));

vi.mock('../context/WalletContext', () => ({
    useWallet: () => ({
        wallet,
        did: 'did:web:holder',
        profile: {
            did: 'did:web:holder',
            profileId: 'holder-profile',
            displayName: 'Test Holder',
        },
        status: 'connected',
    }),
}));

import { ManagedRefreshPanel } from './ManagedRefreshPanel';

const flush = async (): Promise<void> => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
};

describe('ManagedRefreshPanel', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.clearAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderPanel = async (): Promise<void> => {
        await act(async () => root.render(<ManagedRefreshPanel />));
    };

    const button = (label: string): HTMLButtonElement => {
        const match = [...container.querySelectorAll('button')].find(element =>
            element.textContent?.includes(label)
        );

        if (!(match instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`);

        return match;
    };

    it('allocates before signing, preserves the stable ID, then publishes the final version', async () => {
        await renderPanel();

        await act(async () => button('Issue Provisional Transcript').click());
        await flush();

        expect(wallet.invoke.allocateCredentialRefresh).toHaveBeenCalledWith({
            holder: { profileId: 'holder-profile', did: 'did:web:holder' },
            credentialId: 'urn:uuid:stable-transcript',
        });

        const signedProvisional = wallet.invoke.issueCredential.mock.calls[0]?.[0];
        expect(signedProvisional.id).toBe('urn:uuid:stable-transcript');
        expect(signedProvisional.refreshService).toMatchObject({
            id: 'https://network.example/refresh/safe-refresh-id',
        });
        expect(wallet.invoke.allocateCredentialRefresh.mock.invocationCallOrder[0]).toBeLessThan(
            wallet.invoke.issueCredential.mock.invocationCallOrder[0]
        );
        expect(wallet.invoke.sendRefreshableCredential).toHaveBeenCalledWith(
            'safe-refresh-id',
            expect.objectContaining({ id: 'urn:uuid:stable-transcript' })
        );
        expect(wallet.invoke.acceptCredential).toHaveBeenCalledWith('lc:network:credential:one');

        await act(async () => button('Publish Final Transcript').click());
        await flush();

        const finalUnsigned = wallet.invoke.issueCredential.mock.calls[1]?.[0];
        expect(finalUnsigned.id).toBe('urn:uuid:stable-transcript');
        expect(wallet.invoke.publishCredentialRefresh).toHaveBeenCalledWith({
            mode: 'issuer-signed',
            refreshId: 'safe-refresh-id',
            signedCredential: expect.objectContaining({ id: 'urn:uuid:stable-transcript' }),
        });

        expect(container.textContent).toContain('Managed version 2');
        expect(container.textContent).toContain('safe-refresh-id');
        expect(container.textContent).not.toContain('privateGrade');
    });

    it('shows contextual loading and a friendly failure without exposing raw errors', async () => {
        let rejectAllocation: (error: Error) => void = () => {};
        wallet.invoke.allocateCredentialRefresh.mockImplementationOnce(
            () =>
                new Promise((_resolve, reject) => {
                    rejectAllocation = reject;
                })
        );

        await renderPanel();

        act(() => button('Issue Provisional Transcript').click());
        expect(container.textContent).toContain('Issuing...');

        await act(async () => rejectAllocation(new Error('database password leaked')));
        await flush();

        expect(container.textContent).toContain('Could not issue the provisional transcript.');
        expect(container.textContent).not.toContain('database password leaked');
    });
});
