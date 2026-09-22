import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({
    wallet: {
        id: { did: vi.fn(() => 'owner') },
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
    appBaseUrl: 'https://tenant.example',
    intersect: undefined as undefined | ((entries: { isIntersecting: boolean }[]) => void),
}));
vi.mock('learn-card-base', () => ({ useWallet: () => ({ initWallet: async () => mocks.wallet }) }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => mocks.wallet,
}));
vi.mock('../../config/bootstrapTenantConfig', () => ({
    getAppBaseUrl: () => mocks.appBaseUrl,
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
vi.mock('./sharePrivacy', () => ({
    enterSharePrivacy: vi.fn(),
}));
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
import { enterSharePrivacy } from './sharePrivacy';
import ShareLinkCreate from './ShareLinkCreate';
import ShareLinkViewer from './ShareLinkViewer';
const credential = { name: 'Community leadership', issuer: { name: 'Learning Collective' } };
beforeEach(() => {
    vi.clearAllMocks();
    mocks.appBaseUrl = 'https://tenant.example';
    mocks.wallet.id.did.mockReturnValue('owner');
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
        input: { id: 'AAAAAAAAAAAAAAAAAAAAAA', title: 'Learning highlights', expiresAt: null },
        key: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        ownerDid: 'owner',
        payload: {
            sharer: { displayName: 'Alex', profileId: 'owner' },
            presentation: { verifiableCredential: [credential] },
            selection: [{ credentialIndex: 0 }],
            endorsements: [],
        },
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
const chooseAndPreview = async () => {
    render(<ShareLinkCreate onDismiss={() => {}} />);
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Learning highlights' } });
    fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
    await screen.findByTestId('share-link-preview');
};
const chooseAndCreate = async () => {
    await chooseAndPreview();
    fireEvent.click(screen.getByRole('button', { name: 'Create private link' }));
};
describe('create screen', () => {
    it('keeps Continue disabled without a selection', async () => {
        render(<ShareLinkCreate onDismiss={() => {}} />);
        await screen.findByRole('checkbox');
        expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });
    it('masks the creator without changing session privacy on open or close', async () => {
        const view = render(<ShareLinkCreate onDismiss={() => {}} />);
        await screen.findByRole('checkbox');
        expect(view.container.querySelector('.sentry-block.ph-no-capture')).toBeTruthy();
        view.unmount();
        expect(enterSharePrivacy).not.toHaveBeenCalled();
    });
    it.each([
        ['7 days', 7],
        ['30 days', 30],
        ['1 year', 365],
        ['Never', null],
    ])('prepares the selected %s expiry before publishing', async (label, days) => {
        render(<ShareLinkCreate onDismiss={() => {}} />);
        fireEvent.click(await screen.findByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Highlights' } });
        fireEvent.click(screen.getByRole('radio', { name: String(label) }));
        const before = Date.now();
        fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
        await screen.findByTestId('share-link-preview');
        const expiry = mocks.prepare.mock.calls[0][4];
        if (days === null) expect(expiry).toBeNull();
        else {
            expect(Date.parse(expiry)).toBeGreaterThanOrEqual(before + Number(days) * 86400000);
            expect(Date.parse(expiry)).toBeLessThanOrEqual(Date.now() + Number(days) * 86400000);
        }
        expect(mocks.wallet.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('renders a QR encoding the entire completed link, including its key', async () => {
        await chooseAndCreate();
        const qr = await screen.findByRole('img', { name: 'Private link QR code' });
        const link = screen.getByLabelText('Private link') as HTMLInputElement;
        expect(link.value).toBe(
            'https://tenant.example/s/AAAAAAAAAAAAAAAAAAAAAA#AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        );
        const expected = render(
            <QRCodeSVG value={link.value} size={224} level="M" includeMargin />
        );
        expect(qr.querySelectorAll('path')[1].getAttribute('d')).toBe(
            expected.container.querySelectorAll('path')[1].getAttribute('d')
        );
    });
    it('reuses encrypted input after a lost response', async () => {
        mocks.wallet.invoke.createShareLink.mockRejectedValueOnce(new Error('lost response'));
        await chooseAndCreate();
        await screen.findByRole('alert');
        expect(screen.getByRole('button', { name: /Edit/ })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Create private link' }));
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
            status: 'found',
            share: { status: 'active', expiresAt: null },
        });
        await chooseAndCreate();
        await screen.findByText(/Your link is still being prepared/);
        expect(screen.getByRole('button', { name: /Edit/ })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull();
        expect(screen.queryByRole('img', { name: 'Private link QR code' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        await screen.findByText('Your link is ready');
        expect(mocks.wallet.invoke.retryShareLinkOperation).toHaveBeenCalledWith({
            id: 'share',
            operationId: 'operation',
        });
        expect(mocks.wallet.invoke.createShareLink).toHaveBeenCalledTimes(1);
    });
    it('recovers a not_found retry by replaying the original prepared create input', async () => {
        mocks.wallet.invoke.createShareLink
            .mockResolvedValueOnce({ status: 'pending', id: 'share', operationId: 'operation' })
            .mockResolvedValueOnce({
                status: 'completed',
                share: { status: 'active', expiresAt: null },
            });
        mocks.wallet.invoke.retryShareLinkOperation.mockResolvedValue({
            status: 'not_found',
            id: 'share',
        });
        await chooseAndCreate();
        await screen.findByText(/Your link is still being prepared/);
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        await screen.findByText('Your link is ready');
        expect(mocks.wallet.invoke.createShareLink).toHaveBeenCalledTimes(2);
        const calls = mocks.wallet.invoke.createShareLink.mock.calls;
        expect(calls[0][0]).toBe(calls[1][0]);
    });
    it('surfaces a paused pending operation as a terminal error after not_found', async () => {
        mocks.wallet.invoke.createShareLink
            .mockResolvedValueOnce({ status: 'pending', id: 'share', operationId: 'operation' })
            .mockRejectedValueOnce(new Error('reservation lost'));
        mocks.wallet.invoke.retryShareLinkOperation.mockResolvedValue({
            status: 'not_found',
            id: 'share',
        });
        await chooseAndCreate();
        await screen.findByText(/Your link is still being prepared/);
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        await screen.findByRole('alert');
        expect(screen.queryByText('Your link is ready')).toBeNull();
    });
    it('does not publish when the derived identity changed', async () => {
        await chooseAndPreview();
        mocks.wallet.id.did.mockReturnValue('other');
        fireEvent.click(screen.getByRole('button', { name: 'Create private link' }));
        await screen.findByRole('alert');
        expect(mocks.wallet.invoke.createShareLink).toHaveBeenCalledTimes(0);
    });
    it('refuses a non-https base before creating any server state', async () => {
        mocks.appBaseUrl = 'http://localhost:3000';
        render(<ShareLinkCreate onDismiss={() => {}} />);
        fireEvent.click(await screen.findByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Learning highlights' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
        await screen.findByRole('alert');
        expect(screen.queryByTestId('share-link-preview')).toBeNull();
        expect(mocks.wallet.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('shows the actual prepared payload in the recipient preview', async () => {
        render(<ShareLinkCreate onDismiss={() => {}} />);
        fireEvent.click(await screen.findByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Learning highlights' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
        await screen.findByTestId('share-link-preview');
        expect(screen.getByText('Community leadership')).toBeTruthy();
        expect(screen.getByText('Shared by Alex')).toBeTruthy();
        expect(screen.queryByText('Signature verified')).toBeNull();
        expect(mocks.wallet.invoke.createShareLink).not.toHaveBeenCalled();
    });
    it('regenerates the draft after returning to edit before publishing', async () => {
        render(<ShareLinkCreate onDismiss={() => {}} />);
        fireEvent.click(await screen.findByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'First' } });
        fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
        await screen.findByTestId('share-link-preview');
        fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Second' } });
        fireEvent.click(screen.getByRole('button', { name: /Preview/ }));
        await screen.findByTestId('share-link-preview');
        expect(mocks.prepare).toHaveBeenCalledTimes(2);
        expect(mocks.wallet.invoke.createShareLink).not.toHaveBeenCalled();
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
