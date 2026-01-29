import {
    ActionHandler,
    ActionHandlers,
    ActionContext,
    RequestIdentityPayload,
    RequestConsentPayload,
    SendCredentialPayload,
    AskCredentialSpecificPayload,
    AskCredentialSearchPayload,
    VerifiablePresentationRequest,
    LaunchFeaturePayload,
    AppEvent,
} from './useLearnCardPostMessage';

// Re-export types for convenience
export type { ActionHandler, ActionHandlers };

// ============================================================================
// Action Handler Implementations
// ============================================================================

/**
 * REQUEST_IDENTITY Handler
 * Partner needs the user's delegated SSO token.
 */
export const createRequestIdentityHandler = (dependencies: {
    isUserAuthenticated: () => boolean;
    mintDelegatedToken: (challenge?: string) => Promise<string>;
    getUserInfo: () => Promise<{ did: string; profile: any }>;
    showLoginConsentModal: (origin: string, appName?: string) => Promise<boolean>;
}): ActionHandler<'REQUEST_IDENTITY'> => {
    return async ({ payload, origin }) => {
        const { isUserAuthenticated, mintDelegatedToken, getUserInfo, showLoginConsentModal } =
            dependencies;

        // Check if user is logged in
        if (!isUserAuthenticated()) {
            return {
                success: false,
                error: {
                    code: 'LC_UNAUTHENTICATED',
                    message: 'User is not authenticated in LearnCard',
                },
            };
        }

        try {
            // Check if user has consented to share identity with this origin
            const consented = await showLoginConsentModal(origin, payload.appName);

            if (!consented) {
                return {
                    success: false,
                    error: {
                        code: 'USER_REJECTED',
                        message: 'User rejected identity sharing',
                    },
                };
            }

            // Mint a short-lived JWT token
            const token = await mintDelegatedToken(payload.challenge);
            const user = await getUserInfo();

            return {
                success: true,
                data: {
                    token,
                    user,
                    expiresIn: 3600, // Could be configurable
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to mint token',
                },
            };
        }
    };
};

/**
 * Response from showConsentModal
 */
export interface ConsentModalResult {
    granted: boolean;
}

/**
 * REQUEST_CONSENT Handler
 * Partner needs general user permission via a consent contract.
 */
export const createRequestConsentHandler = (dependencies: {
    showConsentModal: (
        contractUri: string,
        options?: { redirect?: boolean }
    ) => Promise<ConsentModalResult>;
}): ActionHandler<'REQUEST_CONSENT'> => {
    return async ({ payload }) => {
        const { showConsentModal } = dependencies;

        if (!payload.contractUri) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Contract URI is required',
                },
            };
        }

        try {
            const result = await showConsentModal(payload.contractUri, {
                redirect: payload.redirect,
            });

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to process consent',
                },
            };
        }
    };
};

/**
 * SEND_CREDENTIAL Handler
 * Partner wants to send a credential to the user.
 */
export const createSendCredentialHandler = (dependencies: {
    showCredentialAcceptanceModal: (credential: any) => Promise<string | boolean>;
}): ActionHandler<'SEND_CREDENTIAL'> => {
    return async ({ payload }) => {
        const { showCredentialAcceptanceModal } = dependencies;

        if (!payload.credential) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Credential is required',
                },
            };
        }

        try {
            // Ask user if they want to accept the credential
            const acceptedId = await showCredentialAcceptanceModal(payload.credential);

            if (!acceptedId) {
                return {
                    success: false,
                    error: {
                        code: 'USER_REJECTED',
                        message: 'User rejected the credential',
                    },
                };
            }

            // This is handled by showCredentialAcceptanceModal
            // // Save credential to wallet
            // const credentialId = await saveCredential(payload.credential);

            return {
                success: true,
                data: {
                    credentialId: acceptedId,
                    stored: true,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to save credential',
                },
            };
        }
    };
};

/**
 * ASK_CREDENTIAL_SPECIFIC Handler
 * Partner needs a specific credential by ID.
 */
export const createAskCredentialSpecificHandler = (dependencies: {
    getCredentialById: (id: string) => Promise<any | null>;
    showShareCredentialModal: (credential: any) => Promise<boolean>;
    signPresentation: (presentation: any) => Promise<any>;
}): ActionHandler<'ASK_CREDENTIAL_SPECIFIC'> => {
    return async ({ payload }) => {
        const { getCredentialById, showShareCredentialModal, signPresentation } = dependencies;

        if (!payload.credentialId) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Credential ID is required',
                },
            };
        }

        try {
            // Fetch credential from wallet
            const credential = await getCredentialById(payload.credentialId);

            if (!credential) {
                return {
                    success: false,
                    error: {
                        code: 'CREDENTIAL_NOT_FOUND',
                        message: `Credential with ID ${payload.credentialId} not found`,
                    },
                };
            }

            // Show share confirmation modal
            const userConsented = await showShareCredentialModal(credential);

            if (!userConsented) {
                return {
                    success: false,
                    error: {
                        code: 'USER_REJECTED',
                        message: 'User rejected sharing the credential',
                    },
                };
            }

            // Sign and package the credential
            const signedCredential = await signPresentation(credential);

            return {
                success: true,
                data: {
                    credential: signedCredential,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message:
                        error instanceof Error ? error.message : 'Failed to retrieve credential',
                },
            };
        }
    };
};

/**
 * ASK_CREDENTIAL_SEARCH Handler
 * Partner needs credentials matching certain criteria via a VPR.
 */
export const createAskCredentialSearchHandler = (dependencies: {
    showVprModal: (verifiablePresentationRequest: VerifiablePresentationRequest) => Promise<any>;
}): ActionHandler<'ASK_CREDENTIAL_SEARCH'> => {
    return async ({ payload }) => {
        const { showVprModal } = dependencies;

        if (!payload.verifiablePresentationRequest) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Verifiable Presentation Request is required',
                },
            };
        }

        try {
            // Show VPR modal and let user select credentials
            const verifiablePresentation = await showVprModal(
                payload.verifiablePresentationRequest
            );

            if (!verifiablePresentation) {
                return {
                    success: false,
                    error: {
                        code: 'USER_REJECTED',
                        message: 'User did not select any credentials to share',
                    },
                };
            }

            // Return the signed VP
            return {
                success: true,
                data: {
                    verifiablePresentation,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to process credential request',
                },
            };
        }
    };
};

/**
 * LAUNCH_FEATURE Handler
 * Partner wants to navigate the user to a specific feature in the LearnCard app.
 */
export const createLaunchFeatureHandler = (dependencies: {
    navigate: (path: string, params?: Record<string, string>) => void;
}): ActionHandler<'LAUNCH_FEATURE'> => {
    return async ({ payload }) => {
        const { navigate } = dependencies;

        if (!payload.featurePath) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Feature path is required',
                },
            };
        }

        try {
            navigate(payload.featurePath, payload.params);

            return {
                success: true,
                data: {
                    launched: true,
                    featurePath: payload.featurePath,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to launch feature',
                },
            };
        }
    };
};

/**
 * INITIATE_TEMPLATE_ISSUE Handler
 * Partner prompts user to issue a boost template they manage.
 */
export const createInitiateTemplateIssueHandler = (dependencies: {
    showBoostIssueModal: (templateId: string, draftRecipients?: string[]) => Promise<boolean>;
    canUserIssueTemplate: (templateId: string) => Promise<boolean>;
}): ActionHandler<'INITIATE_TEMPLATE_ISSUE'> => {
    return async ({ payload }) => {
        const { showBoostIssueModal, canUserIssueTemplate } = dependencies;

        if (!payload.templateId) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PAYLOAD',
                    message: 'Template ID is required',
                },
            };
        }

        try {
            // Verify user has canIssue permission for this template
            // This covers: admin status, explicit canIssue permission, or defaultPermissions.canIssue
            const canIssue = await canUserIssueTemplate(payload.templateId);

            if (!canIssue) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User does not have permission to issue this template',
                    },
                };
            }

            // Show the boost issue modal
            const completed = await showBoostIssueModal(
                payload.templateId,
                payload.draftRecipients
            );

            return {
                success: true,
                data: {
                    issued: completed,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to initiate template issue',
                },
            };
        }
    };
};

/**
 * APP_EVENT Handler
 * Generic event handler for backend-like operations from installed apps.
 */
export const createAppEventHandler = (dependencies: {
    sendAppEvent: (listingId: string, event: AppEvent) => Promise<Record<string, unknown>>;
    getAppListingId: () => string | undefined;
}): ActionHandler<'APP_EVENT'> => {
    return async ({ payload }) => {
        const { sendAppEvent, getAppListingId } = dependencies;

        const listingId = getAppListingId();
        if (!listingId) {
            return {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'App listing ID not available' },
            };
        }

        try {
            const result = await sendAppEvent(listingId, payload);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'UNKNOWN_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to process app event',
                },
            };
        }
    };
};

/**
 * Factory function to create all handlers with dependencies
 */
export function createActionHandlers(dependencies: {
    // Identity
    isUserAuthenticated: () => boolean;
    mintDelegatedToken: (challenge?: string) => Promise<string>;
    getUserInfo: () => Promise<{ did: string; profile: any }>;
    showLoginConsentModal: (origin: string, appName?: string) => Promise<boolean>;

    // Consent
    showConsentModal: (
        contractUri: string,
        options?: { redirect?: boolean }
    ) => Promise<ConsentModalResult>;

    // Credentials
    showCredentialAcceptanceModal: (credential: any) => Promise<string | boolean>;
    saveCredential: (credential: any) => Promise<string | undefined>;
    getCredentialById: (id: string) => Promise<any | null>;
    showShareCredentialModal: (credential: any) => Promise<boolean>;
    showVprModal: (verifiablePresentationRequest: VerifiablePresentationRequest) => Promise<any>;
    signCredential: (credential: any) => Promise<any>;
    signPresentation: (presentation: any) => Promise<any>;

    // Navigation
    navigate: (path: string, params?: Record<string, string>) => void;

    // Boost template issuing
    showBoostIssueModal: (templateId: string, draftRecipients?: string[]) => Promise<boolean>;
    canUserIssueTemplate: (templateId: string) => Promise<boolean>;

    // App events
    sendAppEvent?: (listingId: string, event: AppEvent) => Promise<Record<string, unknown>>;
    getAppListingId?: () => string | undefined;
}): ActionHandlers {
    const handlers: ActionHandlers = {
        REQUEST_IDENTITY: createRequestIdentityHandler(dependencies),
        REQUEST_CONSENT: createRequestConsentHandler(dependencies),
        SEND_CREDENTIAL: createSendCredentialHandler(dependencies),
        ASK_CREDENTIAL_SPECIFIC: createAskCredentialSpecificHandler(dependencies),
        ASK_CREDENTIAL_SEARCH: createAskCredentialSearchHandler(dependencies),
        LAUNCH_FEATURE: createLaunchFeatureHandler(dependencies),
        INITIATE_TEMPLATE_ISSUE: createInitiateTemplateIssueHandler(dependencies),
    };

    // Add APP_EVENT handler if dependencies are provided
    if (dependencies.sendAppEvent && dependencies.getAppListingId) {
        handlers.APP_EVENT = createAppEventHandler({
            sendAppEvent: dependencies.sendAppEvent,
            getAppListingId: dependencies.getAppListingId,
        });
    }

    return handlers;
}
