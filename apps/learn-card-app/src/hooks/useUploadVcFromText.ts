import { VC, VCValidator } from '@learncard/types';
import { useWallet, CredentialCategory } from 'learn-card-base';
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

export const useUploadVcFromText = () => {
    const { initWallet } = useWallet();

    const validateTextVC = (vcText: string) => {
        if (!vcText) return undefined;

        // validate JSON string or object
        let rawCredential: any;
        if (typeof vcText === 'string') {
            rawCredential = vcText;
        } else if (typeof vcText === 'object') {
            rawCredential = JSON.stringify(vcText);
        }

        try {
            const vcValidation = VCValidator.safeParse(JSON.parse(rawCredential));
            if (vcValidation.error) {
                const flattened = vcValidation.error.flatten();
                const fieldErrors = Object.entries(flattened.fieldErrors).flatMap(
                    ([field, errors]) => (errors || []).map(error => `${field}: ${error}`)
                );
                const formErrors = flattened.formErrors || [];
                const allErrors = [...fieldErrors, ...formErrors].filter(Boolean) as string[];

                return allErrors;
            }
        } catch (error: any) {
            return [error.message];
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
                            error: `Failed to add credential to index: ${error.message}`,
                            category,
                            fileInfo: fileInfo || {},
                        };
                    }
                }
            } catch (error: any) {
                return {
                    success: false,
                    error: `Failed to upload credential: ${error.message}`,
                    category,
                    fileInfo: fileInfo || {},
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Invalid credential format: ${error.message}`,
                fileInfo: fileInfo || {},
            };
        }
    };

    const uploadVcFromTextAndAddToWallet = async (input: VC | string) => {
        const wallet = await initWallet();

        try {
            // Handle both raw VCs and JSON strings
            let rawCredential: any;
            if (typeof input === 'string') {
                try {
                    rawCredential = JSON.parse(input);
                } catch {
                    // not valid JSON string
                }
            } else if (typeof input === 'object') {
                rawCredential = input; // already parsed
            }

            const errors = validateTextVC(rawCredential);
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
                        storedVC = await wallet.index.LearnCloud.add({
                            id: crypto.randomUUID(),
                            uri: credentialUri,
                            category,
                        });

                        return {
                            success: true,
                            credentialUri,
                            storedVC,
                            category,
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: `Failed to add credential to index: ${error?.message}`,
                            category,
                        };
                    }
                }
            } catch (error: any) {
                return {
                    success: false,
                    error: `Failed to upload credential: ${error?.message}`,
                    category,
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: `Invalid credential format: ${error?.message}`,
            };
        }
    };

    return { uploadVcFromText, validateTextVC, uploadVcFromTextAndAddToWallet };
};
