import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({
    wallet: {
        id: { did: () => 'owner' },
        index: { LearnCloud: { getPage: vi.fn() } },
        read: { get: vi.fn() },
        invoke: {
            createShareLink: vi.fn(),
            retryShareLinkOperation: vi.fn(),
            resolveShareLink: vi.fn(),
            getShareLinkContent: vi.fn(),
            acknowledgeShareLinkView: vi.fn(),
        },
    },
    prepare: vi.fn(),
    decrypt: vi.fn(),
    validate: vi.fn(),
    intersect: undefined as undefined | ((entries: { isIntersecting: boolean }[]) => void),
}));
vi.mock('learn-card-base', () => ({ useWallet: () => ({ initWallet: async () => mocks.wallet }) }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => mocks.wallet,
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => 'https://tenant.example',
}));
vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: 'AAAAAAAAAAAAAAAAAAAAAA' }),
    useLocation: () => ({ hash: window.location.hash }),
}));
vi.mock('@ionic/react', () => ({
    IonIcon: () => null,
    IonHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
    IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./sharePrivacy', () => ({ enterSharePrivacy: vi.fn() }));
vi.mock('learn-card-base/helpers/share-links', () => ({
    isShareLinkError: () => false,
    decryptSharePayload: (...args: unknown[]) => mocks.decrypt(...args),
    validateShareManifest: (...args: unknown[]) => mocks.validate(...args),
    buildShareLinkUrl: (host: string, id: string, key: string) => `https://${host}/s/${id}#${key}`,
}));
vi.mock('./shareLinkFlow', async importOriginal => ({
    ...(await importOriginal<object>()),
    prepareShare: (...args: unknown[]) => mocks.prepare(...args),
    verifySharedPresentation: async () => 'verified',
    verifyCredentialTree: async () => 'verified',
}));
import ShareLinkCreate from './ShareLinkCreate';
import ShareLinkViewer from './ShareLinkViewer';
const credential = { name: 'Community leadership', issuer: { name: 'Learning Collective' } };
beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(
        null,
        '',
        '/s/AAAAAAAAAAAAAAAAAAAAAA#AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    mocks.wallet.index.LearnCloud.getPage.mockResolvedValue({
        records: [{ uri: 'private:one' }],
        hasMore: false,
    });
    mocks.wallet.read.get.mockResolvedValue(credential);
    mocks.prepare.mockResolvedValue({
        input: { id: 'AAAAAAAAAAAAAAAAAAAAAA' },
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        ownerDid: 'owner',
    });
    mocks.wallet.invoke.createShareLink.mockResolvedValue({
        status: 'completed',
        share: { status: 'active', expiresAt: null },
    });
    mocks.wallet.invoke.resolveShareLink.mockResolvedValue({
        state: 'active',
        contentVersion: 1,
        selectedCount: 1,
        title: 'Learning highlights',
        sharer: { displayName: 'Alex' },
        expiresAt: null,
    });
    mocks.wallet.invoke.getShareLinkContent.mockResolvedValue({
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        contentVersion: 1,
        receipt: 'same-receipt',
        envelope: {},
    });
    mocks.wallet.invoke.acknowledgeShareLinkView.mockResolvedValue({ ok: true });
    mocks.decrypt.mockResolvedValue({});
    mocks.validate.mockReturnValue({
        ok: true,
        manifest: {
            presentation: { verifiableCredential: [credential] },
            selection: [{ credentialIndex: 0 }],
            endorsements: [],
        },
    });
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(callback: typeof mocks.intersect) {
                mocks.intersect = callback;
            }
            observe() {}
            disconnect() {}
        }
    );
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
        callback();
        return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});
const chooseAndCreate = async () => {
    render(<ShareLinkCreate onDismiss={() => {}} />);
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Learning highlights' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create private link' }));
};
describe('create screen', () => {
    it('keeps Continue disabled without a selection', async () => {
        render(<ShareLinkCreate onDismiss={() => {}} />);
        await screen.findByRole('checkbox');
        expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });
    it('reuses encrypted input after a lost response', async () => {
        mocks.wallet.invoke.createShareLink.mockRejectedValueOnce(new Error('lost response'));
        await chooseAndCreate();
        fireEvent.click(await screen.findByRole('button', { name: 'Check again' }));
        await screen.findByText('Your link is ready');
        expect(mocks.prepare).toHaveBeenCalledTimes(1);
        const calls = mocks.wallet.invoke.createShareLink.mock.calls;
        expect(calls[0][0]).toBe(calls[1][0]);
    });
    it('does not expose a pending link and retries its operation', async () => {
        mocks.wallet.invoke.createShareLink.mockResolvedValueOnce({
            status: 'pending',
            id: 'share',
            operationId: 'operation',
        });
        mocks.wallet.invoke.retryShareLinkOperation.mockResolvedValue({
            status: 'completed',
            share: { status: 'active', expiresAt: null },
        });
        await chooseAndCreate();
        await screen.findByText(/Your link is still being prepared/);
        expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        await screen.findByText('Your link is ready');
        expect(mocks.wallet.invoke.retryShareLinkOperation).toHaveBeenCalledWith({
            id: 'share',
            operationId: 'operation',
        });
    });
});
describe('recipient screen', () => {
    it('does not request content without a key', async () => {
        window.history.replaceState(null, '', '/s/AAAAAAAAAAAAAAAAAAAAAA');
        render(<ShareLinkViewer />);
        await screen.findByText('This link is incomplete');
        expect(mocks.wallet.invoke.resolveShareLink).not.toHaveBeenCalled();
    });
    it.each(['expired', 'stopped', 'not_found'])(
        'does not decrypt or acknowledge %s',
        async state => {
            mocks.wallet.invoke.resolveShareLink.mockResolvedValueOnce({ state });
            render(<ShareLinkViewer />);
            await screen.findByText('Ask the sender for a new link.');
            expect(mocks.decrypt).not.toHaveBeenCalled();
            expect(mocks.wallet.invoke.acknowledgeShareLinkView).not.toHaveBeenCalled();
        }
    );
    it('does not acknowledge wrong-key or corrupt content', async () => {
        mocks.decrypt.mockRejectedValueOnce(new Error('wrong key'));
        render(<ShareLinkViewer />);
        await screen.findByText('We couldn’t unlock these credentials');
        expect(mocks.wallet.invoke.acknowledgeShareLinkView).not.toHaveBeenCalled();
    });
    it('does not acknowledge an invalid manifest', async () => {
        mocks.validate.mockReturnValueOnce({ ok: false });
        render(<ShareLinkViewer />);
        await screen.findByText('We couldn’t unlock these credentials');
        expect(mocks.wallet.invoke.acknowledgeShareLinkView).not.toHaveBeenCalled();
    });
    it('acknowledges only once after visible render', async () => {
        const view = render(<ShareLinkViewer />);
        await screen.findByText('Community leadership');
        expect(mocks.wallet.invoke.acknowledgeShareLinkView).not.toHaveBeenCalled();
        mocks.intersect?.([{ isIntersecting: true }]);
        await waitFor(() =>
            expect(mocks.wallet.invoke.acknowledgeShareLinkView).toHaveBeenCalledWith(
                'same-receipt'
            )
        );
        view.rerender(<ShareLinkViewer />);
        mocks.intersect?.([{ isIntersecting: true }]);
        expect(mocks.wallet.invoke.acknowledgeShareLinkView).toHaveBeenCalledTimes(1);
    });
    it('does not count a background tab until its content becomes visible', async () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
        render(<ShareLinkViewer />);
        await screen.findByText('Community leadership');
        mocks.intersect?.([{ isIntersecting: true }]);
        expect(mocks.wallet.invoke.acknowledgeShareLinkView).not.toHaveBeenCalled();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        fireEvent(document, new Event('visibilitychange'));
        await waitFor(() =>
            expect(mocks.wallet.invoke.acknowledgeShareLinkView).toHaveBeenCalledTimes(1)
        );
    });
});
