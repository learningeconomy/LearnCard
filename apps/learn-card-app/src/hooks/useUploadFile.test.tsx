import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { PendingReviewData } from 'learn-card-base/stores/checklistStore';
const {
    initWalletMock,
    logErrorMock,
    presentToastMock,
    refetchQueriesMock,
    uploadMutationMock,
    storeAndAddVCToWalletMock,
} = vi.hoisted(() => ({
    initWalletMock: vi.fn(),
    logErrorMock: vi.fn(),
    presentToastMock: vi.fn(),
    refetchQueriesMock: vi.fn(),
    uploadMutationMock: vi.fn(),
    storeAndAddVCToWalletMock: vi.fn(),
}));
const testState = vi.hoisted(() => ({
    aiEnabled: true,
    pending: {} as Record<string, PendingReviewData | null>,
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
    'passport.buildMyLearnCard.managers.saveOutcomeError': () => 'Original save failed',
    'passport.buildMyLearnCard.managers.credentialSaveOutcomeError': () => 'Credential save failed',
    'passport.buildMyLearnCard.managers.toastGenericError': () => 'Extraction failed',
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
    categoryMetadata: { Achievement: {} },
    checklistStore: {
        get: { pendingReview: () => testState.pending },
        set: {
            updateIsParsing: vi.fn(),
            setPendingReview: (kind: string, pending: PendingReviewData | null) => {
                testState.pending[kind] = pending;
            },
        },
        useTracked: {
            isParsing: () => ({
                resume: false,
                certificate: false,
                transcript: false,
                diploma: false,
                rawVC: false,
            }),
        },
    },
    getCategoryForCredential: vi.fn(),
    getLogger: () => ({ debug: vi.fn(), error: logErrorMock, info: vi.fn(), warn: vi.fn() }),
    newCredsStore: { set: { addNewCreds: vi.fn() } },
    switchedProfileStore: { use: { switchedDid: () => undefined } },
    useGetCheckListStatus: () => ({ refetchCheckListStatus: vi.fn().mockResolvedValue(undefined) }),
    useAiFeatureGate: () => ({ isAiEnabled: testState.aiEnabled, isLoading: false }),
    useSyncAllCredentialsToContractsMutation: () => ({ mutate: vi.fn() }),
    useToast: () => ({ presentToast: presentToastMock }),
    useUploadFileMutation: () => ({ mutateAsync: uploadMutationMock }),
    useWallet: () => ({
        initWallet: initWalletMock,
        storeAndAddVCToWallet: storeAndAddVCToWalletMock,
    }),
}));

vi.mock('learn-card-base/hooks/useAiInsightCredential', () => ({
    useAiInsightCredentialMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('learn-card-base/helpers/fileExtraction', async () => {
    class FileExtractionError extends Error {
        constructor(readonly code: string) {
            super(code);
        }
    }
    return {
        createFileExtractionAttempt: vi.fn(() => ({
            operationId: 'operation-1',
            attemptId: 'attempt-1',
            attempt: 1,
        })),
        FileExtractionError,
        recordFilePersistenceDiagnostic: vi.fn(),
    };
});
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: vi.fn(),
}));

vi.mock('./useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ uploadVcFromText: vi.fn() }),
}));

import { createRawArtifactVC, getFileInfo, useUploadFile } from './useUploadFile';
import { addCertificateAttachment } from './certificateAttachment';
import { UploadTypesEnum } from 'learn-card-base';
import { FileExtractionError } from 'learn-card-base/helpers/fileExtraction';
import type {
    RawArtifactCredential,
    ParsedFileCredential,
} from 'learn-card-base/types/file-extraction';
import type { UnsignedVC } from '@learncard/types';
import type { ArtifactProcessingResult } from './uploadFile.types';

const rawArtifact = (id: string, fileName = 'document.pdf'): RawArtifactCredential => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id,
    type: ['VerifiableCredential', 'RawArtifactCredential'],
    issuer: 'did:key:test',
    issuanceDate: '2025-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:key:test' },
    rawArtifact: {
        type: UploadTypesEnum.Certificate,
        fileName,
        fileSize: '1 KB',
        fileType: 'PDF',
        data: 'data:application/pdf;base64,YQ==',
    },
});

const unsignedDraft = (id?: string): UnsignedVC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    ...(id ? { id } : {}),
    type: ['VerifiableCredential'],
    issuer: 'did:key:test',
    issuanceDate: '2025-01-01T00:00:00.000Z',
    credentialSubject: { id: 'did:key:test', name: 'Draft' },
});

const parsedDraft = (vc: UnsignedVC, artifactId?: string): ParsedFileCredential => ({
    vc,
    artifactId,
});

const createChangeEvent = (files: File[]): React.ChangeEvent<HTMLInputElement> =>
    ({ target: { files } }) as unknown as React.ChangeEvent<HTMLInputElement>;
beforeEach(() => {
    testState.aiEnabled = true;
    testState.pending = {};
});
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
        storeAndAddVCToWalletMock.mockReset();
        storeAndAddVCToWalletMock.mockResolvedValue({
            result: true,
            credentialUri: 'credential-uri',
        });
        initWalletMock.mockReset();
        logErrorMock.mockReset();
        presentToastMock.mockReset();
        refetchQueriesMock.mockReset();
        initWalletMock.mockResolvedValue({ id: { did: () => 'did:key:test' } });
    });
    it('preserves the original bytes when preparing a certificate', async () => {
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const event = createChangeEvent([
            new File(['certificate'], 'certificate.pdf', { type: 'application/pdf' }),
        ]);

        await act(async () => {
            await result.current.getFile(event, UploadTypesEnum.Certificate);
        });

        expect(result.current.isUploading).toBe(false);
        expect(result.current.rawArtifactCredential?.rawArtifact).toMatchObject({
            data: 'data:application/pdf;base64,Y2VydGlmaWNhdGU=',
            fileName: 'certificate.pdf',
            type: UploadTypesEnum.Certificate,
        });
        expect(result.current.rawArtifactCredential?.rawArtifact).not.toHaveProperty('url');
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
describe('useUploadFile persistence outcomes', () => {
    let records: Map<string, { id: string; uri: string; category: string }>;
    let documents: Map<string, UnsignedVC>;
    let savedCredentials: Map<string, UnsignedVC>;
    let failingCredentials: Set<string>;
    let wallet: {
        id: { did: () => string };
        invoke: { issueCredential: Mock };
        read: { get: Mock };
        store: { LearnCloud: { uploadEncrypted: Mock } };
        index: { LearnCloud: { get: Mock; add: Mock; update: Mock } };
    };
    beforeEach(() => {
        initWalletMock.mockReset();
        uploadMutationMock.mockReset();
        logErrorMock.mockReset();
        records = new Map();
        documents = new Map();
        savedCredentials = new Map();
        failingCredentials = new Set();
        wallet = {
            id: { did: () => 'did:key:test' },
            invoke: { issueCredential: vi.fn(async (vc: UnsignedVC) => vc) },
            read: { get: vi.fn(async (uri: string) => documents.get(uri)) },
            store: {
                LearnCloud: {
                    uploadEncrypted: vi.fn(async (vc: UnsignedVC) => {
                        const uri = `original:${vc.id}`;
                        documents.set(uri, vc);
                        return uri;
                    }),
                },
            },
            index: {
                LearnCloud: {
                    get: vi.fn(async (query: { id?: string; category?: string }) => {
                        if (query.id && savedCredentials.has(query.id)) {
                            return [
                                {
                                    id: query.id,
                                    uri: `selected:${query.id}`,
                                    category: 'Achievement',
                                },
                            ];
                        }
                        return [...records.values()].filter(record =>
                            query.id ? record.id === query.id : record.category === query.category
                        );
                    }),
                    add: vi.fn(async (record: { id: string; uri: string; category: string }) => {
                        records.set(record.id, record);
                        return true;
                    }),
                    update: vi.fn(async (id: string, update: { uri: string }) => {
                        const existing = records.get(id);
                        if (!existing) return false;
                        records.set(id, { ...existing, ...update });
                        return true;
                    }),
                },
            },
        };
        initWalletMock.mockResolvedValue(wallet);
        storeAndAddVCToWalletMock.mockReset();
        storeAndAddVCToWalletMock.mockImplementation(async (vc: UnsignedVC) => {
            if (!vc.id || failingCredentials.has(vc.id)) throw new Error('PRIVATE_STORAGE_ERROR');
            savedCredentials.set(vc.id, vc);
            return { result: true, credentialUri: `selected:${vc.id}`, category: 'Achievement' };
        });
    });

    it('waits for review before storing nonempty extraction', async () => {
        uploadMutationMock.mockResolvedValue({
            vcs: [parsedDraft(unsignedDraft('reviewed'))],
            processing: { outcome: 'success', credentialCount: 1 },
        });
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await result.current.getFile(
                createChangeEvent([
                    new File(['certificate'], 'certificate.txt', { type: 'text/plain' }),
                ]),
                UploadTypesEnum.Certificate
            );
        });
        await act(async () => {
            await result.current.fetchParsedCredentials(UploadTypesEnum.Certificate);
        });
        expect(result.current.fileUploadOutcomes[0]).toMatchObject({
            status: 'review',
            extractedCount: 1,
        });
        expect(records.size).toBe(0);
        expect(savedCredentials.size).toBe(0);
    });

    it.each(['sign', 'upload', 'index'] as const)(
        'leaves the existing resume intact when %s fails',
        async stage => {
            records.set('resume-index', {
                id: 'resume-index',
                uri: 'existing',
                category: 'resume',
            });
            documents.set('existing', rawArtifact('old-resume'));
            if (stage === 'sign')
                wallet.invoke.issueCredential.mockRejectedValueOnce(new Error('PRIVATE_SIGN'));
            if (stage === 'upload')
                wallet.store.LearnCloud.uploadEncrypted.mockRejectedValueOnce(
                    new Error('PRIVATE_UPLOAD')
                );
            if (stage === 'index') wallet.index.LearnCloud.update.mockResolvedValueOnce(false);
            const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
            await act(async () => {
                await expect(
                    result.current.storeSelectedCredentials(
                        [],
                        rawArtifact('new-resume'),
                        UploadTypesEnum.Resume
                    )
                ).rejects.toMatchObject({ stage: 'artifact_save' });
            });
            expect(records.get('resume-index')?.uri).toBe('existing');
            expect(result.current.fileUploadOutcomes[0]).toMatchObject({
                status: 'save_failed',
                failedStage: 'artifact_save',
                storedCount: 0,
            });
            expect(JSON.stringify(result.current.fileUploadOutcomes)).not.toContain('PRIVATE_');
        }
    );

    it('retries indexing without uploading the original twice', async () => {
        wallet.index.LearnCloud.add.mockRejectedValueOnce(new Error('PRIVATE_INDEX'));
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        const artifact = rawArtifact('index-retry');
        await act(async () => {
            await expect(
                result.current.storeSelectedCredentials([], artifact, UploadTypesEnum.Certificate)
            ).rejects.toMatchObject({ stage: 'artifact_save' });
        });
        await act(async () => {
            await result.current.retryFileSave(artifact, UploadTypesEnum.Certificate);
        });
        expect(records.get(artifact.id)?.uri).toBe(`original:${artifact.id}`);
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
        expect(uploadMutationMock).not.toHaveBeenCalled();
    });

    it('does not replace a changed resume when retrying an index failure', async () => {
        records.set('resume-index', { id: 'resume-index', uri: 'existing', category: 'resume' });
        documents.set('existing', rawArtifact('old-resume'));
        wallet.index.LearnCloud.update.mockRejectedValueOnce(new Error('PRIVATE_INDEX'));
        const artifact = rawArtifact('pending-resume');
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
        await act(async () => {
            await expect(
                result.current.storeSelectedCredentials([], artifact, UploadTypesEnum.Resume)
            ).rejects.toMatchObject({ stage: 'artifact_save' });
        });
        records.set('resume-index', { id: 'resume-index', uri: 'changed', category: 'resume' });
        documents.set('changed', {
            ...rawArtifact('other-resume'),
            issuanceDate: '2020-01-01T00:00:00Z',
        });
        await act(async () => {
            await expect(
                result.current.retryFileSave(artifact, UploadTypesEnum.Resume)
            ).rejects.toMatchObject({ stage: 'artifact_save' });
        });
        expect(records.get('resume-index')?.uri).toBe('changed');
        expect(wallet.index.LearnCloud.update).toHaveBeenCalledTimes(1);
    });

    it('distinguishes empty extraction from choosing none of the extracted credentials', async () => {
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        uploadMutationMock.mockResolvedValueOnce({
            vcs: [],
            processing: { outcome: 'empty', credentialCount: 0 },
        });
        await act(async () => {
            await result.current.retryFileExtraction(
                rawArtifact('empty'),
                UploadTypesEnum.Certificate
            );
        });
        expect(result.current.fileUploadOutcomes[0]).toMatchObject({
            status: 'empty',
            extractedCount: 0,
        });
        expect(records.size).toBe(0);
        expect(documents.size).toBe(0);
        expect(savedCredentials.size).toBe(0);
        uploadMutationMock.mockResolvedValueOnce({
            vcs: [parsedDraft(unsignedDraft('unselected'))],
            processing: { outcome: 'success', credentialCount: 1 },
        });
        const artifact = rawArtifact('none');
        await act(async () => {
            await result.current.retryFileExtraction(artifact, UploadTypesEnum.Certificate);
        });
        await act(async () => {
            const saved = await result.current.storeSelectedCredentials(
                [],
                artifact,
                UploadTypesEnum.Certificate
            );
            expect(saved).toMatchObject({ extractedCount: 1, selectedCount: 0, storedCount: 0 });
        });
        expect(
            result.current.fileUploadOutcomes.find(item => item.artifact.id === 'none')
        ).toMatchObject({ status: 'stored', extractedCount: 1, selectedCount: 0, storedCount: 0 });
        expect(savedCredentials.size).toBe(0);
    });

    it('does not replace the saved resume with a blank document or persist it on retry', async () => {
        records.set('resume-index', {
            id: 'resume-index',
            uri: 'existing-resume',
            category: 'resume',
        });
        documents.set('existing-resume', rawArtifact('existing-resume'));
        uploadMutationMock.mockRejectedValue(new FileExtractionError('NO_READABLE_TEXT'));
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
        const artifact = rawArtifact('blank-resume');
        await act(async () => {
            await result.current.retryFileExtraction(artifact, UploadTypesEnum.Resume);
        });
        await act(async () => {
            await result.current.retryFileExtraction(artifact, UploadTypesEnum.Resume);
        });
        expect(result.current.fileUploadOutcomes).toMatchObject([
            { status: 'empty', extractedCount: 0 },
        ]);
        expect([...records.values()]).toEqual([
            { id: 'resume-index', uri: 'existing-resume', category: 'resume' },
        ]);
        expect(documents.has('original:blank-resume')).toBe(false);
        expect(savedCredentials.size).toBe(0);
        expect(wallet.invoke.issueCredential).not.toHaveBeenCalled();
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
    });

    it('does not count a false selected-storage result even if it includes a URI', async () => {
        storeAndAddVCToWalletMock.mockResolvedValue({
            result: false,
            credentialUri: 'not-saved',
            category: 'Achievement',
        });
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await expect(
                result.current.storeSelectedCredentials(
                    [unsignedDraft('failed')],
                    rawArtifact('source'),
                    UploadTypesEnum.Certificate
                )
            ).rejects.toMatchObject({ stage: 'credential_save' });
        });
        expect(result.current.fileUploadOutcomes[0]).toMatchObject({
            failedStage: 'credential_save',
            selectedCount: 1,
            storedCount: 0,
        });
        expect(savedCredentials.size).toBe(0);
    });

    it('keeps idless candidates attached to their own files and reports per-file counts', async () => {
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await result.current.getFiles(
                createChangeEvent([
                    new File(['first'], 'first.txt', { type: 'text/plain' }),
                    new File(['second'], 'second.txt', { type: 'text/plain' }),
                ]),
                UploadTypesEnum.Certificate
            );
        });
        uploadMutationMock.mockImplementation(async () => ({
            vcs: [parsedDraft(unsignedDraft())],
            processing: { outcome: 'success', credentialCount: 1 },
        }));
        await act(async () => {
            await result.current.fetchParsedCredentialsFromFiles(UploadTypesEnum.Certificate);
        });
        const [first, second] = result.current.rawArtifactCredentials;
        const drafts = result.current.parsedCredentials;
        await act(async () => {
            await result.current.storeSelectedCredentials(
                drafts.map(entry => entry.vc),
                first,
                UploadTypesEnum.Certificate,
                [second]
            );
        });
        expect([...savedCredentials.values()].map(vc => vc.attachments[0].fileName)).toEqual([
            'first.txt',
            'second.txt',
        ]);
        expect(
            result.current.fileUploadOutcomes.map(item => ({
                id: item.artifact.id,
                extracted: item.extractedCount,
                selected: item.selectedCount,
                stored: item.storedCount,
            }))
        ).toEqual(
            [first, second].map(artifact => ({
                id: artifact.id,
                extracted: 1,
                selected: 1,
                stored: 1,
            }))
        );
    });

    it('continues other files after an original fails to index', async () => {
        wallet.index.LearnCloud.add.mockRejectedValueOnce(new Error('PRIVATE_INDEX'));
        const first = rawArtifact('first');
        const second = rawArtifact('second');
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await expect(
                result.current.storeSelectedCredentials([], first, UploadTypesEnum.Certificate, [
                    second,
                ])
            ).rejects.toMatchObject({ stage: 'artifact_save' });
        });
        expect(records.has('first')).toBe(false);
        expect(records.has('second')).toBe(true);
        expect(result.current.fileUploadOutcomes.map(item => item.status)).toEqual([
            'save_failed',
            'stored',
        ]);
    });

    it('reuses successful selected writes after a failed batch and remount', async () => {
        const artifact = rawArtifact('partial');
        const drafts = [unsignedDraft('saved'), unsignedDraft('failed')];
        failingCredentials.add('failed');
        const mounted = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            mounted.result.current.setParsedCredentials(
                drafts.map(vc => parsedDraft(vc, artifact.id))
            );
        });
        await act(async () => {
            await expect(
                mounted.result.current.storeSelectedCredentials(
                    drafts,
                    artifact,
                    UploadTypesEnum.Certificate
                )
            ).rejects.toMatchObject({ stage: 'credential_save' });
        });
        expect(mounted.result.current.fileUploadOutcomes[0]).toMatchObject({
            extractedCount: 2,
            selectedCount: 2,
            storedCount: 1,
        });
        mounted.unmount();
        failingCredentials.clear();
        const restored = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            restored.result.current.setParsedCredentials(
                drafts.map(vc => parsedDraft(vc, artifact.id))
            );
        });
        await act(async () => {
            const saved = await restored.result.current.storeSelectedCredentials(
                drafts,
                artifact,
                UploadTypesEnum.Certificate
            );
            expect(saved).toMatchObject({ extractedCount: 2, selectedCount: 2, storedCount: 2 });
        });
        expect(savedCredentials.size).toBe(2);
        expect(
            storeAndAddVCToWalletMock.mock.calls.filter(([vc]) => vc.id === 'saved')
        ).toHaveLength(1);
        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledTimes(1);
    });

    it('does not resave an original retried from its immutable saved URI', async () => {
        uploadMutationMock.mockResolvedValue({
            vcs: [parsedDraft(unsignedDraft('retry-draft'))],
            processing: { outcome: 'success', credentialCount: 1 },
        });
        const artifact = rawArtifact('saved-original');
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
        await act(async () => {
            const retry = await result.current.retryFileExtraction(
                artifact,
                UploadTypesEnum.Resume,
                'immutable-original'
            );
            expect(retry.outcome.status).toBe('review');
        });
        await act(async () => {
            await result.current.storeSelectedCredentials(
                [result.current.parsedCredentials[0].vc],
                artifact,
                UploadTypesEnum.Resume
            );
        });
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
        expect(records.size).toBe(0);
        expect(savedCredentials.has('retry-draft')).toBe(true);
    });

    it('reports a failed retry for this file even when another still has review drafts', async () => {
        uploadMutationMock.mockResolvedValueOnce({
            vcs: [parsedDraft(unsignedDraft('pending'))],
            processing: { outcome: 'success', credentialCount: 1 },
        });
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await result.current.retryFileExtraction(
                rawArtifact('first'),
                UploadTypesEnum.Certificate
            );
        });
        uploadMutationMock.mockRejectedValueOnce(new Error('PRIVATE_MODEL_ERROR'));
        await act(async () => {
            const retry = await result.current.retryFileExtraction(
                rawArtifact('second'),
                UploadTypesEnum.Certificate
            );
            expect(retry.outcome.status).toBe('extraction_failed');
            expect(retry.credentials.map(entry => entry.vc.id)).toEqual(['pending']);
            expect(retry.outcome.message).not.toContain('PRIVATE_MODEL_ERROR');
        });
        expect(records.has('second')).toBe(true);
    });

    it('reports extraction failure while the original is still saving', async () => {
        uploadMutationMock.mockRejectedValue(new Error('PRIVATE_MODEL_ERROR'));
        const upload = Promise.withResolvers<string>();
        const uploadStarted = Promise.withResolvers<void>();
        const processing = Promise.withResolvers<ArtifactProcessingResult>();
        wallet.store.LearnCloud.uploadEncrypted.mockImplementationOnce(() => {
            uploadStarted.resolve();
            return upload.promise;
        });
        const artifact = rawArtifact('delayed-original');
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            void result.current
                .retryFileExtraction(artifact, UploadTypesEnum.Certificate)
                .then(processing.resolve, processing.reject);
            await uploadStarted.promise;
        });
        expect(result.current.fileUploadOutcomes).toMatchObject([
            { artifact: { id: artifact.id }, status: 'saving_original', extractedCount: 0 },
        ]);
        expect(result.current.isSaving).toBe(true);
        expect(records.has(artifact.id)).toBe(false);
        await act(async () => {
            upload.resolve(`original:${artifact.id}`);
            await processing.promise;
        });
        expect(result.current.fileUploadOutcomes).toMatchObject([
            { artifact: { id: artifact.id }, status: 'extraction_failed', extractedCount: 0 },
        ]);
        expect(result.current.isSaving).toBe(false);
        expect(records.get(artifact.id)?.uri).toBe(`original:${artifact.id}`);
    });

    it('optimistically clears one document and rolls back without affecting other files', async () => {
        uploadMutationMock.mockRejectedValue(new Error('PRIVATE_MODEL_ERROR'));
        const first = rawArtifact('deleted-document', 'resume.pdf');
        const second = rawArtifact('remaining-document', 'resume.pdf');
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await result.current.retryFileExtraction(first, UploadTypesEnum.Certificate);
            await result.current.retryFileExtraction(second, UploadTypesEnum.Certificate);
        });
        expect(result.current.fileUploadOutcomes.map(item => item.artifact.id)).toEqual([
            first.id,
            second.id,
        ]);
        let restoreOutcome: (() => void) | undefined;
        await act(async () => {
            restoreOutcome = result.current.clearFileUploadOutcome(first.id);
        });
        expect(result.current.fileUploadOutcomes).toMatchObject([
            { artifact: { id: second.id }, status: 'extraction_failed' },
        ]);
        expect(records.get(second.id)?.uri).toBe(`original:${second.id}`);
        const third = rawArtifact('new-document', 'resume.pdf');
        await act(async () => {
            await result.current.retryFileExtraction(third, UploadTypesEnum.Certificate);
        });
        await act(async () => {
            restoreOutcome?.();
            restoreOutcome?.();
        });
        expect(result.current.fileUploadOutcomes.map(item => item.artifact.id)).toEqual([
            second.id,
            third.id,
            first.id,
        ]);
    });

    it('preserves an original without model work when AI is disabled', async () => {
        testState.aiEnabled = false;
        const { result } = renderHook(() => useUploadFile(UploadTypesEnum.Certificate));
        await act(async () => {
            await result.current.retryFileExtraction(
                rawArtifact('disabled'),
                UploadTypesEnum.Certificate
            );
        });
        expect(uploadMutationMock).not.toHaveBeenCalled();
        expect(records.has('disabled')).toBe(true);
        expect(result.current.fileUploadOutcomes[0].status).toBe('extraction_failed');
    });

    it('keeps a saved-original receipt after review closes without replacing another resume', async () => {
        const artifact = rawArtifact('historical-resume');
        uploadMutationMock.mockResolvedValue({
            vcs: [parsedDraft(unsignedDraft('historical-draft'))],
            processing: { outcome: 'success', credentialCount: 1 },
        });
        const initial = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
        await act(async () => {
            await initial.result.current.retryFileExtraction(
                artifact,
                UploadTypesEnum.Resume,
                'historical-original'
            );
        });
        const pending = testState.pending.resume!;
        initial.unmount();
        records.set('resume-index', {
            id: 'resume-index',
            uri: 'other-original',
            category: 'resume',
        });
        documents.set('other-original', rawArtifact('other-resume'));
        const restored = renderHook(() => useUploadFile(UploadTypesEnum.Resume));
        await act(async () => {
            restored.result.current.setParsedCredentials(pending.credentials);
        });
        await act(async () => {
            await restored.result.current.storeSelectedCredentials(
                pending.credentials.map(entry => entry.vc),
                pending.rawArtifact,
                UploadTypesEnum.Resume
            );
        });
        expect(records.get('resume-index')?.uri).toBe('other-original');
        expect(savedCredentials.has('historical-draft')).toBe(true);
        expect(wallet.store.LearnCloud.uploadEncrypted).not.toHaveBeenCalled();
        expect(wallet.index.LearnCloud.update).not.toHaveBeenCalled();
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

    it('preserves attachment bytes and file identity without a public file URL', () => {
        const credential = addCertificateAttachment(
            { '@context': ['https://www.w3.org/2018/credentials/v1'] },
            rawArtifactCredential
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
