import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    init: vi.fn(),
    receive: vi.fn(),
    save: vi.fn(),
    respond: vi.fn(),
    reset: vi.fn(),
    currentUser: { privateKey: 'test' },
    did: undefined as string | undefined,
}));
vi.mock('learn-card-base', () => ({
    useCurrentUser: () => mocks.currentUser,
    useWallet: () => ({ initWallet: mocks.init, storeAndAddVCToWallet: mocks.save }),
    chapiStore: { set: { isChapiInteraction: mocks.reset } },
    redirectStore: { set: { authRedirect: mocks.reset } },
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { use: { switchedDid: () => mocks.did } },
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialName: (vc: { name: string }) => vc.name,
    getIssuerName: () => 'Demo issuer',
    getImageUrlFromCredential: () => '',
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Full credential details</div>,
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => null,
}));
vi.mock('../../paraglide/messages.js', () => ({
    'chapi.receive.title': () => 'Add to Passport',
    'chapi.receive.description': () => 'Review the credentials',
    'chapi.receive.from': ({ origin }: { origin: string }) => origin,
    'chapi.receive.loading': () => 'Getting credentials...',
    'chapi.receive.saved': () => 'Saved to your Passport.',
    'chapi.receive.cancelled': () => 'Request cancelled.',
    'chapi.receive.credential': () => 'Credential',
    'chapi.receive.issuerUnavailable': () => 'Issuer name unavailable',
    'chapi.receive.details': () => 'Details',
    'chapi.receive.progress': ({ saved, total }: { saved: number; total: number }) =>
        `Saved ${saved} of ${total}`,
    'chapi.receive.cancel': () => 'Cancel',
    'chapi.receive.saving': () => 'Saving...',
    'chapi.receive.retry': () => 'Try Again',
    'chapi.receive.accept': () => 'Save to Passport',
    'chapi.receive.error.invalid': () => 'Invalid credential',
    'chapi.receive.error.request': () => 'Could not get credentials',
    'chapi.receive.error.save': () => 'Could not finish saving',
    'chapi.receive.error.response': () => 'Saved, but could not notify issuer',
}));
import { CredentialReceivePage } from './CredentialReceivePage';
const credential = (name: string) => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    credentialSubject: {},
    name,
    proof: {
        type: 'DataIntegrityProof',
        cryptosuite: 'ecdsa-rdfc-2019',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
    },
});
const presentation = {
    type: ['VerifiablePresentation'],
    verifiableCredential: [credential('First'), credential('Second')],
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = { privateKey: 'test' };
    mocks.did = undefined;
    mocks.init.mockResolvedValue({
        id: { did: () => 'did:key:test' },
        invoke: { receiveChapiEvent: mocks.receive },
    });
    mocks.receive.mockResolvedValue({
        credential: { data: presentation },
        credentialRequestOrigin: 'https://issuer.example/request?SECRET_CANARY',
        respondWith: mocks.respond,
    });
    mocks.save.mockResolvedValue({ result: true, credentialUri: 'test-uri' });
});
const ready = () => screen.findByRole('button', { name: 'Save to Passport' });

describe('credential receive interaction', () => {
    it('consumes the mediator event only once during StrictMode replay and rerenders', async () => {
        const { rerender } = render(
            <StrictMode>
                <CredentialReceivePage />
            </StrictMode>
        );
        await ready();
        rerender(
            <StrictMode>
                <CredentialReceivePage />
            </StrictMode>
        );
        expect(mocks.receive).toHaveBeenCalledOnce();
        expect(screen.queryByText(/SECRET_CANARY/)).toBeNull();
    });
    it('recovers from a failed save, resumes the batch, and responds only after all saves', async () => {
        mocks.save
            .mockResolvedValueOnce({ result: true, credentialUri: 'first-uri' })
            .mockRejectedValueOnce(new Error('SERVER_SECRET_CANARY'));
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByRole('alert');
        expect(screen.getByText('Could not finish saving')).toBeVisible();
        expect(screen.queryByText(/SERVER_SECRET_CANARY/)).toBeNull();
        expect(mocks.respond).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
        const firstRetryId = mocks.save.mock.calls[1][1].id;
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await screen.findByText('Saved to your Passport.');
        expect(mocks.save.mock.calls.map(call => call[0].name)).toEqual([
            'First',
            'Second',
            'Second',
        ]);
        expect(mocks.save.mock.calls[2][1].id).toBe(firstRetryId);
        expect(await mocks.respond.mock.calls[0][0]).toEqual({
            dataType: 'VerifiablePresentation',
            data: presentation,
        });
        expect(mocks.respond).toHaveBeenCalledOnce();
    });
    it('blocks duplicate submission and cancellation while saving', async () => {
        let resolve!: (result: { result: boolean; credentialUri: string }) => void;
        mocks.save.mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );
        render(<CredentialReceivePage />);
        const button = await ready();
        fireEvent.click(button);
        fireEvent.click(button);
        expect(mocks.save).toHaveBeenCalledOnce();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
        await act(async () => resolve({ result: true, credentialUri: 'test-uri' }));
    });
    it('cancels without uploading or saving anything', async () => {
        render(<CredentialReceivePage />);
        await ready();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(await mocks.respond.mock.calls[0][0]).toBeNull();
        expect(mocks.save).not.toHaveBeenCalled();
    });
    it('surfaces receive failures instead of showing an endless loading screen', async () => {
        mocks.receive.mockRejectedValue(new Error('TIMEOUT_CANARY'));
        render(<CredentialReceivePage />);
        await screen.findByText('Could not get credentials');
        expect(screen.queryByRole('status')).toBeNull();
        expect(screen.queryByText(/TIMEOUT_CANARY/)).toBeNull();
    });
    it('does not acknowledge an old account request after a profile switch during save', async () => {
        let resolve!: (result: { result: boolean; credentialUri: string }) => void;
        mocks.save.mockImplementationOnce(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );
        const { rerender } = render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        mocks.did = 'did:web:other-account';
        rerender(<CredentialReceivePage />);
        await act(async () => resolve({ result: true, credentialUri: 'test-uri' }));
        expect(mocks.respond).not.toHaveBeenCalled();
        expect(mocks.save).toHaveBeenCalledOnce();
    });
    it('does not revive an old save when switching away and back to the same profile', async () => {
        let resolve!: (result: { result: boolean; credentialUri: string }) => void;
        mocks.save.mockImplementationOnce(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );
        const { rerender } = render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        mocks.did = 'did:web:other';
        rerender(<CredentialReceivePage />);
        mocks.did = undefined;
        rerender(<CredentialReceivePage />);
        await act(async () => resolve({ result: true, credentialUri: 'test-uri' }));
        expect(mocks.respond).not.toHaveBeenCalled();
        expect(mocks.save).toHaveBeenCalledOnce();
    });
    it('keeps a successful acknowledgement successful when local cleanup fails', async () => {
        mocks.reset.mockImplementationOnce(() => {
            throw new Error('local storage unavailable');
        });
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByText('Saved to your Passport.');
        expect(mocks.respond).toHaveBeenCalledOnce();
        expect(screen.queryByRole('alert')).toBeNull();
    });
    it('renders the full preview only after the user expands Details', async () => {
        render(<CredentialReceivePage />);
        await ready();
        expect(screen.queryByText('Full credential details')).toBeNull();
        const details = screen.getByText('First').closest('details')!;
        details.open = true;
        fireEvent(details, new Event('toggle'));
        await screen.findByText('Full credential details');
    });
    it('does not acknowledge unsuccessful index results', async () => {
        mocks.save.mockResolvedValue({ result: false, credentialUri: 'test-uri' });
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByRole('alert');
        expect(mocks.respond).not.toHaveBeenCalled();
    });
});
