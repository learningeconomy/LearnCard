import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuid } from 'uuid';

import {
    checklistStore,
    useUploadFileMutation,
    useWallet,
    // useSyncConsentFlow,
    switchedProfileStore,
    useGetCheckListStatus,
    UploadTypesEnum,
    newCredsStore,
    CredentialCategory,
    useToast,
    useModal,
    ToastTypeEnum,
    getCategoryForCredential,
    useSyncAllCredentialsToContractsMutation,
    categoryMetadata,
} from 'learn-card-base';
import { useAiInsightCredentialMutation } from 'learn-card-base/hooks/useAiInsightCredential';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { useUploadVcFromText } from './useUploadVcFromText';

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

const TYPE_LABEL: Record<UploadTypesEnum, string> = {
    [UploadTypesEnum.Resume]: 'Resume',
    [UploadTypesEnum.Certificate]: 'Certificate',
    [UploadTypesEnum.Diploma]: 'Diploma',
    [UploadTypesEnum.Transcript]: 'Transcript',
    [UploadTypesEnum.RawVC]: 'Credential',
};

const formatTypeLabel = (
    type: UploadTypesEnum,
    { plural = false }: { plural?: boolean } = {}
) => {
    const base = TYPE_LABEL[type] ?? type;
    return plural ? `${base}s` : base;
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

const TOAST_PAUSE_MS = 100;

export const getFileInfo = (file: File) => {
    const match = file.name.match(/\.([0-9a-z]+)(?=[?#])?|(\.)(?:[\w]+)$/i);
    const extension = match?.[1]?.toLowerCase() ?? 'unknown';

    const typeMap: Record<string, string> = {
        pdf: 'PDF',
        txt: 'TXT',
        doc: 'DOC',
        docx: 'DOCX',
        json: 'JSON',
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
    const { mutateAsync: uploadFile } = useUploadFileMutation(uploadType);
    // const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const queryClient = useQueryClient();
    const { refetchCheckListStatus } = useGetCheckListStatus();
    const { presentToast } = useToast();
    const { closeModal } = useModal();
    const syncAll = useSyncAllCredentialsToContractsMutation();
    const aiInsightMutation = useAiInsightCredentialMutation();

    const { uploadVcFromText } = useUploadVcFromText();

    // state for single file upload
    const [file, setFile] = useState<{ type: string; size: string; name: string } | null>(null);
    const [base64Data, setBase64Data] = useState<string>('');
    const [rawArtifactCredential, setRawArtifactCredential] = useState<any>(null);

    // state for multiple file uploads
    const [files, setFiles] = useState<{ type: string; size: string; name: string }[]>([]);
    const [base64Datas, setBase64Datas] = useState<string[]>([]);
    const [rawArtifactCredentials, setRawArtifactCredentials] = useState<any[]>([]);

    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parsedCredentials, setParsedCredentials] = useState<Array<{ vc: any; metadata?: { name?: string; category?: string } }>>([]);

    const fetchNewContractCredentials = () =>
        queryClient.refetchQueries({
            queryKey: ['useSyncConsentFlow', switchedDid ?? ''],
        });

    const getFile = async (event: React.ChangeEvent<HTMLInputElement>, uploadType: string) => {
        try {
            setIsUploading(true);
            setBase64Data('');
            setRawArtifactCredential(null);
            const wallet = await initWallet();
            const walletDid = wallet?.id?.did();
            const file = event.target.files?.[0];

            if (!file || !walletDid) return;

            const fileInfo = getFileInfo(file);
            setFile(fileInfo);

            const base64Data = await toBase64(file);
            if (base64Data) setBase64Data(base64Data);

            const rawArtifactCredential = await createRawArtifactVC(file, walletDid, uploadType);
            setRawArtifactCredential(rawArtifactCredential);
            setIsUploading(false);

            return { fileInfo, rawArtifactCredential };
        } catch (error) {
            setIsUploading(false);
            console.log('getFile::error', error);
        }
    };

    // handles multiple file uploads <input multiple />
    const getFiles = async (
        e: React.ChangeEvent<HTMLInputElement>,
        uploadType: UploadTypesEnum
    ) => {
        try {
            setIsUploading(true);
            setBase64Datas([]);
            setRawArtifactCredentials([]);
            const wallet = await initWallet();
            const walletDid = wallet?.id?.did();
            const files = e.target.files;

            if (!files || !walletDid) return;

            const fileInfos = Array.from(files).map(file => getFileInfo(file));
            setFiles(fileInfos);

            const _base64Datas = await Promise.all(Array.from(files).map(toBase64));
            if (_base64Datas) setBase64Datas(_base64Datas);

            const rawArtifactCredentials = await Promise.all(
                Array.from(files).map(file => createRawArtifactVC(file, walletDid, uploadType))
            );
            setRawArtifactCredentials(rawArtifactCredentials);
            setIsUploading(false);

            return { fileInfos, rawArtifactCredentials };
        } catch (error) {
            setIsUploading(false);
            console.log('getFiles::error', error);
        }
    };

    const getJsonFiles = async (
        event: React.ChangeEvent<HTMLInputElement>,
        onFail?: (error: any) => void
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
            const totalUploads = fileArray.length;
            let failedUploads = 0;

            const results = await Promise.all(
                fileArray.map(async file => {
                    try {
                        const fileInfo = getFileInfo(file);
                        try {
                            const result = (await uploadVcFromText(file, {
                                fileInfo,
                                uploadType,
                            }))!!;

                            if (result.success && result.credentialUri && result.category) {
                                if (!credentialsByCategory[result.category]) {
                                    credentialsByCategory[result.category] = [];
                                }
                                credentialsByCategory[result.category]?.push(result.credentialUri);

                                const storedVC = result.storedVC as { id: string } | undefined;
                                return {
                                    credentialUri: result.credentialUri,
                                    fileInfo,
                                    id: storedVC?.id || crypto.randomUUID(),
                                    category: result.category,
                                };
                            } else {
                                onFail?.(result.error);
                                throw new Error(result.error || 'Failed to upload file');
                            }
                        } catch (err) {
                            console.error('Error uploading file:', err);
                            throw err;
                        }
                    } catch (innerErr) {
                        failedUploads++;
                        console.error('❌ Error processing file:', innerErr);
                        return null;
                    }
                })
            );

            if (Object.keys(credentialsByCategory).length > 0) {
                addNewCreds(credentialsByCategory);
            }

            const categories = Object.keys(credentialsByCategory);
            const filenames = fileArray.map(f => f.name);
            const successCount = totalUploads - failedUploads;

            setTimeout(() => {
                if (failedUploads === 0) {
                    const fileList = formatFileNameList(filenames);
                    const categoryList = formatCategoryList(categories);
                    if (successCount === 1) {
                        presentToast(
                            `Successfully added to ${categoryList}.`,
                            {
                                title: `Credential ${fileList} Successfully Added`,
                                ...SUCCESS_TOAST_OPTIONS,
                            }
                        );
                    } else {
                        presentToast(
                            `Successfully added to ${categoryList}.`,
                            {
                                title: `${successCount} credentials added from ${fileList}`,
                                ...SUCCESS_TOAST_OPTIONS,
                            }
                        );
                    }
                } else if (failedUploads === totalUploads) {
                    presentToast(`All uploads failed. Please try again.`, {
                        title: 'Upload Failed',
                        hasDismissButton: true,
                        type: ToastTypeEnum.Error,
                        hasX: true,
                        duration: 5000,
                    });
                } else {
                    presentToast(
                        `${
                            totalUploads - failedUploads
                        } of ${totalUploads} uploaded. Some files failed.`,
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

            refetchCheckListStatus().catch(err =>
                console.error('refetchCheckListStatus failed', err)
            );
            setIsUploading(false);
            checklistStore.set.updateIsParsing(uploadType, false);

            return results.filter(Boolean);
        } catch (error) {
            setIsUploading(false);
            checklistStore.set.updateIsParsing(uploadType, false);

            let message = `Something went wrong uploading your ${uploadType}.`;
            if (typeof error === 'object' && error !== null && 'message' in error) {
                message = (error as any).message ?? message;
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
            console.error('getJsonFiles::error', error);
        }
    };

    const saveFile = async (rawArtifactCredential: any, uploadType: UploadTypesEnum) => {
        try {
            setIsSaving(true);

            const wallet = await initWallet();
            const vc = await wallet.invoke.issueCredential(rawArtifactCredential);
            const credentialUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(vc);

            const record = await wallet?.index?.LearnCloud?.get({
                category: uploadType,
            });

            const recordUri = record?.[0]?.uri as string;

            // there is only 1 resume stored at any given time
            // so if a resume is already stored, update it
            if (recordUri && uploadType === UploadTypesEnum.Resume) {
                await wallet.index.LearnCloud.update(record?.[0]?.id as string, {
                    uri: credentialUri as string,
                });
            } else {
                await wallet.index.LearnCloud.add({
                    id: uuid(),
                    uri: credentialUri as string,
                    category: uploadType,
                });
            }

            setIsSaving(false);

            return { vc, credentialUri };
        } catch (error) {
            setIsSaving(false);
            console.log('saveFile::error', error);
        }
    };

    /**
     * Parse a single file without storing anything. Call storeSelectedCredentials after user review.
     */
    const fetchParsedCredentials = async (fileType: UploadTypesEnum): Promise<Array<{ vc: any; metadata?: any }>> => {
        try {
            checklistStore.set.updateIsParsing(fileType, true);
            const wallet = await initWallet();
            const did = wallet?.id?.did();
            if (!base64Data) {
                console.warn('fetchParsedCredentials: no file data, call getFile() first');
                checklistStore.set.updateIsParsing(fileType, false);
                return [];
            }
            const vcs = await uploadFile({ did, file: base64Data ?? '', fileType });
            checklistStore.set.updateIsParsing(fileType, false);
            const results = vcs?.vcs ?? [];
            setParsedCredentials(results);
            return results;
        } catch (error) {
            checklistStore.set.updateIsParsing(fileType, false);
            console.error('fetchParsedCredentials::error', error);
            throw error;
        }
    };

    /**
     * Parse multiple files (e.g. transcripts) without storing anything.
     */
    const fetchParsedCredentialsFromFiles = async (fileType: UploadTypesEnum): Promise<Array<{ vc: any; metadata?: any }>> => {
        try {
            checklistStore.set.updateIsParsing(fileType, true);
            const wallet = await initWallet();
            const did = wallet?.id?.did();
            if (!did) throw new Error('Could not get wallet DID');

            const allVcs: Array<{ vc: any; metadata?: any }> = [];
            for (const rawVC of rawArtifactCredentials) {
                const vcs = await uploadFile({ did, file: rawVC?.rawArtifact?.data ?? '', fileType });
                allVcs.push(...(vcs?.vcs ?? []));
            }

            checklistStore.set.updateIsParsing(fileType, false);
            setParsedCredentials(allVcs);
            return allVcs;
        } catch (error) {
            checklistStore.set.updateIsParsing(fileType, false);
            console.error('fetchParsedCredentialsFromFiles::error', error);
            throw error;
        }
    };

    /**
     * Store the raw artifact(s) + only the user-selected VCs. Call after review step.
     * If selectedVcs is empty, only the raw artifact is stored (checklist marks complete, no credentials extracted).
     * If rawArtifactVc is null/undefined, this will throw — ensure getFile() was called first.
     */
    const storeSelectedCredentials = async (
        selectedVcs: any[],
        rawArtifactVc: any,
        fileType: UploadTypesEnum,
        additionalRawArtifacts?: any[]
    ) => {
        try {
            await saveFile(rawArtifactVc, fileType);

            if (additionalRawArtifacts?.length) {
                for (const rac of additionalRawArtifacts) {
                    await saveFile(rac, fileType);
                }
            }

            let recordsByCategory: Partial<Record<CredentialCategory, string[]>> = {};

            if (selectedVcs.length > 0) {
                const wallet = await initWallet();
                const issuedVCs = await Promise.all(
                    selectedVcs.map(async vc => {
                        const issuedVc = await wallet.invoke.issueCredential(vc);
                        const { credentialUri: uri, category } =
                            await storeAndAddVCToWallet(issuedVc);
                        return { uri, category };
                    })
                );

                recordsByCategory = issuedVCs.reduce<Partial<Record<CredentialCategory, string[]>>>(
                    (records, { category, uri }) => {
                        if (!uri) return records;
                        const existing = records[category] ?? [];
                        records[category] = [...existing, uri];
                        return records;
                    },
                    {}
                );

                newCredsStore.set.addNewCreds(recordsByCategory);
            }

            // Background sync — don't block toast on these
            refetchCheckListStatus().catch(err =>
                console.error('refetchCheckListStatus failed', err)
            );
            syncAll.mutate();
            aiInsightMutation.mutate();
            setParsedCredentials([]);

            const totalCredentials = selectedVcs.length;
            const categories = Object.keys(recordsByCategory);
            const filenames = [rawArtifactVc, ...(additionalRawArtifacts ?? [])].map(
                (r: any) => r?.rawArtifact?.fileName
            );
            const fileCount = filenames.filter(Boolean).length;
            const typeLabel = formatTypeLabel(fileType, { plural: fileCount > 1 });
            const fileList = formatFileNameList(filenames);
            const categoryList = formatCategoryList(categories);
            const filesNoun = fileCount > 1 ? 'files are' : 'file is';

            setTimeout(() => {
                if (totalCredentials === 0) {
                    presentToast(
                        `No credentials added. Your ${filesNoun} stored in your wallet.`,
                        {
                            title: `${typeLabel} saved`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                } else {
                    presentToast(
                        `Successfully added to ${categoryList}.`,
                        {
                            title: `${totalCredentials} credential${totalCredentials > 1 ? 's' : ''} parsed from ${fileList}`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                }
            }, TOAST_PAUSE_MS);
        } catch (error) {
            console.error('storeSelectedCredentials::error', error);
            setTimeout(() => {
                presentToast(`Something went wrong saving your credentials.`, {
                    title: 'Error',
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }, 500);
        }
    };

    const parseFile = async (fileType: UploadTypesEnum) => {
        try {
            checklistStore.set.updateIsParsing(fileType, true);
            const wallet = await initWallet();
            const did = wallet?.id?.did();

            const vcs = await uploadFile({ did, file: base64Data ?? '', fileType });

            await saveFile(rawArtifactCredential, fileType);

            let recordsByCategory: Partial<Record<CredentialCategory, string[]>> = {};

            if (vcs?.vcs?.length > 0) {
                const issuedVCs = await Promise.all(
                    vcs.vcs.map(async ({ vc }) => {
                        const issuedVc = await wallet.invoke.issueCredential(vc);
                        const { credentialUri: uri, category } =
                            await storeAndAddVCToWallet(issuedVc);
                        return { uri, category };
                    })
                );

                // Group VCs by category and update the store
                recordsByCategory = issuedVCs.reduce<
                    Partial<Record<CredentialCategory, string[]>>
                >((records, { category, uri }) => {
                    if (!uri) return records;

                    const key = category;
                    const existing = records[key] ?? [];
                    records[key] = [...existing, uri];
                    return records;
                }, {});

                // Update the store with the new credentials
                newCredsStore.set.addNewCreds(recordsByCategory);
            }

            const totalCredentials = vcs?.vcs?.length ?? 0;
            const categories = Object.keys(recordsByCategory);

            // Background sync — don't block toast on these
            refetchCheckListStatus().catch(err =>
                console.error('refetchCheckListStatus failed', err)
            );
            syncAll.mutate();
            aiInsightMutation.mutate();
            checklistStore.set.updateIsParsing(fileType, false);
            closeModal();

            const typeLabel = formatTypeLabel(fileType);
            const filename = rawArtifactCredential?.rawArtifact?.fileName;
            const fileList = formatFileNameList([filename]);
            const categoryList = formatCategoryList(categories);

            setTimeout(() => {
                if (totalCredentials === 0) {
                    presentToast(
                        `No credentials could be extracted from ${fileList}. Your file is stored in your wallet.`,
                        {
                            title: `${typeLabel} saved`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                } else {
                    presentToast(
                        `Successfully added to ${categoryList}.`,
                        {
                            title: `${totalCredentials} credential${totalCredentials > 1 ? 's' : ''} parsed from ${fileList}`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                }
            }, TOAST_PAUSE_MS);
        } catch (error) {
            checklistStore.set.updateIsParsing(fileType, false);
            console.error('handleSaveResume::error', error);
            setTimeout(() => {
                presentToast(`Something went wrong uploading your ${fileType}.`, {
                    title: 'Error',
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }, 500);
        }
    };

    const parseFiles = async (fileType: UploadTypesEnum) => {
        if (!checklistStore.get.isParsing()[fileType]) {
            checklistStore.set.updateIsParsing(fileType, true);
        }

        const total = rawArtifactCredentials.length;
        let settled = 0;

        // Called: Called when a file finishes processing (success or failure).
        // Increments the settled count and resets the parsing state when all files are done.
        const onFileSettled = () => {
            settled += 1;
            if (settled >= total) {
                checklistStore.set.updateIsParsing(fileType, false);
            }
        };

        try {
            const wallet = await initWallet();
            const did = wallet?.id?.did();
            if (!did) throw new Error('Could not get wallet DID');

            const aggregateRecordsByCategory: Partial<Record<CredentialCategory, string[]>> = {};

            // Process files sequentially to avoid race conditions
            for (const rawVC of rawArtifactCredentials) {
                try {
                    const vcs = await uploadFile({
                        did,
                        file: rawVC?.rawArtifact?.data ?? '',
                        fileType,
                    });

                    await saveFile(rawVC, fileType);

                    if (vcs?.vcs?.length > 0) {
                        const issuedVCs = await Promise.all(
                            vcs.vcs.map(async ({ vc }) => {
                                const issuedVc = await wallet.invoke.issueCredential(vc);
                                const { credentialUri: uri, category } =
                                    await storeAndAddVCToWallet(issuedVc);
                                return { uri, category };
                            })
                        );

                        // Group VCs by category and update the store
                        const recordsByCategory = issuedVCs.reduce<
                            Partial<Record<CredentialCategory, string[]>>
                        >((records, { category, uri }) => {
                            if (!uri) return records;

                            const key = category;
                            const existing = records[key] ?? [];
                            records[key] = [...existing, uri];
                            return records;
                        }, {});

                        // Update the store with the new credentials
                        newCredsStore.set.addNewCreds(recordsByCategory);

                        // Merge into aggregate for the toast
                        for (const [cat, uris] of Object.entries(recordsByCategory)) {
                            const existing = aggregateRecordsByCategory[cat as CredentialCategory] ?? [];
                            aggregateRecordsByCategory[cat as CredentialCategory] = [...existing, ...uris];
                        }
                    }

                    onFileSettled();
                } catch (error) {
                    console.error('Error processing file:', error);
                    onFileSettled();
                    // Continue with next file even if one fails
                }
            }

            const allCategoryValues = Object.values(aggregateRecordsByCategory);
            const totalCredentials = allCategoryValues.reduce((sum, uris) => sum + uris.length, 0);
            const categories = Object.keys(aggregateRecordsByCategory);
            const filenames = rawArtifactCredentials.map(r => r?.rawArtifact?.fileName);

            // Background sync — don't block toast on these
            fetchNewContractCredentials().catch(err =>
                console.error('fetchNewContractCredentials failed', err)
            );
            refetchCheckListStatus().catch(err =>
                console.error('refetchCheckListStatus failed', err)
            );
            syncAll.mutate();
            aiInsightMutation.mutate();
            closeModal();

            const fileCount = filenames.filter(Boolean).length;
            const typeLabel = formatTypeLabel(fileType, { plural: fileCount > 1 });
            const fileList = formatFileNameList(filenames);
            const categoryList = formatCategoryList(categories);
            const filesNoun = fileCount > 1 ? 'files are' : 'file is';

            setTimeout(() => {
                if (totalCredentials === 0) {
                    presentToast(
                        `No credentials could be extracted from ${fileList}. Your ${filesNoun} stored in your wallet.`,
                        {
                            title: `${typeLabel} saved`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                } else {
                    presentToast(
                        `Successfully added to ${categoryList}.`,
                        {
                            title: `${totalCredentials} credential${totalCredentials > 1 ? 's' : ''} parsed from ${fileList}`,
                            ...SUCCESS_TOAST_OPTIONS,
                        }
                    );
                }
            }, TOAST_PAUSE_MS);
        } catch (error) {
            console.error('Error in parseFiles:', error);
            checklistStore.set.updateIsParsing(fileType, false);
            setTimeout(() => {
                presentToast(`Something went wrong uploading your ${fileType}.`, {
                    title: 'Error',
                    hasDismissButton: true,
                    type: ToastTypeEnum.Error,
                    hasX: true,
                    duration: 5000,
                });
            }, 500);
            throw error;
        }
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
        saveFile,
        parseFile,
        parseFiles,
        isUploading,
        isSaving,
        parsedCredentials,
        setParsedCredentials,
        fetchParsedCredentials,
        fetchParsedCredentialsFromFiles,
        storeSelectedCredentials,
    };
};

export const createRawArtifactVC = async (file: File, did: string, uploadType: string) => {
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
