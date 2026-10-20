import React, { StrictMode } from 'react';
import { webcrypto } from 'node:crypto';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    'chapi.receive.savedBeforeCancel': ({ saved }: { saved: number }) => `Already saved: ${saved}`,
    'chapi.receive.error.cancel': () =>
        'Cancellation could not notify issuer. Return to the website.',
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
    'chapi.receive.error.account': () => 'Account changed. Start a new request.',
}));
import { getCredentialPayloadRecordId } from 'learn-card-base/helpers/credentialStorageIdentity';
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
    vi.resetAllMocks();
    vi.stubGlobal('crypto', webcrypto);
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
afterEach(() => vi.unstubAllGlobals());
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
    it('never consumes a second mediator event after a profile switch', async () => {
        mocks.receive
            .mockImplementationOnce(async () => ({
                credential: { data: presentation },
                respondWith: mocks.respond,
            }))
            .mockImplementationOnce(() => new Promise(() => {}));
        const { rerender } = render(<CredentialReceivePage />);
        await ready();
        mocks.did = 'did:web:other';
        rerender(<CredentialReceivePage />);
        await screen.findByText('Account changed. Start a new request.');
        expect(screen.queryByText('Getting credentials...')).toBeNull();
        expect(screen.queryByText('First')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save to Passport' })).toBeNull();
        mocks.did = undefined;
        rerender(<CredentialReceivePage />);
        expect(screen.getByText('Account changed. Start a new request.')).toBeVisible();
        expect(mocks.receive).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(await mocks.respond.mock.calls[0][0]).toBeNull();
        expect(mocks.save).not.toHaveBeenCalled();
    });
    it('enables cancellation as soon as the event arrives, aborting a pending exchange', async () => {
        const fetch = vi.fn(
            (_url: string, options: { signal: AbortSignal }) =>
                new Promise((_resolve, reject) => {
                    options.signal.addEventListener('abort', () =>
                        reject(new DOMException('aborted', 'AbortError'))
                    );
                })
        );
        vi.stubGlobal('fetch', fetch);
        mocks.receive.mockResolvedValue({
            credential: {
                data: {},
                options: { protocols: { vcapi: 'https://issuer.example/exchange' } },
            },
            respondWith: mocks.respond,
        });
        render(<CredentialReceivePage />);
        const cancel = await screen.findByRole('button', { name: 'Cancel' });
        expect(cancel).toBeEnabled();
        expect(screen.getByText('Getting credentials...')).toBeVisible();
        fireEvent.click(cancel);
        await screen.findByText('Request cancelled.');
        expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
        expect(await mocks.respond.mock.calls[0][0]).toBeNull();
        expect(mocks.receive).toHaveBeenCalledOnce();
        expect(mocks.save).not.toHaveBeenCalled();
        expect(screen.queryByRole('alert')).toBeNull();
        vi.unstubAllGlobals();
    });
    it('invalidates a pending one-shot receive even if the account switches back', async () => {
        let resolve!: (event: object) => void;
        mocks.receive.mockImplementationOnce(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );
        const { rerender } = render(<CredentialReceivePage />);
        await act(async () => {});
        mocks.did = 'did:web:other';
        rerender(<CredentialReceivePage />);
        mocks.did = undefined;
        rerender(<CredentialReceivePage />);
        await act(async () =>
            resolve({ credential: { data: presentation }, respondWith: mocks.respond })
        );
        expect(screen.getByText('Account changed. Start a new request.')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
        expect(mocks.receive).toHaveBeenCalledOnce();
        expect(mocks.save).not.toHaveBeenCalled();
    });
    it('does not retry a consumed response when notification fails after saving', async () => {
        mocks.respond.mockImplementationOnce(() => {
            throw new Error('already consumed');
        });
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByText('Saved, but could not notify issuer');
        expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        expect(mocks.respond).toHaveBeenCalledOnce();
        expect(mocks.save).toHaveBeenCalledTimes(2);
    });
    it('uses the full signed payload to deduplicate reopened offers', async () => {
        mocks.receive.mockResolvedValue({
            credential: {
                data: {
                    ...presentation,
                    verifiableCredential: [
                        { ...credential('First'), id: 'urn:uuid:stable-credential' },
                    ],
                },
            },
            respondWith: mocks.respond,
        });
        const { unmount } = render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByText('Saved to your Passport.');
        unmount();
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByText('Saved to your Passport.');
        const id = await getCredentialPayloadRecordId(
            { ...credential('First'), id: 'urn:uuid:stable-credential' },
            'did:key:test'
        );
        expect(mocks.save.mock.calls.map(call => call[1].id)).toEqual([id, id]);
    });
    it('saves both distinct signed payloads when an offer reuses a credential ID', async () => {
        const first = { ...credential('First'), id: 'urn:uuid:same-id' };
        const second = {
            ...credential('Second'),
            id: first.id,
            credentialSubject: { changed: true },
        };
        mocks.receive.mockResolvedValue({
            credential: { data: { ...presentation, verifiableCredential: [first, second] } },
            respondWith: mocks.respond,
        });
        render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        await screen.findByText('Saved to your Passport.');
        expect(mocks.save.mock.calls.map(call => call[0])).toEqual([first, second]);
        expect(mocks.save.mock.calls[0][1].id).not.toBe(mocks.save.mock.calls[1][1].id);
        expect(await mocks.respond.mock.calls[0][0]).toEqual({
            dataType: 'VerifiablePresentation',
            data: { ...presentation, verifiableCredential: [first, second] },
        });
    });
    it('makes a failed cancellation terminal without claiming credentials were saved', async () => {
        mocks.respond.mockImplementationOnce(() => {
            throw new Error('consumed');
        });
        render(<CredentialReceivePage />);
        await ready();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        await screen.findByText('Cancellation could not notify issuer. Return to the website.');
        expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save to Passport' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        expect(screen.queryByText('Saved, but could not notify issuer')).toBeNull();
        expect(screen.queryByText('Saved to your Passport.')).toBeNull();
        expect(mocks.respond).toHaveBeenCalledOnce();
        expect(mocks.save).not.toHaveBeenCalled();
    });
    it.each([false, true])(
        'explains retained partial saves when cancelling (notificationFails=%s)',
        async notificationFails => {
            mocks.save
                .mockResolvedValueOnce({ result: true, credentialUri: 'first-uri' })
                .mockRejectedValueOnce(new Error('failed second save'));
            render(<CredentialReceivePage />);
            fireEvent.click(await ready());
            await screen.findByText('Could not finish saving');
            if (notificationFails)
                mocks.respond.mockImplementationOnce(() => {
                    throw new Error('consumed');
                });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            await screen.findByText('Already saved: 1');
            expect(await mocks.respond.mock.calls[0][0]).toBeNull();
            expect(mocks.respond).toHaveBeenCalledOnce();
            expect(mocks.save).toHaveBeenCalledTimes(2);
            expect(screen.queryByRole('button', { name: 'Try Again' })).toBeNull();
        }
    );
    it('does not carry a pending save into a fresh mount or acknowledge the unmounted request', async () => {
        let finishOldSave!: (result: { result: boolean; credentialUri: string }) => void;
        mocks.save.mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    finishOldSave = resolve;
                })
        );
        const oldResponse = vi.fn();
        const newResponse = vi.fn();
        mocks.receive
            .mockResolvedValueOnce({ credential: { data: presentation }, respondWith: oldResponse })
            .mockResolvedValueOnce({
                credential: { data: presentation },
                respondWith: newResponse,
            });
        const oldPage = render(<CredentialReceivePage />);
        fireEvent.click(await ready());
        expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
        oldPage.unmount();
        render(<CredentialReceivePage />);
        const newSave = await ready();
        expect(newSave).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
        await act(async () => finishOldSave({ result: true, credentialUri: 'old-uri' }));
        expect(oldResponse).not.toHaveBeenCalled();
        expect(newResponse).not.toHaveBeenCalled();
        expect(newSave).toBeEnabled();
        fireEvent.click(newSave);
        await screen.findByText('Saved to your Passport.');
        expect(newResponse).toHaveBeenCalledOnce();
        expect(oldResponse).not.toHaveBeenCalled();
    });
});
