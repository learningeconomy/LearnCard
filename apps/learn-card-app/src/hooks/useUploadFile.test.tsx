import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { initWalletMock, logErrorMock, presentToastMock, refetchQueriesMock } = vi.hoisted(() => ({
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

import { createRawArtifactVC, getFileInfo, useUploadFile } from './useUploadFile';
import { addCertificateAttachment } from './certificateAttachment';
import { UploadTypesEnum } from 'learn-card-base';

const createChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> =>
    ({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);

describe('getFileInfo', () => {
    it('uses the final extension segment for multi-dot filenames', () => {
        expect(getFileInfo(new File(['image'], 'scan.final.png'))).toEqual({
            name: 'scan.final.png',
            size: '5 B',
            type: 'PNG',
        });
    });
});

describe('useUploadFile certificate uploads', () => {
    beforeEach(() => {
        initWalletMock.mockReset();
        logErrorMock.mockReset();
        presentToastMock.mockReset();
        refetchQueriesMock.mockReset();
        initWalletMock.mockResolvedValue({ id: { did: () => 'did:key:test' } });
    });

    it('keeps certificate bytes in the raw artifact instead of uploading them externally', async () => {
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const event = createChangeEvent([
            new File(['certificate'], 'certificate.pdf', { type: 'application/pdf' }),
        ]);

        await act(async () => {
            await result.current.getFile(event, UploadTypesEnum.Certificate);
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.rawArtifactCredential.rawArtifact).toMatchObject({
            data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
            fileName: 'certificate.pdf',
            type: UploadTypesEnum.Certificate,
        });
        expect(result.current.rawArtifactCredential.rawArtifact).not.toHaveProperty('url');
        expect(presentToastMock).not.toHaveBeenCalled();
    });

    it('embeds every certificate in a batch as base64', async () => {
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const event = createChangeEvent([
            new File(['first'], 'first.pdf', { type: 'application/pdf' }),
            new File(['second'], 'second.pdf', { type: 'application/pdf' }),
        ]);

        await act(async () => {
            await result.current.getFiles(event, UploadTypesEnum.Certificate);
        });

        expect(result.current.files).toEqual([
            expect.objectContaining({ name: 'first.pdf', type: 'PDF' }),
            expect.objectContaining({ name: 'second.pdf', type: 'PDF' }),
        ]);
        expect(
            result.current.rawArtifactCredentials.map(credential => credential.rawArtifact.data)
        ).toEqual(['data:application/pdf;base64,Zmlyc3Q=', 'data:application/pdf;base64,c2Vjb25k']);
        expect(
            result.current.rawArtifactCredentials.every(
                credential => !('url' in credential.rawArtifact)
            )
        ).toBe(true);
    });

    it('never adds a raw artifact URL when creating a certificate credential', async () => {
        const credential = await createRawArtifactVC(
            new File(['certificate'], 'certificate.pdf', { type: 'application/pdf' }),
            'did:key:test',
            UploadTypesEnum.Certificate
        );

        expect(credential.rawArtifact.data).toBe('data:application/pdf;base64,Y2VydGlmaWNhdGU=');
        expect(credential.rawArtifact).not.toHaveProperty('url');
        expect(JSON.stringify(credential['@context'])).not.toContain('rawArtifactUrl');
    });
});

describe('addCertificateAttachment', () => {
    const rawArtifactCredential = {
        rawArtifact: {
            type: UploadTypesEnum.Certificate,
            fileName: 'certificate.pdf',
            fileSize: '1 KB',
            fileType: 'PDF',
            data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
        },
    };

    it('embeds base64 data using canonical boost attachment terms', () => {
        const credential = addCertificateAttachment(
            { '@context': ['https://www.w3.org/2018/credentials/v1'] },
            rawArtifactCredential
        );
        const attachmentContexts = credential['@context'].filter(
            (context: unknown) =>
                typeof context === 'object' &&
                context !== null &&
                'attachments' in context &&
                typeof context.attachments === 'object' &&
                context.attachments !== null
        );

        expect(credential.attachments[0]).toMatchObject({
            title: 'certificate.pdf',
            fileName: 'certificate.pdf',
            fileSize: '1 KB',
            fileType: 'PDF',
            type: 'document',
            data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
        });
        expect(credential.attachments[0]).not.toHaveProperty('url');
        expect(attachmentContexts).toHaveLength(1);
        expect(attachmentContexts[0]).toMatchObject({
            attachments: {
                '@id': 'lcn:boostAttachments',
                '@container': '@set',
                '@context': {
                    title: {
                        '@id': 'lcn:boostAttachmentTitle',
                        '@type': 'xsd:string',
                    },
                    type: {
                        '@id': 'lcn:boostAttachmentType',
                        '@type': 'xsd:string',
                    },
                    url: {
                        '@id': 'lcn:boostAttachmentUrl',
                        '@type': 'xsd:string',
                    },
                    data: {
                        '@id': 'lcn:boostAttachmentData',
                        '@type': 'xsd:string',
                    },
                    fileName: {
                        '@id': 'lcn:boostAttachmentFileName',
                        '@type': 'xsd:string',
                    },
                    fileSize: {
                        '@id': 'lcn:boostAttachmentFileSize',
                        '@type': 'xsd:string',
                    },
                    fileType: {
                        '@id': 'lcn:boostAttachmentFileType',
                        '@type': 'xsd:string',
                    },
                },
            },
        });
    });

    it('does not duplicate the canonical context or attachment', () => {
        const credential = addCertificateAttachment(
            {
                '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://ctx.learncard.com/boosts/1.0.3.json',
                ],
            },
            rawArtifactCredential
        );
        const enrichedAgain = addCertificateAttachment(credential, rawArtifactCredential);
        const attachmentContexts = enrichedAgain['@context'].filter(
            (context: unknown) =>
                typeof context === 'object' && context !== null && 'attachments' in context
        );

        expect(attachmentContexts).toHaveLength(1);
        expect(enrichedAgain.attachments).toHaveLength(1);
    });

    it('deduplicates an existing attachment with the same file identity', () => {
        const credential = addCertificateAttachment(
            {
                attachments: [
                    {
                        fileName: 'certificate.pdf',
                        fileSize: '1 KB',
                        fileType: 'PDF',
                        data: 'data:application/pdf;base64,b2xk',
                    },
                ],
            },
            rawArtifactCredential
        );

        expect(credential.attachments).toHaveLength(1);
        expect(credential.attachments[0]).toMatchObject({
            data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
        });
    });

    it('replaces a legacy competing attachment mapping', () => {
        const legacyContext = {
            lcn: 'https://docs.learncard.com/definitions#',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            attachments: {
                '@id': 'lcn:boostAttachments',
                '@container': '@set',
                '@context': {
                    title: {
                        '@id': 'lcn:attachmentTitle',
                        '@type': 'xsd:string',
                    },
                },
            },
        };
        const credential = addCertificateAttachment(
            {
                '@context': ['https://www.w3.org/2018/credentials/v1', legacyContext],
            },
            rawArtifactCredential
        );
        const serializedContext = JSON.stringify(credential['@context']);

        expect(serializedContext).not.toContain('lcn:attachmentTitle');
        expect(serializedContext).toContain('lcn:boostAttachmentTitle');
        expect(serializedContext).toContain('lcn:boostAttachmentData');
    });
});
