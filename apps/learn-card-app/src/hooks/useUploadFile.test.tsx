import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { filestackUploadMock, initWalletMock, logErrorMock, presentToastMock, refetchQueriesMock } =
    vi.hoisted(() => ({
        filestackUploadMock: vi.fn(),
        initWalletMock: vi.fn(),
        logErrorMock: vi.fn(),
        presentToastMock: vi.fn(),
        refetchQueriesMock: vi.fn(),
    }));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ refetchQueries: refetchQueriesMock }),
}));

vi.mock('../paraglide/messages.js', () => ({
    'passport.buildMyLearnCard.uploadError.title': () => 'Upload Failed',
    'passport.buildMyLearnCard.uploadError.partialTitle': () => 'Some Files Failed',
    'passport.buildMyLearnCard.uploadError.singleMessage': () => 'Single upload failed',
    'passport.buildMyLearnCard.uploadError.multipleMessage': () => 'Multiple uploads failed',
    'passport.buildMyLearnCard.uploadError.partialSingleMessage': () =>
        'One upload failed; continue with the rest',
    'passport.buildMyLearnCard.uploadError.partialMultipleMessage': ({
        count,
    }: {
        count: number;
    }) => `${count} uploads failed; continue with the rest`,
}));

vi.mock('learn-card-base', () => ({
    BoostMediaOptionsEnum: { document: 'document', photo: 'photo' },
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    UploadTypesEnum: {
        Resume: 'resume',
        Certificate: 'certificate',
        Transcript: 'transcript',
        Diploma: 'diploma',
        RawVC: 'rawVC',
    },
    categoryMetadata: {},
    checklistStore: { set: { updateIsParsing: vi.fn() } },
    getImageUploadProvider: () => ({ upload: filestackUploadMock }),
    getCategoryForCredential: vi.fn(),
    getLogger: () => ({ debug: vi.fn(), error: logErrorMock, info: vi.fn(), warn: vi.fn() }),
    newCredsStore: { set: { addNewCreds: vi.fn() } },
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    useGetCheckListStatus: () => ({ refetchCheckListStatus: vi.fn().mockResolvedValue(undefined) }),
    useModal: () => ({ closeModal: vi.fn() }),
    useSyncAllCredentialsToContractsMutation: () => ({ mutate: vi.fn() }),
    useToast: () => ({ presentToast: presentToastMock }),
    useUploadFileMutation: () => ({ mutateAsync: vi.fn() }),
    useWallet: () => ({
        initWallet: initWalletMock,
        storeAndAddVCToWallet: vi.fn(),
    }),
}));

vi.mock('learn-card-base/hooks/useAiInsightCredential', () => ({
    useAiInsightCredentialMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: vi.fn(),
}));

vi.mock('./useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ uploadVcFromText: vi.fn() }),
}));

import { addCertificateAttachment, useUploadFile } from './useUploadFile';
import { UploadTypesEnum } from 'learn-card-base';

const createChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> =>
    ({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);

describe('useUploadFile certificate uploads', () => {
    beforeEach(() => {
        filestackUploadMock.mockReset();
        initWalletMock.mockReset();
        logErrorMock.mockReset();
        presentToastMock.mockReset();
        refetchQueriesMock.mockReset();
        initWalletMock.mockResolvedValue({ id: { did: () => 'did:key:test' } });
    });

    it('surfaces a failed upload and clears the failed file state', async () => {
        filestackUploadMock.mockRejectedValueOnce(new Error('offline'));
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const event = createChangeEvent([new File(['certificate'], 'certificate.pdf')]);

        await act(async () => {
            await result.current.getFile(event, UploadTypesEnum.Certificate);
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.file).toBeNull();
        expect(result.current.rawArtifactCredential).toBeNull();
        expect(presentToastMock).toHaveBeenCalledWith(
            'Single upload failed',
            expect.objectContaining({ title: 'Upload Failed', type: 'error' })
        );
    });

    it('keeps successful files when one upload in a batch fails', async () => {
        filestackUploadMock
            .mockRejectedValueOnce(new Error('first upload failed'))
            .mockResolvedValueOnce({ url: 'https://cdn.example.com/success' });
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const event = createChangeEvent([
            new File(['bad'], 'bad.pdf'),
            new File(['good'], 'good.pdf'),
        ]);

        await act(async () => {
            await result.current.getFiles(event, UploadTypesEnum.Certificate);
        });

        expect(result.current.files).toEqual([
            expect.objectContaining({ name: 'good.pdf', type: 'PDF' }),
        ]);
        expect(result.current.rawArtifactCredentials).toHaveLength(1);
        expect(result.current.rawArtifactCredentials[0].rawArtifact.url).toBe(
            'https://cdn.example.com/success'
        );
        expect(presentToastMock).toHaveBeenCalledWith(
            'One upload failed; continue with the rest',
            expect.objectContaining({ title: 'Some Files Failed', type: 'error' })
        );
    });
});

describe('addCertificateAttachment', () => {
    it('uses LearnCard attachment IRIs instead of placeholder domains', () => {
        const credential = addCertificateAttachment(
            { '@context': ['https://www.w3.org/2018/credentials/v1'] },
            {
                rawArtifact: {
                    type: UploadTypesEnum.Certificate,
                    fileName: 'certificate.pdf',
                    fileSize: '1 KB',
                    fileType: 'PDF',
                    url: 'https://cdn.example.com/certificate',
                },
            }
        );
        const serializedContext = JSON.stringify(credential['@context']);

        expect(serializedContext).toContain('https://docs.learncard.com/definitions#');
        expect(serializedContext).not.toContain('example.org');
    });
});
