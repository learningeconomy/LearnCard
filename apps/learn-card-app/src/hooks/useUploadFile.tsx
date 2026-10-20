import { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

import * as m from '../paraglide/messages.js';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-upload-file');
// Keep retry correlation through manager close/reopen, without retaining document bytes.
const fileExtractionAttempts = new Map<string, FileExtractionAttempt>();

import {
    checklistStore,
    useUploadFileMutation,
    useWallet,
    useAiFeatureGate,
    useGetCheckListStatus,
    UploadTypesEnum,
    newCredsStore,
    CredentialCategory,
    useToast,
    ToastTypeEnum,
    categoryMetadata,
    useSyncAllCredentialsToContractsMutation,
} from 'learn-card-base';
import {
    createFileExtractionAttempt,
    FileExtractionError,
    recordFilePersistenceDiagnostic,
    type FileExtractionAttempt,
} from 'learn-card-base/helpers/fileExtraction';
import { useUploadVcFromText } from './useUploadVcFromText';
import { useAiInsightCredentialMutation } from 'learn-card-base/hooks/useAiInsightCredential';
import type { UnsignedVC } from '@learncard/types';
import {
    FileUploadPersistenceError,
    type ArtifactProcessingResult,
    type FileUploadOutcome,
} from './uploadFile.types';
import type {
    ParsedFileCredential,
    RawArtifactCredential,
} from 'learn-card-base/types/file-extraction';
import { addCertificateAttachment } from './certificateAttachment';

// Weak keys preserve IDs through manager remounts without retaining discarded draft data.
const fileDraftIds = new WeakMap<UnsignedVC, string>();
const getDraftId = (vc: UnsignedVC): string => {
    if (vc.id) return vc.id;
    const existing = fileDraftIds.get(vc);
    if (existing) return existing;
    const id = `urn:uuid:${crypto.randomUUID()}`;
    fileDraftIds.set(vc, id);
    return id;
};

export type RawArtifactType = {
    id: string;
    fileName: string;
    fileSize: string;
    fileType: string;
    type: string;
};

// Helper function to get formatted file size string (e.g., "1.5 MB")
export const getFormattedFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatFileNameList = (filenames: (string | undefined)[]): string => {
    const present = filenames.filter((f): f is string => Boolean(f));
    if (present.length === 0) return '';
    if (present.length === 1) return `"${present[0]}"`;
    if (present.length === 2) return `"${present[0]}" and "${present[1]}"`;
    return `"${present.slice(0, -1).join('", "')}", and "${present[present.length - 1]}"`;
};

const formatCategoryList = (categories: string[]): string => {
    const labels = categories.map(
        c => categoryMetadata[c as keyof typeof categoryMetadata]?.title ?? c
    );
    if (labels.length === 0) return '';
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
};

const SUCCESS_TOAST_OPTIONS = {
    hasDismissButton: true,
    type: ToastTypeEnum.Success,
    hasCheckmark: true,
    autoDismiss: false,
} as const;

const FILE_UPLOAD_ERROR_TOAST_OPTIONS = {
    hasDismissButton: true,
    type: ToastTypeEnum.Error,
    hasX: true,
    duration: 5000,
} as const;

const FILE_CREDENTIAL_SAVE_OPTIONS = { deferContractSync: true };

const TOAST_PAUSE_MS = 100;

// Stable, user-facing copy for inline file errors. Raw parser / validation / storage
// details are logged, never rendered.
const FRIENDLY_FILE_ERROR =
    'We could not add that credential. Please check the file and try again.';

export const getFileInfo = (file: File) => {
    const match = file.name.match(/\.([0-9a-z]+)(?:[?#].*)?$/i);
    const extension = match?.[1]?.toLowerCase() ?? 'unknown';

    const typeMap: Record<string, string> = {
        pdf: 'PDF',
        txt: 'TXT',
        doc: 'DOC',
        docx: 'DOCX',
        json: 'JSON',
        png: 'PNG',
        jpg: 'JPG',
        jpeg: 'JPEG',
        webp: 'WEBP',
    };

    const type = typeMap[extension] || extension.toUpperCase();

    return {
        type,
        size: getFormattedFileSize(file.size),
        name: file.name,
    };
};

export const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const useUploadFile = (uploadType: UploadTypesEnum) => {
    const { initWallet, storeAndAddVCToWallet } = useWallet();
    const { mutateAsync: uploadFile } = useUploadFileMutation();
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const { presentToast } = useToast();
    const syncAll = useSyncAllCredentialsToContractsMutation();
    const aiInsightMutation = useAiInsightCredentialMutation();
    const { isAiEnabled, isLoading: aiGateLoading } = useAiFeatureGate();

    const { uploadVcFromText } = useUploadVcFromText();

    // state for single file upload
    const [file, setFile] = useState<{ type: string; size: string; name: string } | null>(null);
    const [base64Data, setBase64Data] = useState<string>('');
    const [rawArtifactCredential, setRawArtifactCredential] =
        useState<RawArtifactCredential | null>(null);

    // state for multiple file uploads
    const [files, setFiles] = useState<{ type: string; size: string; name: string }[]>([]);
    const [base64Datas, setBase64Datas] = useState<string[]>([]);
    const [rawArtifactCredentials, setRawArtifactCredentials] = useState<RawArtifactCredential[]>(
        []
    );

    const savedArtifactUris = useRef(new Map<string, string>());
    const expectedResumeUris = useRef(new Map<string, string | null>());
    const savedCredentialUris = useRef(
        new Map<string, { uri: string; category: CredentialCategory }>()
    );
    const extractionAttempts = useRef(fileExtractionAttempts);
    const preparedArtifacts = useRef(new Map<string, { vc: unknown; credentialUri: string }>());
    const [fileUploadOutcomes, setFileUploadOutcomes] = useState<FileUploadOutcome[]>([]);
    const extractedCounts = useRef(new Map<string, number>());
    const credentialOrigins = useRef(new Map<string, string>());
    const pendingSelections = useRef(new Map<string, UnsignedVC[]>());
    const inFlightExtractions = useRef(new Map<string, Promise<ArtifactProcessingResult>>());
    const isParsing = checklistStore.useTracked.isParsing()[uploadType];
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingSelection, setIsSavingSelection] = useState(false);
    const [parsedCredentials, setParsedCredentials] = useState<ParsedFileCredential[]>([]);

    const getFile = async (
        event: React.ChangeEvent<HTMLInputElement>,
        uploadType: UploadTypesEnum
    ) => {
        if (
            isUploading ||
            isParsing ||
            isSaving ||
            isSavingSelection ||
            !event.target.files?.length
        )
            return;
        setIsUploading(true);
        setBase64Data('');
        setRawArtifactCredential(null);
        setFile(null);

        try {
            const wallet = await initWallet();
            const walletDid = wallet?.id?.did();
            const file = event.target.files?.[0];

            if (!file || !walletDid) return;

            const fileInfo = getFileInfo(file);

            const rawArtifactCredential = await createRawArtifactVC(file, walletDid, uploadType);
            setParsedCredentials([]);
            setFileUploadOutcomes([]);
            if (uploadType !== UploadTypesEnum.RawVC)
                checklistStore.set.setPendingReview(uploadType, null);
            setFile(fileInfo);
            setBase64Data(rawArtifactCredential.rawArtifact.data);
            setRawArtifactCredential(rawArtifactCredential);

            return { fileInfo, rawArtifactCredential };
        } catch {
            log.error('file.prepare.failed');
            presentToast(m['passport.buildMyLearnCard.uploadError.singleMessage'](), {
                ...FILE_UPLOAD_ERROR_TOAST_OPTIONS,
                title: m['passport.buildMyLearnCard.uploadError.title'](),
            });
        } finally {
            setIsUploading(false);
        }
    };

    // handles multiple file uploads <input multiple />
    const getFiles = async (
        e: React.ChangeEvent<HTMLInputElement>,
        uploadType: UploadTypesEnum
    ) => {
        if (isUploading || isParsing || isSaving || isSavingSelection || !e.target.files?.length)
            return;
        setIsUploading(true);
        setBase64Datas([]);
        setRawArtifactCredentials([]);
        setFiles([]);

        try {
            const wallet = await initWallet();
            const walletDid = wallet?.id?.did();
            const selectedFiles = e.target.files;

            if (!selectedFiles || !walletDid) return;

            const fileArray = Array.from(selectedFiles);
            const uploadResults = await Promise.all(
                fileArray.map(async file => {
                    try {
                        const rawArtifactCredential = await createRawArtifactVC(
                            file,
                            walletDid,
                            uploadType
                        );

                        return {
                            fileInfo: getFileInfo(file),
                            base64Data: rawArtifactCredential.rawArtifact.data,
                            rawArtifactCredential,
                        };
                    } catch (error) {
                        log.error('getFiles::file-error', error);
                        return null;
                    }
                })
            );
            const successfulUploads = uploadResults.filter(result => result !== null);
            const failedCount = fileArray.length - successfulUploads.length;
            const fileInfos = successfulUploads.map(result => result.fileInfo);
            const rawArtifactCredentials = successfulUploads.map(
                result => result.rawArtifactCredential
            );

            if (successfulUploads.length) {
                setParsedCredentials([]);
                setFileUploadOutcomes([]);
                if (uploadType !== UploadTypesEnum.RawVC)
                    checklistStore.set.setPendingReview(uploadType, null);
            }
            setFiles(fileInfos);
            setBase64Datas(successfulUploads.map(result => result.base64Data));
            setRawArtifactCredentials(rawArtifactCredentials);

            if (failedCount > 0) {
                const hadPartialSuccess = successfulUploads.length > 0;
                presentToast(
                    hadPartialSuccess
                        ? failedCount === 1
                            ? m['passport.buildMyLearnCard.uploadError.partialSingleMessage']()
                            : m['passport.buildMyLearnCard.uploadError.partialMultipleMessage']({
                                  count: failedCount,
                              })
                        : m['passport.buildMyLearnCard.uploadError.multipleMessage'](),
                    {
                        ...FILE_UPLOAD_ERROR_TOAST_OPTIONS,
                        title: hadPartialSuccess
                            ? m['passport.buildMyLearnCard.uploadError.partialTitle']()
                            : m['passport.buildMyLearnCard.uploadError.title'](),
                    }
                );
            }

            return { fileInfos, rawArtifactCredentials };
        } catch {
            log.error('file.prepare.failed');
            presentToast(m['passport.buildMyLearnCard.uploadError.multipleMessage'](), {
                ...FILE_UPLOAD_ERROR_TOAST_OPTIONS,
                title: m['passport.buildMyLearnCard.uploadError.title'](),
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getJsonFiles = async (
        event: React.ChangeEvent<HTMLInputElement>,
        onFail?: (errors: string[]) => void
    ) => {
        try {
            setIsUploading(true);
            checklistStore.set.updateIsParsing(uploadType, true);
            const addNewCreds = newCredsStore.set.addNewCreds;

            const wallet = await initWallet();
            const walletDid = wallet?.id?.did();
            const files = event.target.files;

            if (!files?.length || !walletDid) return;

            const fileArray = Array.from(files);
            const credentialsByCategory: Partial<Record<CredentialCategory, string[]>> = {};
            let filesWithFailures = 0;
            let addedTotal = 0;
            let failedTotal = 0;

            const nestedResults = await Promise.all(
                fileArray.map(async file => {
                    const fileInfo = getFileInfo(file);
                    try {
                        const aggregate = await uploadVcFromText(file, {
                            fileInfo,
                            uploadType,
                        });
                        if (!aggregate) throw new Error('Credential import did not complete.');

                        addedTotal += aggregate.addedCount;
                        failedTotal += aggregate.failedCount;
                        if (aggregate.failedCount > 0 || aggregate.addedCount === 0)
                            filesWithFailures += 1;

                        const entries = aggregate.results
                            .filter(r => r.success && r.credentialUri && r.category)
                            .map(r => {
                                if (!credentialsByCategory[r.category!]) {
                                    credentialsByCategory[r.category!] = [];
                                }
                                credentialsByCategory[r.category!]?.push(r.credentialUri!);

                                const storedVC = r.storedVC as { id: string } | undefined;
                                return {
                                    credentialUri: r.credentialUri!,
                                    fileInfo,
                                    id: storedVC?.id || crypto.randomUUID(),
                                    category: r.category!,
                                };
                            });

                        // Only surface inline file errors when nothing was added from this
                        // file. On partial success the summary toast already reports failures,
                        // so avoid double-signaling (inline error box + toast). Keep the raw
                        // reasons in logs; show stable friendly copy in the UI.
                        if (aggregate.errors.length > 0 && aggregate.addedCount === 0) {
                            log.error('File VC upload failed', aggregate.errors);
                            onFail?.([FRIENDLY_FILE_ERROR]);
                        }

                        return entries;
                    } catch (err) {
                        failedTotal += 1;
                        filesWithFailures += 1;
                        log.error('❌ Error processing file:', err);
                        onFail?.([FRIENDLY_FILE_ERROR]);
                        return [];
                    }
                })
            );

            const results = nestedResults.flat();

            if (Object.keys(credentialsByCategory).length > 0) {
                addNewCreds(credentialsByCategory);
            }

            const categories = Object.keys(credentialsByCategory);
            const filenames = fileArray.map(f => f.name);
            const successCount = addedTotal;

            setTimeout(() => {
                if (failedTotal === 0 && filesWithFailures === 0) {
                    const fileList = formatFileNameList(filenames);
                    const categoryList = formatCategoryList(categories);
                    if (successCount === 1) {
                        presentToast(`Successfully added to ${categoryList}.`, {
                            title: `Credential ${fileList} Successfully Added`,
                            ...SUCCESS_TOAST_OPTIONS,
                        });
                    } else {
                        presentToast(`Successfully added to ${categoryList}.`, {
                            title: `${successCount} credentials added from ${fileList}`,
                            ...SUCCESS_TOAST_OPTIONS,
                        });
                    }
                } else if (addedTotal === 0) {
                    presentToast(`All uploads failed. Please try again.`, {
                        title: 'Upload Failed',
                        hasDismissButton: true,
                        type: ToastTypeEnum.Error,
                        hasX: true,
                        duration: 5000,
                    });
                } else {
                    presentToast(
                        `${addedTotal} credential${
                            addedTotal === 1 ? '' : 's'
                        } added. Some credentials failed.`,
                        {
                            title: 'Partial Upload',
                            hasDismissButton: true,
                            type: ToastTypeEnum.Error,
                            hasX: true,
                            duration: 5000,
                        }
                    );
                }
            }, TOAST_PAUSE_MS);

            refetchCheckListStatus().catch(err => log.error('refetchCheckListStatus failed', err));
            setIsUploading(false);
            checklistStore.set.updateIsParsing(uploadType, false);

            return results.filter(Boolean);
        } catch (error) {
            setIsUploading(false);
            checklistStore.set.updateIsParsing(uploadType, false);

            let message = `Something went wrong uploading your ${uploadType}.`;
            if (
                typeof error === 'object' &&
                error !== null &&
                'message' in error &&
                typeof error.message === 'string'
            ) {
                message = error.message;
            }

            setTimeout(() => {
                presentToast(message, {
                    title: 'Error',
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }, 500);
            log.error('getJsonFiles::error', error);
        }
    };

    const saveFile = async (
        rawArtifactCredential: RawArtifactCredential,
        uploadType: UploadTypesEnum
    ) => {
        setIsSaving(true);
        try {
            const cacheKey = rawArtifactCredential?.id;
            const cachedUri = cacheKey ? savedArtifactUris.current.get(cacheKey) : undefined;
            if (cachedUri) return { credentialUri: cachedUri };

            const wallet = await initWallet();
            const resumeRecords =
                uploadType === UploadTypesEnum.Resume
                    ? await wallet.index.LearnCloud.get(
                          { category: uploadType },
                          { cache: 'skip-cache' }
                      )
                    : [];
            const currentResume = resumeRecords?.[0];
            if (currentResume?.uri && cacheKey) {
                const currentCredential = await wallet.read.get(currentResume.uri);
                if (currentCredential?.id === cacheKey) {
                    savedArtifactUris.current.set(cacheKey, currentResume.uri);
                    return { credentialUri: currentResume.uri };
                }
            }
            if (cacheKey && uploadType === UploadTypesEnum.Resume) {
                if (
                    expectedResumeUris.current.has(cacheKey) &&
                    expectedResumeUris.current.get(cacheKey) !== (currentResume?.uri ?? null)
                ) {
                    throw new FileUploadPersistenceError(
                        'artifact_save',
                        m['passport.buildMyLearnCard.managers.saveOutcomeError']()
                    );
                }
                expectedResumeUris.current.set(cacheKey, currentResume?.uri ?? null);
            }

            const recordId = cacheKey ?? uuid();
            const existingRecord =
                uploadType === UploadTypesEnum.Resume
                    ? undefined
                    : (
                          await wallet.index.LearnCloud.get(
                              { id: recordId },
                              { cache: 'skip-cache' }
                          )
                      )?.[0];
            if (existingRecord?.uri) {
                if (cacheKey) savedArtifactUris.current.set(cacheKey, existingRecord.uri);
                return { credentialUri: existingRecord.uri };
            }

            let prepared = cacheKey ? preparedArtifacts.current.get(cacheKey) : undefined;
            if (!prepared) {
                const vc = await wallet.invoke.issueCredential(rawArtifactCredential);
                const credentialUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(vc);
                if (!credentialUri) throw new Error('The uploaded document could not be saved.');
                prepared = { vc, credentialUri };
                if (cacheKey) preparedArtifacts.current.set(cacheKey, prepared);
            }
            const indexed =
                currentResume?.uri && uploadType === UploadTypesEnum.Resume
                    ? await wallet.index.LearnCloud.update(currentResume.id, {
                          uri: prepared.credentialUri,
                      })
                    : await wallet.index.LearnCloud.add({
                          id: recordId,
                          uri: prepared.credentialUri,
                          category: uploadType,
                      });
            if (indexed !== true) throw new Error('The uploaded document could not be indexed.');
            if (cacheKey) savedArtifactUris.current.set(cacheKey, prepared.credentialUri);
            const attempt = cacheKey ? extractionAttempts.current.get(cacheKey) : undefined;
            if (attempt)
                recordFilePersistenceDiagnostic({
                    attempt,
                    fileType: uploadType,
                    outcome: 'success',
                    stage: 'artifact_save',
                    extractedCount: cacheKey ? (extractedCounts.current.get(cacheKey) ?? 0) : 0,
                    selectedCount: 0,
                    storedCount: 0,
                });
            return { vc: prepared.vc, credentialUri: prepared.credentialUri };
        } catch (error) {
            log.error('file.artifact_save.failed');
            const key = rawArtifactCredential?.id;
            const attempt = key ? extractionAttempts.current.get(key) : undefined;
            if (attempt)
                recordFilePersistenceDiagnostic({
                    attempt,
                    fileType: uploadType,
                    outcome: 'failed',
                    stage: 'artifact_save',
                    extractedCount: key ? (extractedCounts.current.get(key) ?? 0) : 0,
                    selectedCount: 0,
                    storedCount: 0,
                });
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const storeSelectedCredentials = async (
        selectedVcs: UnsignedVC[],
        rawArtifactVc: RawArtifactCredential | null | undefined,
        fileType: UploadTypesEnum,
        additionalRawArtifacts: RawArtifactCredential[] = []
    ) => {
        if (!rawArtifactVc) throw new Error('Uploaded document is unavailable.');
        setIsSavingSelection(true);
        try {
            const restoredCounts: Record<string, number> = {};
            for (const entry of parsedCredentials) {
                const artifactId = entry.artifactId ?? rawArtifactVc.id;
                credentialOrigins.current.set(getDraftId(entry.vc), artifactId);
                if (entry.attempt) extractionAttempts.current.set(artifactId, entry.attempt);
                restoredCounts[artifactId] = (restoredCounts[artifactId] ?? 0) + 1;
            }
            const previousById = new Map(fileUploadOutcomes.map(item => [item.artifact.id, item]));
            const artifacts = [rawArtifactVc, ...additionalRawArtifacts].filter(artifact => {
                const previous = previousById.get(artifact.id);
                if (
                    previous?.status === 'empty' ||
                    (previous?.extractionStatus === 'extraction_failed' &&
                        previous.originalSaved === false)
                ) {
                    return false;
                }
                // Restored reviews may still contain sources with no candidates.
                return !parsedCredentials.length || Object.hasOwn(restoredCounts, artifact.id);
            });
            if (!artifacts.length) {
                return { extractedCount: 0, selectedCount: 0, storedCount: 0, artifactUris: [] };
            }
            const artifactById = new Map(artifacts.map(artifact => [artifact.id, artifact]));
            if (fileType !== UploadTypesEnum.RawVC) {
                for (const receipt of checklistStore.get.pendingReview()[fileType]
                    ?.storedArtifacts ?? []) {
                    if (artifactById.has(receipt.id))
                        savedArtifactUris.current.set(receipt.id, receipt.uri);
                }
            }
            const failures = new Map<string, 'artifact_save' | 'credential_save'>();
            const artifactUris: string[] = [];
            const credentialsByCategory: Partial<Record<CredentialCategory, string[]>> = {};
            const selectedByArtifact: Record<string, number> = {};
            const storedByArtifact: Record<string, number> = {};
            const selectedDrafts: UnsignedVC[] = [];
            for (const artifact of artifacts) pendingSelections.current.set(artifact.id, []);
            for (const vc of selectedVcs) {
                const key = getDraftId(vc);
                const artifactId = credentialOrigins.current.get(key) ?? rawArtifactVc.id;
                if (!artifactById.has(artifactId)) continue;
                const draft = vc.id ? vc : { ...vc, id: key };
                selectedDrafts.push(draft);
                pendingSelections.current.get(artifactId)?.push(draft);
            }
            for (const artifact of artifacts) {
                if (!extractedCounts.current.has(artifact.id)) {
                    extractedCounts.current.set(artifact.id, restoredCounts[artifact.id] ?? 0);
                }
                try {
                    const saved = await saveFile(artifact, fileType);
                    artifactUris.push(saved.credentialUri);
                } catch {
                    failures.set(artifact.id, 'artifact_save');
                }
            }

            const wallet = await initWallet();
            let storedCount = 0;
            for (const vc of selectedDrafts) {
                const key = getDraftId(vc);
                const artifactId = credentialOrigins.current.get(key) ?? rawArtifactVc.id;
                selectedByArtifact[artifactId] = (selectedByArtifact[artifactId] ?? 0) + 1;
                if (failures.get(artifactId) === 'artifact_save') continue;
                try {
                    let stored = savedCredentialUris.current.get(key);
                    if (!stored) {
                        const existing = (
                            await wallet.index.LearnCloud.get<{ category: string }>(
                                { id: key },
                                { cache: 'skip-cache' }
                            )
                        )?.[0];
                        if (existing?.uri) {
                            if (
                                typeof existing.category !== 'string' ||
                                !Object.hasOwn(categoryMetadata, existing.category)
                            ) {
                                throw new Error(
                                    'The saved credential category could not be resolved.'
                                );
                            }
                            stored = {
                                uri: existing.uri,
                                // The key is validated against the registered wallet categories.
                                category: existing.category as CredentialCategory,
                            };
                        } else {
                            const source = artifactById.get(artifactId) ?? rawArtifactVc;
                            const issued = await wallet.invoke.issueCredential(
                                addCertificateAttachment(vc, source)
                            );
                            const saved = await storeAndAddVCToWallet(
                                issued,
                                FILE_CREDENTIAL_SAVE_OPTIONS
                            );
                            if (saved.result !== true || !saved.credentialUri) {
                                throw new Error('A selected credential could not be saved.');
                            }
                            stored = {
                                uri: saved.credentialUri,
                                // The wallet helper derives categories from the registered category map.
                                category: saved.category as CredentialCategory,
                            };
                            credentialsByCategory[stored.category] = [
                                ...(credentialsByCategory[stored.category] ?? []),
                                stored.uri,
                            ];
                        }
                        savedCredentialUris.current.set(key, stored);
                    }
                    storedCount += 1;
                    storedByArtifact[artifactId] = (storedByArtifact[artifactId] ?? 0) + 1;
                } catch {
                    failures.set(artifactId, 'credential_save');
                }
            }

            if (Object.keys(credentialsByCategory).length)
                newCredsStore.set.addNewCreds(credentialsByCategory);
            for (const artifact of artifacts) {
                const attempt = extractionAttempts.current.get(artifact.id);
                if (
                    attempt &&
                    selectedByArtifact[artifact.id] &&
                    failures.get(artifact.id) !== 'artifact_save'
                ) {
                    recordFilePersistenceDiagnostic({
                        attempt,
                        fileType,
                        outcome: failures.has(artifact.id) ? 'failed' : 'success',
                        stage: 'credential_save',
                        extractedCount: extractedCounts.current.get(artifact.id) ?? 0,
                        selectedCount: selectedByArtifact[artifact.id] ?? 0,
                        storedCount: storedByArtifact[artifact.id] ?? 0,
                    });
                }
            }
            setFileUploadOutcomes(current => {
                const previousById = new Map(current.map(item => [item.artifact.id, item]));
                const updates = artifacts.map(artifact => {
                    const previous = previousById.get(artifact.id);
                    const extractedCount = extractedCounts.current.get(artifact.id) ?? 0;
                    const extractionStatus = previous?.extractionStatus;
                    const status: FileUploadOutcome['status'] = failures.has(artifact.id)
                        ? 'save_failed'
                        : extractionStatus === 'extraction_failed'
                          ? 'extraction_failed'
                          : extractionStatus === 'empty'
                            ? 'empty'
                            : 'stored';
                    return {
                        artifact,
                        status,
                        extractionStatus,
                        failureCode: previous?.failureCode,
                        originalSaved: savedArtifactUris.current.has(artifact.id),
                        extractedCount,
                        failedStage: failures.get(artifact.id),
                        selectedCount: selectedByArtifact[artifact.id] ?? 0,
                        storedCount: storedByArtifact[artifact.id] ?? 0,
                        message: failures.has(artifact.id)
                            ? failures.get(artifact.id) === 'artifact_save'
                                ? m['passport.buildMyLearnCard.managers.saveOutcomeError']()
                                : m[
                                      'passport.buildMyLearnCard.managers.credentialSaveOutcomeError'
                                  ]()
                            : undefined,
                    };
                });
                return [...current.filter(item => !artifactById.has(item.artifact.id)), ...updates];
            });
            if (artifactUris.length || storedCount) {
                void refetchCheckListStatus().catch(() =>
                    log.error('file.checklist_refresh.failed')
                );
                // Sharing and insights follow confirmed writes without blocking the save UI.
                void syncAll
                    .mutateAsync()
                    .then(() => aiInsightMutation.mutate())
                    .catch(() => log.error('file.background_sync.failed'));
            }
            if (failures.size) {
                const stage = [...failures.values()].includes('artifact_save')
                    ? 'artifact_save'
                    : 'credential_save';
                throw new FileUploadPersistenceError(
                    stage,
                    stage === 'artifact_save'
                        ? m['passport.buildMyLearnCard.managers.saveOutcomeError']()
                        : m['passport.buildMyLearnCard.managers.credentialSaveOutcomeError']()
                );
            }
            const extractedCount = artifacts.reduce(
                (count, artifact) => count + (extractedCounts.current.get(artifact.id) ?? 0),
                0
            );
            for (const artifact of artifacts) pendingSelections.current.delete(artifact.id);
            setParsedCredentials(current =>
                current.filter(entry => !artifactById.has(entry.artifactId ?? rawArtifactVc.id))
            );
            if (fileType !== UploadTypesEnum.RawVC) {
                const pending = checklistStore.get.pendingReview()[fileType];
                if (pending) {
                    const remaining = pending.credentials.filter(
                        entry => !artifactById.has(entry.artifactId ?? pending.rawArtifact.id)
                    );
                    const sources = [
                        pending.rawArtifact,
                        ...(pending.additionalRawArtifacts ?? []),
                    ].filter(source => remaining.some(entry => entry.artifactId === source.id));
                    checklistStore.set.setPendingReview(
                        fileType,
                        remaining.length && sources[0]
                            ? {
                                  credentials: remaining,
                                  rawArtifact: sources[0],
                                  additionalRawArtifacts: sources.slice(1),
                                  storedArtifacts: pending.storedArtifacts?.filter(receipt =>
                                      sources.some(source => source.id === receipt.id)
                                  ),
                              }
                            : null
                    );
                }
            }
            return {
                extractedCount,
                selectedCount: selectedDrafts.length,
                storedCount,
                artifactUris,
            };
        } finally {
            setIsSavingSelection(false);
        }
    };

    /** Only processing failures preserve originals; empty results and blocked requests stay local. */
    const processArtifact = (
        artifact: RawArtifactCredential,
        fileType: UploadTypesEnum
    ): Promise<ArtifactProcessingResult> => {
        const active = inFlightExtractions.current.get(artifact.id);
        if (active) return active;
        const task = (async (): Promise<ArtifactProcessingResult> => {
            let failureCode: string | undefined;
            try {
                if (aiGateLoading) throw new FileExtractionError('AI_GATE_LOADING');
                if (!isAiEnabled) throw new FileExtractionError('CONSENT_DENIED');
                const previous =
                    extractionAttempts.current.get(artifact.id) ??
                    parsedCredentials.find(entry => entry.artifactId === artifact.id)?.attempt;
                let attempt: FileExtractionAttempt;
                try {
                    attempt = createFileExtractionAttempt(previous);
                } catch {
                    throw new FileExtractionError('INPUT_INVALID');
                }
                extractionAttempts.current.set(artifact.id, attempt);
                if (extractionAttempts.current.size > 200) {
                    const oldest = extractionAttempts.current.keys().next().value;
                    if (oldest) extractionAttempts.current.delete(oldest);
                }
                const wallet = await initWallet();
                const result = await uploadFile({
                    did: wallet.id.did(),
                    file: artifact.rawArtifact.data,
                    fileType,
                    attempt,
                });
                const credentials: ParsedFileCredential[] = result.vcs.map(entry => {
                    const id = getDraftId(entry.vc);
                    const vc = entry.vc.id ? entry.vc : { ...entry.vc, id };
                    credentialOrigins.current.set(id, artifact.id);
                    return { ...entry, vc, artifactId: artifact.id, attempt };
                });
                extractedCounts.current.set(artifact.id, credentials.length);
                return {
                    credentials,
                    outcome: {
                        artifact,
                        status: credentials.length ? 'review' : 'empty',
                        extractionStatus: credentials.length ? 'review' : 'empty',
                        extractedCount: credentials.length,
                        failureCode: credentials.length
                            ? undefined
                            : (result.processing.code ?? 'ZERO_STRUCTURED_ITEMS'),
                        originalSaved: savedArtifactUris.current.has(artifact.id),
                    },
                };
            } catch (error) {
                failureCode = error instanceof FileExtractionError ? error.code : undefined;
            }
            extractedCounts.current.set(artifact.id, 0);
            const originalSaved = savedArtifactUris.current.has(artifact.id);
            if (
                failureCode === 'NO_READABLE_TEXT' ||
                failureCode === 'AI_GATE_LOADING' ||
                failureCode === 'CONSENT_DENIED' ||
                failureCode === 'RESPONSE_INVALID' ||
                failureCode === 'INPUT_INVALID' ||
                failureCode === 'FILE_TOO_LARGE' ||
                failureCode === 'CONTENT_REJECTED'
            ) {
                const extractionStatus =
                    failureCode === 'NO_READABLE_TEXT' ? 'empty' : 'extraction_failed';
                return {
                    credentials: [],
                    outcome: {
                        artifact,
                        status: extractionStatus,
                        extractionStatus,
                        extractedCount: 0,
                        failureCode,
                        originalSaved,
                    },
                };
            }
            setFileUploadOutcomes(current => [
                ...current.filter(item => item.artifact.id !== artifact.id),
                {
                    artifact,
                    status: 'saving_original',
                    extractionStatus: 'extraction_failed',
                    failureCode,
                    originalSaved,
                    extractedCount: 0,
                },
            ]);
            try {
                await saveFile(artifact, fileType);
                return {
                    credentials: [],
                    outcome: {
                        artifact,
                        status: 'extraction_failed',
                        extractionStatus: 'extraction_failed',
                        extractedCount: 0,
                        failureCode,
                        originalSaved: true,
                    },
                };
            } catch {
                return {
                    credentials: [],
                    outcome: {
                        artifact,
                        status: 'save_failed',
                        extractionStatus: 'extraction_failed',
                        failedStage: 'artifact_save',
                        extractedCount: 0,
                        failureCode,
                        originalSaved: savedArtifactUris.current.has(artifact.id),
                        message: m['passport.buildMyLearnCard.managers.saveOutcomeError'](),
                    },
                };
            }
        })().finally(() => {
            inFlightExtractions.current.delete(artifact.id);
        });
        inFlightExtractions.current.set(artifact.id, task);
        return task;
    };

    const processArtifacts = async (
        artifacts: RawArtifactCredential[],
        fileType: UploadTypesEnum
    ): Promise<ParsedFileCredential[]> => {
        checklistStore.set.updateIsParsing(fileType, true);
        try {
            const results: ArtifactProcessingResult[] = [];
            for (const artifact of artifacts) {
                const result = await processArtifact(artifact, fileType);
                results.push(result);
                setFileUploadOutcomes(current => [
                    ...current.filter(item => item.artifact.id !== artifact.id),
                    result.outcome,
                ]);
            }
            const credentials = results.flatMap(result => result.credentials);
            setParsedCredentials(credentials);
            setFileUploadOutcomes(results.map(result => result.outcome));
            if (results.some(result => result.outcome.status === 'extraction_failed')) {
                void refetchCheckListStatus().catch(() =>
                    log.error('file.checklist_refresh.failed')
                );
            }
            return credentials;
        } finally {
            checklistStore.set.updateIsParsing(fileType, false);
        }
    };

    const fetchParsedCredentials = async (
        fileType: UploadTypesEnum
    ): Promise<ParsedFileCredential[]> => {
        if (!rawArtifactCredential) throw new Error('Uploaded document is unavailable.');
        return processArtifacts([rawArtifactCredential], fileType);
    };

    const fetchParsedCredentialsFromFiles = (
        fileType: UploadTypesEnum
    ): Promise<ParsedFileCredential[]> => processArtifacts(rawArtifactCredentials, fileType);

    const retryFileExtraction = async (
        artifact: RawArtifactCredential,
        fileType: UploadTypesEnum,
        savedArtifactUri?: string
    ): Promise<ArtifactProcessingResult> => {
        checklistStore.set.updateIsParsing(fileType, true);
        if (savedArtifactUri) savedArtifactUris.current.set(artifact.id, savedArtifactUri);
        try {
            const result = await processArtifact(artifact, fileType);
            const credentials = [
                ...parsedCredentials.filter(entry => entry.artifactId !== artifact.id),
                ...result.credentials,
            ];
            setParsedCredentials(credentials);
            setFileUploadOutcomes(current => [
                ...current.filter(item => item.artifact.id !== artifact.id),
                result.outcome,
            ]);
            if (result.credentials.length && fileType !== UploadTypesEnum.RawVC) {
                const pending = checklistStore.get.pendingReview()[fileType];
                const candidates = [
                    artifact,
                    ...(pending
                        ? [pending.rawArtifact, ...(pending.additionalRawArtifacts ?? [])]
                        : []),
                    ...rawArtifactCredentials,
                ];
                const needed = new Set(credentials.map(entry => entry.artifactId));
                const sources = [
                    ...new Map(
                        candidates
                            .filter(source => source && needed.has(source.id))
                            .map(source => [source.id, source])
                    ).values(),
                ];
                const [first, ...rest] = sources;
                const storedArtifacts = new Map(
                    (pending?.storedArtifacts ?? []).map(receipt => [receipt.id, receipt.uri])
                );
                for (const [id, uri] of savedArtifactUris.current) {
                    if (needed.has(id)) storedArtifacts.set(id, uri);
                }
                checklistStore.set.setPendingReview(fileType, {
                    credentials,
                    rawArtifact: first,
                    additionalRawArtifacts: rest,
                    storedArtifacts: [...storedArtifacts].map(([id, uri]) => ({ id, uri })),
                });
            }
            if (result.outcome.status !== 'review') {
                void refetchCheckListStatus().catch(() =>
                    log.error('file.checklist_refresh.failed')
                );
            }
            return { credentials, outcome: result.outcome };
        } finally {
            checklistStore.set.updateIsParsing(fileType, false);
        }
    };

    const retryFileSave = async (artifact: RawArtifactCredential, fileType: UploadTypesEnum) => {
        const selection = pendingSelections.current.get(artifact.id);
        if (selection) {
            await storeSelectedCredentials(selection, artifact, fileType);
            return;
        }
        await saveFile(artifact, fileType);
        setFileUploadOutcomes(current =>
            current.map(item =>
                item.artifact.id === artifact.id
                    ? {
                          ...item,
                          status: item.extractionStatus ?? 'empty',
                          failedStage: undefined,
                          originalSaved: true,
                          message: undefined,
                      }
                    : item
            )
        );
        void refetchCheckListStatus().catch(() => log.error('file.checklist_refresh.failed'));
    };

    return {
        file,
        files,
        rawArtifactCredential,
        rawArtifactCredentials,
        base64Data,
        base64Datas,
        getFile,
        getJsonFiles,
        getFiles,
        isUploading,
        isSaving: isSaving || isSavingSelection,
        isParsing,
        parsedCredentials,
        setParsedCredentials,
        fetchParsedCredentials,
        fetchParsedCredentialsFromFiles,
        storeSelectedCredentials,
        fileUploadOutcomes,
        clearFileUploadOutcome: (artifactId: string) => {
            const previous = fileUploadOutcomes.find(item => item.artifact.id === artifactId);
            setFileUploadOutcomes(current =>
                current.filter(item => item.artifact.id !== artifactId)
            );
            // Restore only this outcome if an optimistic deletion fails.
            return () => {
                if (!previous) return;
                setFileUploadOutcomes(current =>
                    current.some(item => item.artifact.id === artifactId)
                        ? current
                        : [...current, previous]
                );
            };
        },
        retryFileExtraction,
        retryFileSave,
    };
};

export const createRawArtifactVC = async (
    file: File,
    did: string,
    uploadType: string
): Promise<RawArtifactCredential> => {
    const { name, type, size } = getFileInfo(file);
    const base64Data = await toBase64(file);

    return {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            {
                id: '@id',
                type: '@type',
                lcn: 'https://docs.learncard.com/definitions#',
                xsd: 'https://www.w3.org/2001/XMLSchema#',
                RawArtifactCredential: {
                    '@id': 'lcn:rawArtifactCredential',
                },
                rawArtifact: {
                    '@id': 'lcn:rawArtifact',
                    '@context': {
                        data: { '@id': 'lcn:rawArtifactData', '@type': 'xsd:string' },
                        type: { '@id': 'lcn:rawArtifactType', '@type': 'xsd:string' },
                        fileName: { '@id': 'lcn:rawArtifactFileName', '@type': 'xsd:string' },
                        fileSize: { '@id': 'lcn:rawArtifactFileSize', '@type': 'xsd:string' },
                        fileType: { '@id': 'lcn:rawArtifactFileType', '@type': 'xsd:string' },
                    },
                },
            },
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'RawArtifactCredential'],
        issuer: did,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
            id: did,
        },
        rawArtifact: {
            type: uploadType,
            fileName: name,
            fileType: type,
            fileSize: size,
            data: base64Data,
        },
    };
};
