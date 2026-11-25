import React, { forwardRef, useImperativeHandle } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    discard: vi.fn(),
    artifact: vi.fn(),
    publish: vi.fn(),
    reserve: vi.fn(),
    recover: vi.fn(),
    download: vi.fn(),
    legacy: vi.fn(),
    toast: vi.fn(),
    modal: vi.fn(),
    privacy: vi.fn(),
    qr: vi.fn(),
    revision: 0,
    state: {
        personalDetails: { name: 'Visible learner' },
        hiddenPersonalDetails: {},
        hiddenSections: {},
        currentJobCredentialUri: null,
        credentialStartDates: {},
        credentialEndDates: {},
        documentSetup: { showQRCode: true, fileName: 'resume.pdf' },
        credentialEntries: {},
        sectionOrder: [],
        activeResume: null,
    } as Record<string, unknown>,
}));
vi.mock('learn-card-base', () => ({
    useDeviceTypeByWidth: () => ({ isMobile: false }),
    useModal: () => ({ newModal: mocks.modal, closeModal: vi.fn() }),
    ModalTypes: {},
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    CredentialCategoryEnum: { workHistory: 'Work History' },
    useGetResolvedCredential: () => ({ data: null }),
    useWallet: () => ({ initWallet: vi.fn() }),
    useShareBoostMutation: mocks.legacy,
}));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('./useResumePreselection', () => ({ useResumePreselection: vi.fn() }));
vi.mock('./resume-builder-history.helpers', () => ({ buildResumeHydrationState: vi.fn() }));
vi.mock('../../stores/resumeBuilderStore', () => ({
    getResumeBuilderSnapshotKey: (snapshot: unknown) => JSON.stringify(snapshot),
    resumeBuilderStore: {
        useTracked: new Proxy({}, { get: (_target, key: string) => () => mocks.state[key] }),
        get: new Proxy({}, { get: (_target, key: string) => () => mocks.state[key] }),
        set: { hydrateStore: vi.fn(), resetStore: vi.fn() },
    },
}));
vi.mock('../../hooks/useIssueTcpResume', () => ({
    useIssueTcpResume: () => ({
        publishTcpResume: mocks.publish,
        getResumeShareLink: mocks.recover,
        prepareResumePublicationLink: mocks.reserve,
        discardPendingResumePublication: mocks.discard,
    }),
}));
vi.mock('../../helpers/resume-publishing/account', () => ({
    useResumeAccountRevision: () => mocks.revision,
    captureResumeAccount: () => {
        const value = mocks.revision;
        return () => value === mocks.revision;
    },
}));
vi.mock('../../helpers/resume-publishing/protectedPdf', () => ({
    downloadProtectedResumePdf: mocks.download,
}));
vi.mock('../share-links/protectedResumeReader', () => ({
    readProtectedResumeChunk: vi.fn(),
    isProtectedResumeCurrent: vi.fn(),
}));
vi.mock('../share-links/sharePrivacy', () => ({ enterSharePrivacy: mocks.privacy }));
vi.mock('./ResumeShareLink', () => ({ default: () => null }));
vi.mock('./ResumeIframePreview', () => ({ default: () => null }));
vi.mock('./ResumeBuilderLoader', () => ({ default: () => null }));
vi.mock('./resume-config-panel/ResumeConfigPanelFAB', () => ({ default: () => null }));
vi.mock('./resume-config-panel/ResumeConfigOverlayPanel', () => ({ default: () => null }));
vi.mock('./resume-config-panel/ResumeConfigDesktopSidePanel', () => ({ default: () => null }));
vi.mock('./ResumeBuilderHeader', () => ({
    default: ({ onPublish, onDownload }: { onPublish: () => void; onDownload: () => void }) => (
        <>
            <button onClick={onPublish}>Publish resume</button>
            <button onClick={onDownload}>Download resume</button>
        </>
    ),
}));
vi.mock('./resume-preview/ResumePreview', () => ({
    default: forwardRef(function ResumePreviewMock({ qrCodeValue }: { qrCodeValue: string }, ref) {
        mocks.qr(qrCodeValue);
        useImperativeHandle(ref, () => ({
            createPDFArtifact: mocks.artifact,
            generatePDF: vi.fn(),
        }));
        return <div>Resume preview</div>;
    }),
}));
import ResumeBuilder from './ResumeBuilder';
const link = 'https://example.test/share/SAME#PRIVATE';
beforeEach(() => {
    vi.clearAllMocks();
    mocks.revision = 0;
    mocks.state.personalDetails = { name: 'Visible learner' };
    mocks.artifact.mockResolvedValue({
        blob: new Blob(['%PDF-1.7']),
        fileName: 'resume.pdf',
        hash: 'HASH',
    });
    mocks.reserve.mockResolvedValue(link);
    mocks.publish.mockResolvedValue({
        lerVc: { name: 'Resume' },
        lerUri: 'encrypted:resume',
        shareLink: link,
    });
    mocks.download.mockResolvedValue(undefined);
    mocks.discard.mockResolvedValue(true);
    vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
        callback();
        return 1;
    });
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});
describe('managed Resume Builder publication', () => {
    it('reserves the same managed QR before generating the PDF and publishes once', async () => {
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        await waitFor(() => expect(mocks.publish).toHaveBeenCalledOnce());
        expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.artifact.mock.invocationCallOrder[0]
        );
        expect(mocks.qr).toHaveBeenCalledWith(link);
        expect(mocks.privacy.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.artifact.mock.invocationCallOrder[0]
        );
        expect(mocks.legacy).not.toHaveBeenCalled();
        expect(mocks.modal).toHaveBeenCalledOnce();
    });
    it('downloads the committed protected PDF when a QR publication is required', async () => {
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Download resume' }));
        await waitFor(() =>
            expect(mocks.download).toHaveBeenCalledWith(
                { name: 'Resume' },
                'resume.pdf',
                expect.any(Function),
                expect.any(Function)
            )
        );
        expect(mocks.publish).toHaveBeenCalledOnce();
        expect(mocks.reserve).toHaveBeenCalledOnce();
    });
    it('does not publish a PDF generated across an account switch', async () => {
        let resolve!: (value: unknown) => void;
        mocks.artifact.mockReturnValue(
            new Promise(done => {
                resolve = done;
            })
        );
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        await waitFor(() => expect(mocks.artifact).toHaveBeenCalled());
        mocks.revision++;
        resolve({ blob: new Blob(['PDF']), fileName: 'resume.pdf', hash: 'HASH' });
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith(
                'Your account changed. Please try again.',
                expect.anything()
            )
        );
        expect(mocks.publish).not.toHaveBeenCalled();
    });
    it('does not publish when edited fields changed during PDF generation', async () => {
        let resolve!: (value: unknown) => void;
        mocks.artifact.mockReturnValue(
            new Promise(done => {
                resolve = done;
            })
        );
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        await waitFor(() => expect(mocks.artifact).toHaveBeenCalled());
        mocks.state.personalDetails = { name: 'Changed learner' };
        resolve({ blob: new Blob(['PDF']), fileName: 'resume.pdf', hash: 'HASH' });
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith(
                'Your resume changed while preparing it. Please try again.',
                expect.anything()
            )
        );
        expect(mocks.publish).not.toHaveBeenCalled();
    });
    it('offers safe cleanup only for definitely uncommitted interrupted setup', async () => {
        mocks.publish.mockRejectedValue({
            code: 'failed',
            canDiscard: true,
            message: 'PRIVATE CAPABILITY',
        });
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Clear interrupted setup' }));
        await waitFor(() => expect(mocks.discard).toHaveBeenCalledOnce());
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: 'Clear interrupted setup' })
            ).not.toBeInTheDocument()
        );
        expect(mocks.toast).toHaveBeenCalledWith(
            'Interrupted setup cleared. You can publish again.',
            expect.anything()
        );
        expect(document.body.textContent).not.toContain('PRIVATE CAPABILITY');
    });
    it('does not offer cleanup for an ambiguous commit', async () => {
        mocks.publish.mockRejectedValue({ code: 'pending', canDiscard: false });
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
        expect(
            screen.queryByRole('button', { name: 'Clear interrupted setup' })
        ).not.toBeInTheDocument();
        expect(mocks.discard).not.toHaveBeenCalled();
    });
    it('keeps interrupted setup controls when cleanup is incomplete', async () => {
        mocks.publish.mockRejectedValue({ code: 'failed', canDiscard: true });
        mocks.discard.mockResolvedValue(false);
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Publish resume' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Clear interrupted setup' }));
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith(
                'We could not clear this setup. Please try again.',
                expect.anything()
            )
        );
        expect(screen.getByRole('button', { name: 'Clear interrupted setup' })).toBeInTheDocument();
        expect(mocks.toast).not.toHaveBeenCalledWith(
            'Interrupted setup cleared. You can publish again.',
            expect.anything()
        );
    });
    it('explains how to download an oversized resume without silently removing its QR code', async () => {
        mocks.publish.mockRejectedValue({ code: 'size' });
        render(<ResumeBuilder />);
        fireEvent.click(screen.getByRole('button', { name: 'Download resume' }));
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith(
                'This resume is too large to publish. Turn off the QR code to download it.',
                expect.anything()
            )
        );
        expect(mocks.state.documentSetup).toEqual({ showQRCode: true, fileName: 'resume.pdf' });
        expect(mocks.download).not.toHaveBeenCalled();
    });
});
