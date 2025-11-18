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
    ToastTypeEnum,
} from 'learn-card-base';
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

    const fetchNewContractCredentials = () => {
        queryClient.refetchQueries({
            queryKey: ['useSyncConsentFlow', switchedDid ?? ''],
        });
    };

    const getFile = async (event: React.ChangeEvent<HTMLInputElement>, uploadType: string) => {
        try {
            setIsUploading(true);
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

            setTimeout(() => {
                if (failedUploads === 0) {
                    presentToast(
                        `Your journey is now reflected in portable, trusted credentials.`,
                        {
                            version: 2,
                            title: `${uploadType} Successfully Parsed`,
                            hasDismissButton: true,
                            toastType: ToastTypeEnum.Success,
                            duration: 5000,
                        }
                    );
                } else if (failedUploads === totalUploads) {
                    presentToast(`All uploads failed. Please try again.`, {
                        version: 2,
                        title: 'Upload Failed',
                        hasDismissButton: true,
                        toastType: ToastTypeEnum.Error,
                        duration: 5000,
                    });
                } else {
                    presentToast(
                        `${
                            totalUploads - failedUploads
                        } of ${totalUploads} uploaded. Some files failed.`,
                        {
                            version: 2,
                            title: 'Partial Upload',
                            hasDismissButton: true,
                            toastType: ToastTypeEnum.Error,
                            duration: 5000,
                        }
                    );
                }
            }, 500);

            await refetchCheckListStatus();
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
                    version: 2,
                    title: 'Error',
                    hasDismissButton: true,
                    toastType: ToastTypeEnum.Error,
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

    const parseFile = async (fileType: UploadTypesEnum) => {
        try {
            checklistStore.set.updateIsParsing(fileType, true);
            const wallet = await initWallet();
            const did = wallet?.id?.did();

            const vcs = await uploadFile({ did, file: base64Data ?? '', fileType });

            await saveFile(rawArtifactCredential, fileType);

            if (vcs?.vcs?.length > 0) {
                await Promise.all(
                    vcs.vcs.map(async ({ vc }) => {
                        const issuedVc = await wallet.invoke.issueCredential(vc);
                        return (await storeAndAddVCToWallet(issuedVc)).result;
                    })
                );
            }

            await refetchCheckListStatus();
            checklistStore.set.updateIsParsing(fileType, false);
        } catch (error) {
            checklistStore.set.updateIsParsing(fileType, false);
            console.error('handleSaveResume::error', error);
        }
    };

    const parseFiles = async (fileType: UploadTypesEnum) => {
        if (!checklistStore.get.isParsing()[fileType]) {
            checklistStore.set.updateIsParsing(fileType, true);
        }

        try {
            const wallet = await initWallet();
            const did = wallet?.id?.did();
            if (!did) throw new Error('Could not get wallet DID');

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
                        await Promise.all(
                            vcs.vcs.map(async ({ vc }) => {
                                const issuedVc = await wallet.invoke.issueCredential(vc);
                                return (await storeAndAddVCToWallet(issuedVc)).result;
                            })
                        );
                    }
                } catch (error) {
                    console.error('Error processing file:', error);
                    // Continue with next file even if one fails
                }
            }

            // Only update these if all files were processed
            await fetchNewContractCredentials();
            await refetchCheckListStatus();
        } catch (error) {
            console.error('Error in parseFiles:', error);
            throw error;
        } finally {
            checklistStore.set.updateIsParsing(fileType, false);
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
