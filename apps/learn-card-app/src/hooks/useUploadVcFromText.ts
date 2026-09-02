import { VC, VCValidator } from '@learncard/types';
import { useWallet, CredentialCategory } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { openBadgeV2Plugin } from '@learncard/open-badge-v2-plugin';

import { extractCredentialsFromText } from './extractCredentialsFromText';

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

export interface AggregateUploadResult {
    /** True when at least one credential was added. */
    success: boolean;
    /** Per-credential outcomes, in extraction order (successes and failures). */
    results: UploadResult[];
    addedCount: number;
    failedCount: number;
    /** Flattened failure + extraction messages for display. */
    errors: string[];
}

export const useUploadVcFromText = () => {
    const { initWallet } = useWallet();

    const isOpenBadgeV2 = (obj: any) => {
        const ctx = obj?.['@context'];
        if (typeof ctx === 'string' && ctx.includes('openbadges/v2')) return true;
        return false;
    };

    // Validate a single, already-parsed credential object directly. Does NOT re-extract —
    // callers that hold an object (extracted from a VP, or a bare VC) must use this so a
    // nested `verifiableCredential` field can't cause the object's children to be validated
    // in place of the object itself.
    const validateCredentialObject = (parsed: any): string[] | undefined => {
        if (isOpenBadgeV2(parsed)) return undefined;

        try {
            const vcValidation = VCValidator.safeParse(parsed);
            if (vcValidation.error) {
                const flattened = vcValidation.error.flatten();
                const fieldErrors = Object.entries(flattened.fieldErrors).flatMap(([field, errs]) =>
                    (errs || []).map(error => `${field}: ${error}`)
                );
                const formErrors = flattened.formErrors || [];
                const allErrors = [...fieldErrors, ...formErrors].filter(Boolean) as string[];
                return allErrors.length ? allErrors : ['Invalid credential.'];
            }
        } catch (error: any) {
            return [error.message];
        }

        return undefined;
    };

    // Validate raw text/paste input for the live paste-box feedback. Extracts candidates
    // (unwrapping a VP) and treats the input as valid when at least one candidate validates.
    const validateTextVC = (vcText: string) => {
        if (!vcText) return undefined;

        const rawCredential = typeof vcText === 'string' ? vcText : JSON.stringify(vcText);

        // Resilient extraction first — handles VPs, wrapped VCs, and JSON-in-text.
        const { credentials, errors: extractionErrors } = extractCredentialsFromText(rawCredential);
        if (credentials.length === 0) {
            return extractionErrors.length ? extractionErrors : ['Could not parse credential.'];
        }

        // A VP (or any multi-credential input) is valid as long as one candidate validates.
        for (const parsed of credentials) {
            if (!validateCredentialObject(parsed)) return undefined;
        }

        // None validated — surface the first candidate's errors for a useful message.
        return validateCredentialObject(credentials[0]) ?? ['Invalid credential.'];
    };

    const uploadSingleCredential = async (
        parsed: any,
        options: UploadOptions = {}
    ): Promise<UploadResult> => {
        const { fileInfo, id, uploadType } = options;
        const wallet = await initWallet();

        if (isOpenBadgeV2(parsed)) {
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

        try {
            const errors = validateCredentialObject(parsed);
            if (errors) {
                return {
                    success: false,
                    error: Array.isArray(errors) ? errors.join('; ') : errors,
                };
            }

            const category = getDefaultCategoryForCredential(parsed) as CredentialCategory;

            try {
                const credentialUri = await wallet?.store?.LearnCloud?.uploadEncrypted?.(parsed);

                if (credentialUri) {
                    try {
                        const name =
                            fileInfo?.name ||
                            parsed?.name ||
                            parsed?.credentialSubject?.achievement?.name ||
                            'JSON Credential';

                        const storedVC = await wallet.index.LearnCloud.add({
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
                    } catch (error: any) {
                        return {
                            success: false,
                            error: `Failed to add credential to index: ${error.message}`,
                            category,
                            fileInfo: fileInfo || {},
                        };
                    }
                }

                return {
                    success: false,
                    error: 'Failed to upload credential: no URI returned.',
                    category,
                    fileInfo: fileInfo || {},
                };
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

    const uploadVcFromText = async (
        input: string | File,
        options: UploadOptions = {}
    ): Promise<AggregateUploadResult> => {
        const text = input instanceof File ? await input.text() : input;

        const { credentials, errors: extractionErrors } = extractCredentialsFromText(text);

        if (credentials.length === 0) {
            return {
                success: false,
                results: [],
                addedCount: 0,
                failedCount: 0,
                errors: extractionErrors.length ? extractionErrors : ['No credentials found.'],
            };
        }

        const results: UploadResult[] = [];
        for (const credential of credentials) {
            // Sequential to avoid racing wallet index writes.
            // eslint-disable-next-line no-await-in-loop
            results.push(await uploadSingleCredential(credential, options));
        }

        const addedCount = results.filter(r => r.success).length;
        const failedCount = results.length - addedCount;
        const errors = [
            ...extractionErrors,
            ...(results
                .filter(r => !r.success)
                .map(r => (Array.isArray(r.error) ? r.error.join('; ') : r.error))
                .filter(Boolean) as string[]),
        ];

        return { success: addedCount > 0, results, addedCount, failedCount, errors };
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

            const errors = validateCredentialObject(rawCredential);
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
