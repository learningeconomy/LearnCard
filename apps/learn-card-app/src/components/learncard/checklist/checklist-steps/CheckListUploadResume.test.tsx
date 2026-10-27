import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getFile: vi.fn(),
    fetchParsedCredentials: vi.fn(),
    storeSelectedCredentials: vi.fn(),
    initWallet: vi.fn(),
    pending: null as null | { credentials: unknown[]; rawArtifact: object },
    base64Data: null as string | null,
    rawArtifact: {},
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    UploadTypesEnum: { Resume: 'resume' },
    ToastTypeEnum: { Error: 'error' },
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useDeleteCredentialRecord: () => ({ mutateAsync: vi.fn() }),
    useConfirmation: () => vi.fn(),
    useToast: () => ({ presentToast: vi.fn() }),
    useGetCheckListStatus: () => ({ refetchCheckListStatus: vi.fn() }),
    checklistStore: {
        useTracked: { pendingReview: () => ({ resume: mocks.pending }) },
        get: { pendingReview: () => ({ resume: mocks.pending }) },
        set: {
            setPendingReview: (_kind: string, pending: typeof mocks.pending) => {
                mocks.pending = pending;
            },
        },
    },
}));
vi.mock('../../../../hooks/useUploadFile', () => ({
    useUploadFile: () => ({
        getFile: mocks.getFile,
        fetchParsedCredentials: mocks.fetchParsedCredentials,
        storeSelectedCredentials: mocks.storeSelectedCredentials,
        parsedCredentials: [],
        setParsedCredentials: vi.fn(),
        base64Data: mocks.base64Data,
        rawArtifactCredential: mocks.rawArtifact,
        fileUploadOutcomes: [],
    }),
}));
vi.mock('../../../../paraglide/messages.js', () => ({
    'passport.buildMyLearnCard.managers.toastGenericError': () => 'Extraction failed',
    'passport.buildMyLearnCard.managers.saveOutcomeError': () => 'Save failed',
    'passport.buildMyLearnCard.managers.resume.title': () => 'Resume',
    'passport.buildMyLearnCard.managers.resume.description': () => 'Upload your most recent resume',
    'passport.buildMyLearnCard.managers.addButton': () => 'Add',
}));
vi.mock('learn-card-base/svgs/UploadIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/RefreshIcon', () => ({ default: () => null }));
vi.mock('../loader/ChecklistLoader', () => ({ default: () => null }));
vi.mock('./CheckListItemSkeleton', () => ({ default: () => null }));
vi.mock('../CheckListManager/CheckListManagerFooter', () => ({ default: () => null }));
vi.mock('./AchievementTypeSelectorModal', () => ({ getWalletCategory: vi.fn() }));
vi.mock('./credentialEditFields', () => ({ getField: vi.fn() }));
vi.mock('./UploadedOriginalDocument', () => ({ UploadedOriginalDocument: () => null }));
vi.mock('./UploadFileOutcomeList', () => ({ UploadFileOutcomeList: () => null }));
vi.mock('../../../../hooks/useUploadedDocumentPreview', () => ({
    useUploadedDocumentPreview: () => ({ opening: false, openDocument: vi.fn() }),
}));
vi.mock('./CheckListCredentialReviewStep', () => ({
    default: ({ onBack, onConfirm }: { onBack: () => void; onConfirm: (vcs: []) => void }) => (
        <>
            <button onClick={() => onConfirm([])}>Save</button>
            <button onClick={onBack}>Back</button>
        </>
    ),
}));

import CheckListUploadResume from './CheckListUploadResume';

describe('resume upload outcome lifecycle', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.pending = null;
        mocks.base64Data = null;
        mocks.initWallet.mockResolvedValue({
            index: { LearnCloud: { get: vi.fn().mockResolvedValue([]) } },
        });
    });

    it('clears a save failure when leaving review without discarding the pending review', async () => {
        const pending = { credentials: [{}], rawArtifact: mocks.rawArtifact };
        mocks.pending = pending;
        mocks.storeSelectedCredentials.mockRejectedValue(new Error('storage unavailable'));
        render(<CheckListUploadResume />);

        fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));

        expect(await screen.findByRole('button', { name: 'Add' })).toBeEnabled();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(mocks.pending).toBe(pending);
    });

    it('clears an extraction failure as soon as another file starts uploading', async () => {
        mocks.base64Data = 'previous-file';
        mocks.fetchParsedCredentials.mockRejectedValue(new Error('extraction unavailable'));
        const upload = Promise.withResolvers<void>();
        mocks.getFile.mockReturnValue(upload.promise);
        const { container } = render(<CheckListUploadResume />);
        expect(await screen.findByRole('status')).toHaveTextContent('Extraction failed');

        const input = container.querySelector('input[type="file"]');
        if (!input) throw new Error('Upload input unavailable');
        fireEvent.change(input, {
            target: { files: [new File(['resume'], 'new-resume.txt', { type: 'text/plain' })] },
        });

        expect(screen.queryByText('Extraction failed')).not.toBeInTheDocument();
        await act(async () => upload.resolve());
    });
});
