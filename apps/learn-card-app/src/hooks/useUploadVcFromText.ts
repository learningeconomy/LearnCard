import { VC, VCValidator } from '@learncard/types';
import { useWallet, CredentialCategory } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { openBadgeV2Plugin } from '@learncard/open-badge-v2-plugin';

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

    const isOpenBadgeV2 = (obj: any) => {
        const ctx = obj?.['@context'];
        if (typeof ctx === 'string' && ctx.includes('openbadges/v2')) return true;
        return false;
    };

    const validateTextVC = (vcText: string) => {
        if (!vcText) return undefined;

        // validate JSON string or object
        let rawCredential: any;
        if (typeof vcText === 'string') {
            rawCredential = vcText;
        } else if (typeof vcText === 'object') {
            rawCredential = JSON.stringify(vcText);
        }

        let parsed: any;
        try {
            parsed = JSON.parse(rawCredential);
        } catch (err: any) {
            return [err.message];
        }

        if (isOpenBadgeV2(parsed)) {
            return undefined;
        }

        try {
            const vcValidation = VCValidator.safeParse(parsed);
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
        // Handle both string and File inputs
        const text = input instanceof File ? await input.text() : input;
        let parsed: any;

        try {
            parsed = JSON.parse(text);
        } catch (err: any) {
            return {
                success: false,
                error: `Invalid JSON format: ${err.message}`,
            };
        }

        if (isOpenBadgeV2(parsed)) {
            // Handle Open Badge V2 flow
            try {
                const walletWithObv2 = await wallet.addPlugin(openBadgeV2Plugin(wallet));
                const newVC = await walletWithObv2.invoke.wrapOpenBadgeV2(parsed);
                const credURI = await walletWithObv2?.store?.LearnCloud?.uploadEncrypted?.(newVC);
                const categoryObvV2 = getDefaultCategoryForCredential(newVC);

                const name =
                    fileInfo?.name ||
                    parsed?.name ||
                    parsed?.badge?.name ||
                    'Open Badge V2 Credential';

                return {
                    success: true,
                    credentialUri: credURI,
                    storedVC: await walletWithObv2.index.LearnCloud.add({
                        id: id || crypto.randomUUID(),
                        uri: credURI,
                        category: categoryObvV2,
                        fileName: name,
                        fileSize: fileInfo?.size,
                        fileType: fileInfo?.type,
                        uploadType,
                    }),
                    category: categoryObvV2,
                    fileInfo: fileInfo || {},
                };
            } catch (err: any) {
                return {
                    success: false,
                    error: `Failed to add Open Badge V2 credential: ${err.message}`,
                    fileInfo: fileInfo || {},
                };
            }
        }

        //Handle regular VC
        try {
            const errors = validateTextVC(parsed);
            if (errors) {
                return {
                    success: false,
                    error: errors,
                };
            }

            const category = getDefaultCategoryForCredential(parsed) as CredentialCategory;

            let credentialUri, storedVC;

            try {
                // Upload the credential to LearnCloud
                credentialUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(parsed);

                if (credentialUri) {
                    // Add to index if credentialUri was successfully obtained
                    try {
                        const name =
                            fileInfo?.name ||
                            parsed?.name ||
                            parsed?.credentialSubject?.achievement?.name ||
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
