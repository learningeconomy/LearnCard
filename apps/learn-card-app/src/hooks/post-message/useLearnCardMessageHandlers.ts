import React, { useMemo, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useIsLoggedIn, useWallet, useModal, ModalTypes } from 'learn-card-base';
import { UnsignedVP } from '@learncard/types';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import { ActionHandlers, AppEvent } from './useLearnCardPostMessage';
import { createActionHandlers } from './useLearnCardPostMessage.handlers';
import FullScreenConsentFlow from '../../pages/consentFlow/FullScreenConsentFlow';

interface LaunchConfig {
    url?: string;
    permissions?: string[];
    [key: string]: unknown;
}

interface UseLearnCardMessageHandlersOptions {
    embedOrigin: string;
    onNavigate?: () => void;
    launchConfig?: LaunchConfig;
    isInstalled?: boolean;
    appId?: string;
    onCredentialIssued?: (credentialUri: string, boostUri?: string) => void;
    debug?: boolean;
}

/**
 * Shared hook for creating LEARNCARD_V1 message handlers.
 * Used by both EmbedIframeModal and EmbedAppFullScreen to ensure consistent behavior.
 */
export function useLearnCardMessageHandlers({
    embedOrigin,
    onNavigate,
    launchConfig,
    isInstalled = false,
    appId,
    onCredentialIssued,
    debug = false,
}: UseLearnCardMessageHandlersOptions): ActionHandlers {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet, storeAndAddVCToWallet } = useWallet();
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const { data: consentedContracts } = useConsentedContracts();

    // Debug logging helper
    const log = useCallback(
        (...args: unknown[]) => {
            if (debug) console.log('[PostMessage]', ...args);
        },
        [debug]
    );

    const logError = useCallback(
        (...args: unknown[]) => {
            if (debug) console.error('[PostMessage]', ...args);
        },
        [debug]
    );

    /**
     * Generate a consent VP and redirect to the contract's redirect URL in a new tab.
     * Returns true if redirect was successful, false otherwise.
     */
    const generateVpAndRedirect = useCallback(
        async (
            wallet: Awaited<ReturnType<typeof initWallet>>,
            contract: { redirectUrl?: string; owner?: { did?: string }; uri?: string }
        ): Promise<boolean> => {
            if (!wallet || !contract.redirectUrl) {
                return false;
            }

            try {
                const urlObj = new URL(contract.redirectUrl);
                urlObj.searchParams.set('did', wallet.id.did());

                if (contract.owner?.did) {
                    const unsignedDelegateCredential = wallet.invoke.newCredential({
                        type: 'delegate',
                        subject: contract.owner.did,
                        access: ['read', 'write'],
                    });

                    const delegateCredential = await wallet.invoke.issueCredential(
                        unsignedDelegateCredential
                    );

                    const unsignedDidAuthVp: UnsignedVP & { contractUri?: string } =
                        await wallet.invoke.newPresentation(delegateCredential);

                    if (contract.uri) {
                        unsignedDidAuthVp.contractUri = contract.uri;
                    }

                    const vp = (await wallet.invoke.issuePresentation(unsignedDidAuthVp, {
                        proofPurpose: 'authentication',
                        proofFormat: 'jwt',
                    })) as unknown as string;

                    urlObj.searchParams.set('vp', vp);
                }

                log('Opening redirect in new tab:', urlObj.toString());
                window.open(urlObj.toString(), '_blank', 'noopener,noreferrer');
                return true;
            } catch (error) {
                logError('Failed to generate VP for redirect:', error);
                return false;
            }
        },
        [log, logError]
    );

    /**
     * Imperative function to show consent flow and return result
     */
    const showConsentFlow = useCallback(
        async (
            contractUri: string,
            options?: { redirect?: boolean }
        ): Promise<{ granted: boolean }> => {
            const { redirect = false } = options ?? {};

            return new Promise(async resolve => {
                try {
                    const wallet = await initWallet();
                    if (!wallet) {
                        logError('Wallet not initialized');
                        resolve({ granted: false });
                        return;
                    }

                    const contract = await wallet.invoke.getContract(contractUri);
                    if (!contract) {
                        logError('Contract not found:', contractUri);
                        resolve({ granted: false });
                        return;
                    }

                    // Check if already consented
                    const consentedContract = consentedContracts?.find(
                        c => c?.contract?.uri === contractUri && c?.status !== 'withdrawn'
                    );

                    const isPostConsent = !!consentedContract;

                    // If already consented, handle redirect if requested
                    if (isPostConsent) {
                        log('User already consented to contract');

                        if (redirect && contract.redirectUrl) {
                            const success = await generateVpAndRedirect(wallet, contract);
                            resolve({ granted: success });
                            return;
                        }

                        resolve({ granted: true });
                        return;
                    }

                    // Not yet consented - show modal
                    const successCallback = () => {
                        log('Consent flow completed');
                        resolve({ granted: true });
                        closeModal();
                    };

                    const handleCancel = () => {
                        log('Consent flow cancelled');
                        resolve({ granted: false });
                    };

                    const consentFlowElement = React.createElement(FullScreenConsentFlow, {
                        contractDetails: contract,
                        isPostConsent: false,
                        hideProfileButton: true,
                        disableRedirect: !redirect,
                        successCallback,
                    });

                    newModal(
                        consentFlowElement,
                        { onClose: handleCancel },
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                    );
                } catch (error) {
                    logError('Failed to fetch consent contract:', error);
                    resolve({ granted: false });
                }
            });
        },
        [initWallet, newModal, closeModal, consentedContracts, log, logError, generateVpAndRedirect]
    );

    const handlers = useMemo(
        () =>
            createActionHandlers({
                // Identity handlers
                isUserAuthenticated: () => isLoggedIn,
                getUserInfo: async () => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error('LearnCard wallet not initialized. Cannot login.');
                    }

                    const did = await learnCard.id.did();
                    const profile = await learnCard.invoke.getProfile();

                    return {
                        did,
                        profile,
                    };
                },
                showLoginConsentModal: async (origin: string, appName?: string) => {
                    return new Promise(async resolve => {
                        try {
                            // Import trusted origins utilities
                            //const { isOriginTrusted, addTrustedOrigin } = await import('./trustedOrigins');

                            // Check if already trusted
                            // if (isOriginTrusted(origin)) {
                            //     console.log('[PostMessage] Origin already trusted:', origin);
                            //     resolve(true);
                            //     return;
                            // }

                            // Skip consent if this is an installed app with request_identity permission
                            // The user has already consented by installing the app
                            if (
                                isInstalled &&
                                launchConfig?.permissions?.includes('request_identity')
                            ) {
                                log(
                                    'Skipping consent for installed app with request_identity permission'
                                );
                                // addTrustedOrigin(origin, appName);
                                resolve(true);
                                return;
                            }

                            log('Login consent requested for:', origin);

                            // Dynamically import LoginConsentModal
                            const { default: LoginConsentModal } = await import(
                                '../../components/credentials/LoginConsentModal'
                            );

                            const handleAccept = () => {
                                log('User accepted login consent');
                                //addTrustedOrigin(origin, appName);
                                closeModal();
                                resolve(true);
                            };

                            const handleReject = () => {
                                log('User rejected login consent');
                                closeModal();
                                resolve(false);
                            };

                            // Extract app name from origin if not provided
                            const displayAppName = appName || new URL(origin).hostname;

                            // Open the login consent modal
                            newModal(
                                React.createElement(LoginConsentModal, {
                                    appName: displayAppName,
                                    appOrigin: origin,
                                    onAccept: handleAccept,
                                    onReject: handleReject,
                                }),
                                {
                                    sectionClassName: '!max-w-[500px]',
                                    hideButton: true,
                                    usePortal: true,
                                    portalClassName: '!max-w-[500px]',
                                }
                            );
                        } catch (error) {
                            logError('Failed to show login consent modal:', error);
                            resolve(false);
                        }
                    });
                },
                mintDelegatedToken: async (challenge?: string) => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error('LearnCard wallet not initialized. Cannot login.');
                    }

                    const jwt = await learnCard.invoke.getDidAuthVp({
                        proofFormat: 'jwt',
                        challenge,
                        domain: embedOrigin,
                    });

                    log('Minted delegated token');

                    if (typeof jwt === 'string') return jwt;

                    throw new Error('LearnCard wallet did not return a jwt. Cannot login.');
                },

                // Consent handlers
                showConsentModal: async (
                    contractUri: string,
                    options?: { redirect?: boolean }
                ) => {
                    log('Consent requested for contract:', contractUri, options);
                    return showConsentFlow(contractUri, options);
                },

                // Credential handlers
                showCredentialAcceptanceModal: async (credential: any) => {
                    return new Promise(async resolve => {
                        try {
                            log('Credential offered:', credential);

                            // Dynamically import CredentialAcceptanceModal
                            const { default: CredentialAcceptanceModal } = await import(
                                '../../components/credentials/CredentialAcceptanceModal'
                            );

                            let accepting = false;

                            const handleAccept = async () => {
                                if (accepting) return;
                                accepting = true;

                                log('Credential accepted');

                                // Save the credential to wallet
                                try {
                                    const credentialId = (
                                        await storeAndAddVCToWallet(
                                            credential,
                                            { title: credential.name || 'Credential' },
                                            'LearnCloud',
                                            true
                                        )
                                    )?.credentialUri;
                                    closeModal();
                                    resolve(credentialId ?? true);
                                } catch (error) {
                                    logError('Failed to save credential:', error);
                                    closeModal();
                                    resolve(false);
                                }
                            };

                            const handleDismiss = () => {
                                log('Credential dismissed');
                                closeModal();
                                resolve(false);
                            };

                            // Open the credential acceptance modal
                            newModal(
                                React.createElement(CredentialAcceptanceModal, {
                                    credential,
                                    onAccept: handleAccept,
                                    onDismiss: handleDismiss,
                                    accepting,
                                }),
                                {
                                    sectionClassName: '!max-w-[500px] !h-[90vh] !max-h-[90vh]',
                                    hideButton: true,
                                    usePortal: true,
                                    portalClassName: '!max-w-[500px]',
                                }
                            );
                        } catch (error) {
                            logError('Failed to show credential acceptance modal:', error);
                            resolve(false);
                        }
                    });
                },
                saveCredential: async (credential: any) => {
                    log('Saving credential:', credential);

                    const stored = await storeAndAddVCToWallet(
                        credential,
                        { title: credential.name || 'Credential' },
                        'LearnCloud',
                        true
                    );
                    return stored.credentialUri;
                },
                getCredentialById: async (id: string) => {
                    log('Fetching credential:', id);
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error(
                            'LearnCard wallet not initialized. Cannot fetch credential.'
                        );
                    }

                    const credential = await learnCard.read.get(id);

                    log('Fetched credential:', credential);
                    return credential;
                },
                searchCredentials: async (query: any) => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error(
                            'LearnCard wallet not initialized. Cannot search credentials.'
                        );
                    }

                    if (!learnCard.index.LearnCloud.getPage) {
                        throw new Error(
                            'LearnCard wallet index not initialized. Cannot search credentials.'
                        );
                    }

                    const indexedCredentials = await learnCard.index.LearnCloud.getPage(query);
                    log('Indexed credentials:', indexedCredentials);

                    const resolvedCredentials = await Promise.all(
                        indexedCredentials.records.map(async credential => {
                            const resolvedVC = await learnCard.read.get(credential.uri);
                            return { ...resolvedVC, uri: credential?.uri };
                        })
                    );

                    log('Resolved credentials:', resolvedCredentials);
                    return resolvedCredentials;
                },
                showShareCredentialModal: async (credential: any) => {
                    return new Promise(async resolve => {
                        try {
                            log('Share credential?', credential);

                            // Dynamically import ShareCredentialModal
                            const { default: ShareCredentialModal } = await import(
                                '../../components/credentials/ShareCredentialModal'
                            );

                            let sharing = false;

                            const handleShare = async () => {
                                if (sharing) return;
                                sharing = true;

                                log('User confirmed credential share');
                                closeModal();
                                resolve(true);
                            };

                            const handleCancel = () => {
                                log('User cancelled credential share');
                                closeModal();
                                resolve(false);
                            };

                            // Open the share credential modal
                            newModal(
                                React.createElement(ShareCredentialModal, {
                                    credential,
                                    onShare: handleShare,
                                    onCancel: handleCancel,
                                    sharing,
                                    origin: embedOrigin,
                                }),
                                {
                                    sectionClassName: '!max-w-[600px] h-full',
                                    hideButton: true,
                                    usePortal: true,
                                }
                            );
                        } catch (error) {
                            logError('Failed to show share credential modal:', error);
                            resolve(false);
                        }
                    });
                },
                showVprModal: async (verifiablePresentationRequest: any) => {
                    return new Promise(async resolve => {
                        try {
                            log('VPR request:', verifiablePresentationRequest);

                            // Dynamically import VprShareModal
                            const { default: VprShareModal } = await import(
                                '../../components/credentials/VprShareModal'
                            );

                            let sharing = false;

                            const handleShare = async (selectedCredentials: any[]) => {
                                if (sharing) return;
                                sharing = true;

                                log('User selected credentials:', selectedCredentials);

                                try {
                                    const learnCard = await initWallet();
                                    if (!learnCard) {
                                        logError('Wallet not initialized');
                                        closeModal();
                                        resolve(null);
                                        return;
                                    }

                                    // Get challenge and domain from VPR
                                    const challenge = verifiablePresentationRequest?.challenge;
                                    // TODO: Consider getting domain from VPR—investigate security implications.
                                    const domain = embedOrigin;

                                    // Create VP
                                    const vpToShare = {
                                        '@context': ['https://www.w3.org/ns/credentials/v2'],
                                        type: ['VerifiablePresentation'],
                                        verifiableCredential: selectedCredentials,
                                        holder: learnCard.id.did(),
                                    };

                                    log('Issuing VP:', vpToShare);

                                    // Sign VP
                                    const signedVP = await learnCard.invoke.issuePresentation(
                                        vpToShare,
                                        {
                                            challenge,
                                            domain,
                                            proofPurpose: 'authentication',
                                        }
                                    );

                                    log('Signed VP:', signedVP);

                                    closeModal();
                                    resolve(signedVP);
                                } catch (error) {
                                    logError('Failed to create VP:', error);
                                    closeModal();
                                    resolve(null);
                                }
                            };

                            const handleCancel = () => {
                                log('VPR cancelled');
                                closeModal();
                                resolve(null);
                            };

                            // Open the VPR share modal
                            newModal(
                                React.createElement(VprShareModal, {
                                    verifiablePresentationRequest,
                                    onShare: handleShare,
                                    onCancel: handleCancel,
                                    sharing,
                                    origin: embedOrigin,
                                }),
                                {
                                    sectionClassName: '!max-w-[1200px] !h-[95vh] min-h-[95vh]',
                                    hideButton: true,
                                    usePortal: true,
                                }
                            );
                        } catch (error) {
                            logError('Failed to show VPR modal:', error);
                            resolve(null);
                        }
                    });
                },
                signCredential: async (credential: any) => {
                    return new Promise(async resolve => {
                        try {
                            log('Sign credential requested:', credential);

                            // Dynamically import SignCredentialModal
                            const { default: SignCredentialModal } = await import(
                                '../../components/credentials/SignCredentialModal'
                            );

                            let signing = false;

                            const handleSign = async () => {
                                if (signing) return;
                                signing = true;

                                log('Credential signing confirmed');

                                try {
                                    const learnCard = await initWallet();

                                    if (!learnCard) {
                                        logError('Wallet not initialized');
                                        closeModal();
                                        resolve(null);
                                        return;
                                    }

                                    const signedCredential = await learnCard.invoke.issueCredential(
                                        credential
                                    );

                                    log('Signed credential:', signedCredential);
                                    closeModal();
                                    resolve(signedCredential);
                                } catch (error) {
                                    logError('Failed to sign credential:', error);
                                    closeModal();
                                    resolve(null);
                                }
                            };

                            const handleCancel = () => {
                                log('Credential signing cancelled');
                                closeModal();
                                resolve(null);
                            };

                            // Open the sign credential modal
                            newModal(
                                React.createElement(SignCredentialModal, {
                                    credential,
                                    onSign: handleSign,
                                    onCancel: handleCancel,
                                    signing,
                                }),
                                {
                                    sectionClassName: '!max-w-[500px] !h-[90vh] !max-h-[90vh]',
                                    hideButton: true,
                                    usePortal: true,
                                    portalClassName: '!max-w-[500px]',
                                }
                            );
                        } catch (error) {
                            logError('Failed to show sign credential modal:', error);
                            resolve(null);
                        }
                    });
                },

                signPresentation: async (credential: any) => {
                    log('Signing presentation:', credential);

                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error(
                            'LearnCard wallet not initialized. Cannot sign presentation.'
                        );
                    }

                    const vp: UnsignedVP = {
                        '@context': ['https://www.w3.org/ns/credentials/v2'],
                        type: ['VerifiablePresentation'],
                        holder: learnCard.id.did(),
                        verifiableCredential: [credential],
                    };

                    try {
                        const signedPresentation = await learnCard.invoke.issuePresentation(vp, {
                            domain: embedOrigin,
                        });

                        log('Signed presentation:', signedPresentation);
                        return signedPresentation;
                    } catch (error) {
                        logError('Error signing presentation:', error);
                        return null;
                    }
                },

                // Navigation handler
                navigate: (path: string, params?: Record<string, string>) => {
                    log('Navigating to:', path, params);
                    const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
                    history.push(path + queryParams);

                    // Call optional onNavigate callback (e.g., to close modal)
                    if (onNavigate) {
                        onNavigate();
                    }
                },

                // Boost template issue handler
                showBoostIssueModal: async (templateId: string, draftRecipients?: string[]) => {
                    return new Promise(async resolve => {
                        try {
                            const learnCard = await initWallet();
                            if (!learnCard) {
                                logError('Wallet not initialized');
                                resolve(false);
                                return;
                            }

                            const profileId = (await learnCard.invoke.getProfile())?.profileId;
                            if (!profileId) {
                                logError('Profile ID not found');
                                resolve(false);
                                return;
                            }

                            // Get boost data by templateId
                            const boost = await learnCard.invoke.getBoost(templateId);
                            if (!boost) {
                                logError('Boost template not found:', templateId);
                                resolve(false);
                                return;
                            }

                            // Resolve the boost VC
                            const boostVC = boost.uri ? await learnCard.read.get(boost.uri) : null;

                            // Import ShortBoostUserOptions dynamically
                            const { default: ShortBoostUserOptions } = await import(
                                '../../components/boost/boost-options/boostUserOptions/ShortBoostUserOptions'
                            );

                            const handleCloseModal = (completed: boolean) => {
                                closeModal();
                                resolve(completed);
                            };

                            const handleSuccessModal = () => {
                                resolve(true);
                            };

                            // Extract profileId from DID format (e.g., "did:web:network.learncard.com:users:jsmith" -> "jsmith")
                            const extractProfileIdFromDID = (did: string): string => {
                                const parts = did.split(':');
                                return parts[parts.length - 1];
                            };

                            const boostCMSRecipients =
                                draftRecipients?.map(recipient => ({
                                    profileId: extractProfileIdFromDID(recipient),
                                    did: recipient,
                                })) || [];

                            // Open the short boost modal
                            newModal(
                                React.createElement(ShortBoostUserOptions, {
                                    handleCloseModal: () => handleCloseModal(false),
                                    boostCredential: boostVC,
                                    boost,
                                    boostUri: boost.uri,
                                    profileId,
                                    history,
                                    handleEditOnClick: () => {
                                        // Edit functionality not needed for issued boosts
                                        log('Edit not available for issued templates');
                                    },
                                    draftRecipients: boostCMSRecipients, // Pass draft recipients if provided
                                    onSuccess: () => handleSuccessModal(),
                                    overrideClosingAllModals: true,
                                    showBoostContext: true,
                                }),
                                {
                                    sectionClassName: '!max-w-[500px]',
                                    hideButton: true,
                                    usePortal: true,
                                    portalClassName: '!max-w-[500px]',
                                },
                                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                            );
                        } catch (error) {
                            logError('Failed to show boost issue modal:', error);
                            resolve(false);
                        }
                    });
                },
                canUserIssueTemplate: async (templateId: string) => {
                    try {
                        const learnCard = await initWallet();
                        if (!learnCard) {
                            logError('Wallet not initialized');
                            return false;
                        }

                        // Get the boost to verify it exists
                        const boost = await learnCard.invoke.getBoost(templateId);

                        if (!boost) {
                            logError('Boost template not found:', templateId);
                            return false;
                        }

                        // Check if user has canIssue permission
                        // This covers: admin status, explicit canIssue permission, or defaultPermissions.canIssue
                        const permissions = await learnCard.invoke.getBoostPermissions(templateId);

                        return Boolean(permissions?.canIssue);
                    } catch (error) {
                        logError('Failed to check issue permission:', error);
                        return false;
                    }
                },

                // App events - only available when appId is provided
                sendAppEvent: appId
                    ? async (listingId: string, event: AppEvent) => {
                        const learnCard = await initWallet();

                        if (!learnCard) throw new Error('Wallet not initialized');

                        if (!learnCard.invoke.sendAppEvent) {
                            throw new Error('sendAppEvent not available - rebuild types');
                        }

                        const result = await learnCard.invoke.sendAppEvent(listingId, event);

                        // If a credential was issued, notify the parent component
                        if (result.credentialUri && onCredentialIssued) {
                            onCredentialIssued(
                                result.credentialUri as string,
                                result.boostUri as string | undefined
                            );
                        }

                        return result;
                    }
                    : undefined,
                getAppListingId: appId ? () => appId : undefined,
            }),
        [
            isLoggedIn,
            initWallet,
            storeAndAddVCToWallet,
            history,
            embedOrigin,
            onNavigate,
            showConsentFlow,
            newModal,
            closeModal,
            appId,
            onCredentialIssued,
            log,
            logError,
        ]
    );

    return handlers;
}
