import { VCValidator } from '@learncard/types';
import { useQueryClient } from '@tanstack/react-query';
import {
    useWallet,
    CredentialCategory,
    invalidateCredentialIndexQueries,
    switchedProfileStore,
} from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

export interface FileInfo {
    name?: string;
    size?: number;
    type?: string;
}

// Define the type for the stored VC returned from wallet.index.LearnCloud.add
export interface StoredVC {
    id: string;
    uri: string;
    category: CredentialCategory;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    uploadType?: string;
}

export interface UploadResult {
    success: boolean;
    credentialUri?: string;
    storedVC?: StoredVC;
    category?: CredentialCategory;
    fileInfo?: FileInfo;
    error?: string;
}

export interface UploadOptions {
    fileInfo?: FileInfo;
    id?: string;
    uploadType?: string;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const useUploadVcFromText = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    // Direct index writes must refresh the cached list walk; it stays fresh for minutes (LC-2412).
    const invalidateCredentialList = () =>
        queryClient.invalidateQueries({
            queryKey: ['useGetCredentialList', switchedProfileStore.get.switchedDid() ?? ''],
        });

    const validateTextVC = (vcText: string) => {
        if (!vcText) return undefined;
        try {
            const vcValidation = VCValidator.safeParse(JSON.parse(vcText));
            if (vcValidation.error) {
                const flattened = vcValidation.error.flatten();
                const fieldErrors = Object.entries(flattened.fieldErrors).flatMap(
                    ([field, errors]) => (errors || []).map(error => `${field}: ${error}`)
                );
                const formErrors = flattened.formErrors || [];
                const allErrors = [...fieldErrors, ...formErrors].filter(Boolean) as string[];

                return allErrors;
            }
        } catch (error: unknown) {
            return [errorMessage(error)];
        }

        return undefined;
    };

    const uploadVcFromText = async (input: string | File, options: UploadOptions = {}) => {
        const { fileInfo, id, uploadType } = options;
        const wallet = await initWallet();
        let text: string;

        try {
            // Handle both string and File inputs
            text = input instanceof File ? await input.text() : input;
            const rawCredential = JSON.parse(text);

            const errors = validateTextVC(text);
            if (errors) {
                return {
                    success: false,
                    error: errors,
                };
            }

            const category = getDefaultCategoryForCredential(rawCredential) as CredentialCategory;

            let credentialUri, storedVC;

            try {
                // Upload the credential to LearnCloud
                credentialUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(rawCredential);

                if (credentialUri) {
                    // Add to index if credentialUri was successfully obtained
                    try {
                        const name =
                            fileInfo?.name ||
                            rawCredential?.name ||
                            rawCredential?.credentialSubject?.achievement?.name ||
                            'JSON Credential';

                        storedVC = await wallet.index.LearnCloud.add({
                            id: id || crypto.randomUUID(),
                            uri: credentialUri,
                            category,
                            fileName: name,
                            fileSize: fileInfo?.size,
                            fileType: fileInfo?.type,
                            uploadType,
                        });
                        void invalidateCredentialList();
                        // Raw imports bypass the add mutations, so refresh index-backed aggregates.
                        // Do not await: the import is done once the index write lands.
                        void invalidateCredentialIndexQueries(
                            queryClient,
                            switchedProfileStore.get.switchedDid()
                        );

                        return {
                            success: true,
                            credentialUri,
                            storedVC,
                            category,
                            fileInfo: fileInfo || {},
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: `Failed to add credential to index: ${errorMessage(error)}`,
                            category,
                            fileInfo: fileInfo || {},
                        };
                    }
                }
            } catch (error: unknown) {
                return {
                    success: false,
                    error: `Failed to upload credential: ${errorMessage(error)}`,
                    category,
                    fileInfo: fileInfo || {},
                };
            }
        } catch (error: unknown) {
            return {
                success: false,
                error: `Invalid credential format: ${errorMessage(error)}`,
                fileInfo: fileInfo || {},
            };
        }
    };

    return { uploadVcFromText, validateTextVC };
};
