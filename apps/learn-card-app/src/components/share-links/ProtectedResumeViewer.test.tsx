import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    resolve: vi.fn(),
    content: vi.fn(),
    chunk: vi.fn(),
    decrypt: vi.fn(),
    privacy: vi.fn(),
    decode: vi.fn(),
    downloaded: vi.fn(),
    collectionPdf: vi.fn(),
    manifest: undefined as unknown,
    history: { push: vi.fn(), replace: vi.fn() },
}));
vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => false,
    useWallet: () => ({ initWallet: vi.fn() }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: {},
    redirectStore: { set: { authRedirect: vi.fn() } },
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: async () => ({
        invoke: {
            resolveShareLink: mocks.resolve,
            getShareLinkContent: mocks.content,
            getShareLinkAttachmentChunk: mocks.chunk,
        },
    }),
}));
vi.mock('learn-card-base/helpers/share-links', () => ({
    buildShareLinkUrl: () => 'https://example.test/share/id#PRIVATE',
    decryptSharePayload: mocks.decrypt,
    validateShareManifest: () => ({ ok: true, manifest: mocks.manifest }),
}));
vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: 'id' }),
    useLocation: () => ({ hash: '#PRIVATE', pathname: '/share/id' }),
    useHistory: () => mocks.history,
}));
vi.mock('@ionic/react', () => ({
    IonIcon: () => null,
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
    IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock('./ShareCredentialsIllustration', () => ({ ShareCredentialsIllustration: () => null }));
vi.mock('./sharePrivacy', () => ({ enterSharePrivacy: mocks.privacy }));
vi.mock('./shareLinkFlow', () => ({
    shareWallet: (wallet: unknown) => wallet,
    readShareAddress: () => ({ key: 'PRIVATE' }),
    createVerificationBudget: () => ({ cancel: vi.fn(), expired: () => false }),
    verifySharedPresentation: async () => 'verified',
    verifyCredentialTree: async () => 'verified',
    parseSavedShareLinkMetadata: vi.fn(),
    SAVED_SHARE_METADATA_TYPE: 'saved',
}));
vi.mock('./ShareLinkPreview', () => ({
    ProofBadge: () => <span>Verified</span>,
    ShareLinkPreview: ({
        payload,
        summaryExtra,
        renderCredential,
    }: {
        payload: { presentation: { verifiableCredential: unknown[] } };
        summaryExtra: React.ReactNode;
        renderCredential: (credential: unknown, index: number) => React.ReactNode;
    }) => (
        <div>
            {summaryExtra}
            {payload.presentation.verifiableCredential.map((credential, index) => (
                <React.Fragment key={index}>
                    {renderCredential(credential, index) ?? <p>Generic collection member</p>}
                </React.Fragment>
            ))}
        </div>
    ),
}));
vi.mock('../../helpers/resume-publishing/protectedPdf', () => ({
    hasProtectedResumePdf: (credential: { protected?: boolean }) => credential?.protected === true,
    getProtectedResumePdf: () => ({ byteLength: 3315 }),
    loadProtectedResumePdf: mocks.decode,
    downloadProtectedResumePdf: async (
        _credential: unknown,
        _title: string,
        guard: () => Promise<boolean>,
        fetchChunk: unknown
    ) => {
        await mocks.decode(_credential, fetchChunk);
        if (!(await guard())) throw new Error('Unavailable');
        mocks.downloaded();
    },
}));
vi.mock('./sharePdf', () => ({ downloadSharePdf: mocks.collectionPdf }));
vi.mock('./shareDownload', () => ({ downloadSharePresentation: vi.fn() }));
import ShareLinkViewer from './ShareLinkViewer';
const metadata = (expiresAt: string | null = null) => ({
    state: 'active',
    contentVersion: 1,
    selectedCount: 1,
    title: 'Resume',
    sharer: { displayName: 'Alex' },
    expiresAt,
});
const setManifest = (credential: unknown = { protected: true }) => {
    mocks.manifest = {
        shareId: 'id',
        contentVersion: 1,
        sharer: { profileId: 'owner' },
        presentation: { verifiableCredential: [credential] },
        selection: [{ credentialIndex: 0 }],
        endorsements: [],
    };
};
beforeEach(() => {
    vi.clearAllMocks();
    setManifest();
    mocks.resolve.mockResolvedValue(metadata());
    mocks.content.mockResolvedValue({
        id: 'id',
        contentVersion: 1,
        envelope: {},
        receipt: 'receipt',
    });
    mocks.decrypt.mockResolvedValue({});
    mocks.decode.mockResolvedValue(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            observe() {}
            disconnect() {}
        }
    );
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    URL.createObjectURL = vi.fn(() => 'blob:protected-preview');
    URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});
const open = async () => {
    render(<ShareLinkViewer />);
    await screen.findByText('Download this resume to open the PDF on your device.');
};
describe('protected resume recipient lifecycle', () => {
    it('enters private mode before decrypting and does not fetch PDF bytes before a gesture', async () => {
        await open();
        expect(mocks.privacy.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.decrypt.mock.invocationCallOrder[0]
        );
        expect(mocks.decode).not.toHaveBeenCalled();
        expect(document.querySelector('iframe')).toBeNull();
        expect(screen.queryByText('Generic collection member')).not.toBeInTheDocument();
        expect(document.body.textContent).not.toContain('#PRIVATE');
        expect(screen.getByText('PDF · 4 KB')).toBeInTheDocument();
        expect(
            screen.getAllByText(/Previously saved copies and older links cannot be taken back/)
                .length
        ).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole('button', { name: 'Download to view' }));
        await waitFor(() => expect(mocks.downloaded).toHaveBeenCalledOnce());
        expect(mocks.decode).toHaveBeenCalledWith({ protected: true }, expect.any(Function));
        expect(mocks.resolve).toHaveBeenCalledTimes(2);
        expect(mocks.content).toHaveBeenCalledOnce();
        expect(mocks.collectionPdf).not.toHaveBeenCalled();
    });
    it('shows retry guidance for a rate-limited PDF download without exporting bytes', async () => {
        await open();
        mocks.decode.mockRejectedValueOnce({ data: { code: 'TOO_MANY_REQUESTS' } });
        fireEvent.click(screen.getByRole('button', { name: 'Download resume PDF' }));
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(/try|wait/i);
        expect(mocks.downloaded).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Download resume PDF' })).toBeEnabled();
    });
    it('denies a cached download after stop and clears the PDF card', async () => {
        await open();
        mocks.resolve.mockResolvedValue({ state: 'stopped' });
        fireEvent.click(screen.getByRole('button', { name: 'Download resume PDF' }));
        await waitFor(() =>
            expect(
                screen.queryByText('Download this resume to open the PDF on your device.')
            ).not.toBeInTheDocument()
        );
        expect(mocks.downloaded).not.toHaveBeenCalled();
        expect(mocks.content).toHaveBeenCalledOnce();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
    it('denies a cached PDF when the content snapshot advances', async () => {
        await open();
        mocks.resolve.mockResolvedValue({ ...metadata(), contentVersion: 2 });
        fireEvent.click(screen.getByRole('button', { name: 'Download resume PDF' }));
        await screen.findByText('This resume has changed');
        expect(mocks.downloaded).not.toHaveBeenCalled();
    });
    it('clears the PDF card at expiry without a new request', async () => {
        const now = Date.now();
        mocks.resolve.mockResolvedValue(metadata(new Date(now + 1000).toISOString()));
        await open();
        vi.useFakeTimers();
        vi.setSystemTime(now + 1001);
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(
            screen.queryByText('Download this resume to open the PDF on your device.')
        ).not.toBeInTheDocument();
        expect(mocks.resolve).toHaveBeenCalledOnce();
        expect(mocks.decode).not.toHaveBeenCalled();
    });
    it('rechecks visibility and drops changed plaintext', async () => {
        await open();
        mocks.resolve.mockResolvedValue({ ...metadata(), contentVersion: 2 });
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await screen.findByText('This resume has changed');
        expect(mocks.downloaded).not.toHaveBeenCalled();
        expect(mocks.decode).not.toHaveBeenCalled();
    });
    it('rejects an in-flight download when its card is invalidated', async () => {
        let resolve!: (blob: Blob) => void;
        mocks.decode.mockReturnValue(
            new Promise<Blob>(done => {
                resolve = done;
            })
        );
        await open();
        fireEvent.click(screen.getByRole('button', { name: 'Download resume PDF' }));
        await waitFor(() => expect(mocks.decode).toHaveBeenCalled());
        mocks.resolve.mockResolvedValue({ state: 'stopped' });
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await act(async () => {
            resolve(new Blob(['PDF']));
        });
        expect(mocks.downloaded).not.toHaveBeenCalled();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
    it('keeps generic collection PDF export for other credentials', async () => {
        setManifest({ name: 'Course certificate' });
        render(<ShareLinkViewer />);
        await screen.findByText('Generic collection member');
        fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
        await waitFor(() => expect(mocks.collectionPdf).toHaveBeenCalledOnce());
        expect(mocks.decode).not.toHaveBeenCalled();
        expect(mocks.downloaded).not.toHaveBeenCalled();
    });
    it('stays within the passcode budget for one full 16-chunk download', async () => {
        let guesses = 0;
        const count = () => {
            guesses++;
            if (guesses > 6) throw new Error('Rate limited');
        };
        mocks.resolve.mockImplementation(async (_id: string, passcode?: string) => {
            if (passcode !== '1234') return { state: 'passcode_required' };
            count();
            return metadata();
        });
        mocks.content.mockImplementation(async (_id: string, passcode?: string) => {
            expect(passcode).toBe('1234');
            count();
            return { id: 'id', contentVersion: 1, envelope: {}, receipt: 'receipt' };
        });
        mocks.chunk.mockImplementation(
            async (request: {
                id: string;
                contentVersion: number;
                attachmentId: string;
                chunkIndex: number;
                passcode?: string;
                accessToken?: string;
            }) => {
                if (request.accessToken !== 'grant') {
                    expect(request.passcode).toBe('1234');
                    count();
                } else expect(request.passcode).toBeUndefined();
                return { ...request, envelope: {}, accessToken: 'grant' };
            }
        );
        mocks.decode.mockImplementation(
            async (
                _vc: unknown,
                reader: (request: unknown) => Promise<{ accessToken: string }>
            ) => {
                let grant: string | undefined;
                for (let index = 0; index < 16; index++) {
                    const response = await reader({
                        id: 'id',
                        contentVersion: 1,
                        attachmentId: 'attachment',
                        chunkIndex: index,
                        ...(grant ? { accessToken: grant } : {}),
                    });
                    grant = response.accessToken;
                }
                return new Blob(['%PDF-1.7']);
            }
        );
        render(<ShareLinkViewer />);
        fireEvent.change(await screen.findByLabelText('Passcode'), { target: { value: '1234' } });
        fireEvent.click(screen.getByRole('button', { name: 'Open credentials' }));
        await screen.findByText('Download this resume to open the PDF on your device.');
        fireEvent.click(screen.getByRole('button', { name: 'Download to view' }));
        await waitFor(() => expect(mocks.downloaded).toHaveBeenCalledOnce());
        expect(mocks.chunk).toHaveBeenCalledTimes(16);
        expect(guesses).toBe(4);
    });
});
