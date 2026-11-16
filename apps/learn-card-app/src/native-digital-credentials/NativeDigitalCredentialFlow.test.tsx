import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import NativeDigitalCredentialFlow from './NativeDigitalCredentialFlow';

const mocks = vi.hoisted(() => ({
    loggedIn: false,
    wallet: null as object | null,
    current: true,
    revision: 0,
    pending: vi.fn(),
    initialize: vi.fn(),
    inventory: vi.fn(),
    prepare: vi.fn(),
    approve: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
    redirect: vi.fn(),
    clearRedirect: vi.fn(),
    replace: vi.fn(),
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: mocks.replace }) }));
vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => mocks.loggedIn,
    useWallet: () => ({ initWallet: mocks.initialize }),
    redirectStore: {
        set: { requestRedirect: mocks.redirect, clearRequestRedirect: mocks.clearRedirect },
    },
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    walletStore: { use: { wallet: () => mocks.wallet } },
}));
vi.mock('../helpers/verifier-history/account', () => ({
    captureHistoryAccount: () => () => mocks.current,
    isHistoryAccountEligible: () => true,
    useHistoryAccountRevision: () => mocks.revision,
}));
vi.mock('../pages/login/LoginPage', () => ({ default: () => <div>Sign in first</div> }));
vi.mock('../pages/oid4vp/components/RequestConsent', () => ({
    default: ({ onApprove }: { onApprove: (picks: unknown) => void }) => (
        <button onClick={() => onApprove({ row: {}, disclose: {} })}>Approve request</button>
    ),
}));
vi.mock('./NativeRequestState', () => ({
    NativeRequestState: ({
        unavailable,
        onCancel,
    }: {
        unavailable?: boolean;
        onCancel?: () => void;
    }) => (
        <div>
            {unavailable ? 'Request unavailable' : 'Loading request'}
            <button onClick={onCancel}>Cancel request</button>
        </div>
    ),
}));
vi.mock('./plugin', () => ({
    nativeDigitalCredentials: {
        getPendingRequest: mocks.pending,
        complete: mocks.complete,
        cancel: mocks.cancel,
    },
}));
vi.mock('./runtime', () => ({ readNativeInventory: mocks.inventory }));
vi.mock('./presentation', () => ({ prepareAccountPresentation: mocks.prepare }));
vi.mock('../helpers/startupDiagnostics', () => ({ markStartupPhase: vi.fn() }));

const request = {
    requestId: 'original-request',
    selectedEntryId: 'original-entry',
    origin: 'origin',
};
beforeEach(() => {
    vi.resetAllMocks();
    mocks.loggedIn = false;
    mocks.wallet = null;
    mocks.current = true;
    mocks.revision = 0;
    mocks.pending.mockResolvedValue({ pending: request, isProvider: true });
    mocks.initialize.mockResolvedValue({});
    mocks.inventory.mockResolvedValue({ owner: 'original-owner', entries: [] });
    mocks.approve.mockResolvedValue('signed-response');
    mocks.prepare.mockResolvedValue({
        request: {},
        selection: {},
        policy: {},
        approve: mocks.approve,
    });
});
afterEach(cleanup);

it('waits for sign-in and completes the original request only after consent', async () => {
    const view = render(<NativeDigitalCredentialFlow />);
    await waitFor(() =>
        expect(mocks.redirect).toHaveBeenCalledWith(
            request.requestId,
            '/native-digital-credentials'
        )
    );
    expect(screen.getByText('Sign in first')).toBeInTheDocument();
    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
    mocks.loggedIn = true;
    mocks.wallet = {};
    mocks.revision++;
    view.rerender(<NativeDigitalCredentialFlow />);
    const approve = await screen.findByRole('button', { name: 'Approve request' });
    expect(mocks.clearRedirect).not.toHaveBeenCalled();
    fireEvent.click(approve);
    await waitFor(() =>
        expect(mocks.complete).toHaveBeenCalledWith({
            requestId: request.requestId,
            responseJson: 'signed-response',
        })
    );
    expect(mocks.prepare.mock.calls[0][2]).toBe(request);
});

it('returns no credential if the signed-in account cannot access the original selection', async () => {
    const view = render(<NativeDigitalCredentialFlow />);
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalled());
    mocks.prepare.mockRejectedValue(new Error('Account changed'));
    mocks.loggedIn = true;
    mocks.wallet = {};
    mocks.revision++;
    view.rerender(<NativeDigitalCredentialFlow />);
    await screen.findByText('Request unavailable');
    expect(mocks.complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel request' }));
    await waitFor(() =>
        expect(mocks.cancel).toHaveBeenCalledWith({ requestId: request.requestId })
    );
});

it('does not send a response if the request is canceled while sign-in is pending', async () => {
    const view = render(<NativeDigitalCredentialFlow />);
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalled());
    mocks.pending.mockResolvedValue({ isProvider: true });
    mocks.loggedIn = true;
    mocks.wallet = {};
    mocks.revision++;
    view.rerender(<NativeDigitalCredentialFlow />);
    await screen.findByText('Request unavailable');
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
});

it('rejects an approval whose account changes while signing is in flight', async () => {
    mocks.loggedIn = true;
    mocks.wallet = {};
    let finish!: (value: string) => void;
    mocks.approve.mockReturnValue(
        new Promise(resolve => {
            finish = resolve;
        })
    );
    render(<NativeDigitalCredentialFlow />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve request' }));
    mocks.current = false;
    await act(async () => finish('late-signed-response'));
    await screen.findByText('Request unavailable');
    expect(mocks.complete).not.toHaveBeenCalled();
});

it('asks for sign-in when only the cached profile exists, then resumes once its wallet is ready', async () => {
    mocks.loggedIn = true;
    const view = render(<NativeDigitalCredentialFlow />);
    await waitFor(() => expect(mocks.redirect).toHaveBeenCalled());
    expect(screen.getByText('Sign in first')).toBeInTheDocument();
    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(mocks.prepare).not.toHaveBeenCalled();
    mocks.wallet = {};
    view.rerender(<NativeDigitalCredentialFlow />);
    await screen.findByRole('button', { name: 'Approve request' });
    expect(mocks.prepare.mock.calls[0][2]).toBe(request);
    expect(mocks.complete).not.toHaveBeenCalled();
});
