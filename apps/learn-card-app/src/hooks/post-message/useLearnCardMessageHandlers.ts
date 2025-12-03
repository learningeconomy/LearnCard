import React, { useMemo, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useIsLoggedIn, useWallet, useModal, ModalTypes } from 'learn-card-base';
import { UnsignedVP } from '@learncard/types';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import { ActionHandlers } from './useLearnCardPostMessage';
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
}: UseLearnCardMessageHandlersOptions): ActionHandlers {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet, storeAndAddVCToWallet } = useWallet();
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const { data: consentedContracts } = useConsentedContracts();

    /**
     * Imperative function to show consent flow and return result
     */
    const showConsentFlow = useCallback(async (contractUri: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            try {
                // Fetch the contract using LearnCard wallet
                const wallet = await initWallet();
                if (!wallet) {
                    console.error('[PostMessage] Wallet not initialized');
                    resolve(false);
                    return;
                }

                const contract = await wallet.invoke.getContract(contractUri);
                if (!contract) {
                    console.error('[PostMessage] Contract not found:', contractUri);
                    resolve(false);
                    return;
                }

                // Check if already consented
                const consentedContract = consentedContracts?.find(
                    c => c?.contract?.uri === contractUri && c?.status !== 'withdrawn'
                );
                
                const successCallback = () => {
                    console.log('[PostMessage] Consent flow completed');
                    resolve(true);
                    closeModal();
                };

                const handleCancel = () => {
                    console.log('[PostMessage] Consent flow cancelled');
                    resolve(false);
                };

                const isPostConsent = !!consentedContract;
                if (isPostConsent) {
                    resolve(true)
                    return;
                }

                // Open the consent flow modal
                const consentFlowElement = React.createElement(
                    FullScreenConsentFlow,
                    {
                        contractDetails: contract,
                        isPostConsent,
                        hideProfileButton: true,
                        successCallback: successCallback,
                    }
                );

                newModal(
                    consentFlowElement,
                    { onClose: handleCancel },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            } catch (error) {
                console.error('[PostMessage] Failed to fetch consent contract:', error);
                resolve(false);
            }
        });
    }, [initWallet, newModal, closeModal, consentedContracts]);

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
                    return new Promise(async (resolve) => {
                        try {
                            // Import trusted origins utilities
                            const { isOriginTrusted, addTrustedOrigin } = await import('./trustedOrigins');

                            // Check if already trusted
                            if (isOriginTrusted(origin)) {
                                console.log('[PostMessage] Origin already trusted:', origin);
                                resolve(true);
                                return;
                            }

                            // Skip consent if this is an installed app with request_identity permission
                            // The user has already consented by installing the app
                            if (isInstalled && launchConfig?.permissions?.includes('request_identity')) {
                                console.log('[PostMessage] Skipping consent for installed app with request_identity permission');
                                addTrustedOrigin(origin, appName);
                                resolve(true);
                                return;
                            }

                            console.log('[PostMessage] Login consent requested for:', origin);

                            // Dynamically import LoginConsentModal
                            const { default: LoginConsentModal } = await import(
                                '../../components/credentials/LoginConsentModal'
                            );

                            const handleAccept = () => {
                                console.log('[PostMessage] User accepted login consent');
                                addTrustedOrigin(origin, appName);
                                closeModal();
                                resolve(true);
                            };

                            const handleReject = () => {
                                console.log('[PostMessage] User rejected login consent');
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
                            console.error('[PostMessage] Failed to show login consent modal:', error);
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

                    console.log('[PostMessage] Minted delegated token');

                    if (typeof jwt === 'string') return jwt;

                    throw new Error('LearnCard wallet did not return a jwt. Cannot login.');
                },

                // Consent handlers
                showConsentModal: async (contractUri: string) => {
                    console.log('[PostMessage] Consent requested for contract:', contractUri);
                    return showConsentFlow(contractUri);
                },

                // Credential handlers
                showCredentialAcceptanceModal: async (credential: any) => {
                    return new Promise(async (resolve) => {
                        try {
                            console.log('[PostMessage] Credential offered:', credential);

                            // Dynamically import CredentialAcceptanceModal
                            const { default: CredentialAcceptanceModal } = await import(
                                '../../components/credentials/CredentialAcceptanceModal'
                            );

                            let accepting = false;

                            const handleAccept = async () => {
                                if (accepting) return;
                                accepting = true;

                                console.log('[PostMessage] Credential accepted');

                                // Save the credential to wallet
                                try {
                                    const credentialId = (await storeAndAddVCToWallet(
                                        credential,
                                        { title: credential.name || 'Credential' },
                                        'LearnCloud',
                                        true
                                    ))?.credentialUri;
                                    closeModal();
                                    resolve(credentialId ?? true);
                                } catch (error) {
                                    console.error('[PostMessage] Failed to save credential:', error);
                                    closeModal();
                                    resolve(false);
                                }
                            };

                            const handleDismiss = () => {
                                console.log('[PostMessage] Credential dismissed');
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
                            console.error('[PostMessage] Failed to show credential acceptance modal:', error);
                            resolve(false);
                        }
                    });
                },
                saveCredential: async (credential: any) => {
                    console.log('[PostMessage] Saving credential:', credential);

                    const stored = await storeAndAddVCToWallet(credential, { title: credential.name || 'Credential' }, 'LearnCloud', true);
                    return stored.credentialUri;
                },
                getCredentialById: async (id: string) => {
                    console.log('[PostMessage] Fetching credential:', id);
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error('LearnCard wallet not initialized. Cannot fetch credential.');
                    }

                    const credential = await learnCard.read.get(id);
                        
                    console.log('[PostMessage] Fetched credential:', credential);
                    return credential;
                },
                searchCredentials: async (query: any) => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error('LearnCard wallet not initialized. Cannot search credentials.');
                    }

                    if (!learnCard.index.LearnCloud.getPage) {
                        throw new Error('LearnCard wallet index not initialized. Cannot search credentials.');
                    }

                    const indexedCredentials = await learnCard.index.LearnCloud.getPage(query);
                    console.log('[PostMessage] Indexed credentials:', indexedCredentials);

                    const resolvedCredentials = await Promise.all(indexedCredentials.records.map(async (credential) => {
                        const resolvedVC = await learnCard.read.get(credential.uri);
                        return { ...resolvedVC, uri: credential?.uri };
                    }));

                    console.log('[PostMessage] Resolved credentials:', resolvedCredentials);
                    return resolvedCredentials;
                },
                showShareCredentialModal: async (credential: any) => {
                    return new Promise(async (resolve) => {
                        try {
                            console.log('[PostMessage] Share credential?', credential);

                            // Dynamically import ShareCredentialModal
                            const { default: ShareCredentialModal } = await import(
                                '../../components/credentials/ShareCredentialModal'
                            );

                            let sharing = false;

                            const handleShare = async () => {
                                if (sharing) return;
                                sharing = true;

                                console.log('[PostMessage] User confirmed credential share');
                                closeModal();
                                resolve(true);
                            };

                            const handleCancel = () => {
                                console.log('[PostMessage] User cancelled credential share');
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
                            console.error('[PostMessage] Failed to show share credential modal:', error);
                            resolve(false);
                        }
                    });
                },
                showVprModal: async (verifiablePresentationRequest: any) => {
                    return new Promise(async (resolve) => {
                        try {
                            console.log('[PostMessage] VPR request:', verifiablePresentationRequest);

                            // Dynamically import VprShareModal
                            const { default: VprShareModal } = await import(
                                '../../components/credentials/VprShareModal'
                            );

                            let sharing = false;

                            const handleShare = async (selectedCredentials: any[]) => {
                                if (sharing) return;
                                sharing = true;

                                console.log('[PostMessage] User selected credentials:', selectedCredentials);

                                try {
                                    const learnCard = await initWallet();
                                    if (!learnCard) {
                                        console.error('[PostMessage] Wallet not initialized');
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
                                        '@context': [
                                            'https://www.w3.org/ns/credentials/v2'],
                                        type: ['VerifiablePresentation'],
                                        verifiableCredential: selectedCredentials,
                                        holder: learnCard.id.did(),
                                    };

                                    console.log('[PostMessage] Issuing VP:', vpToShare);

                                    // Sign VP
                                    const signedVP = await learnCard.invoke.issuePresentation(vpToShare, {
                                        challenge,
                                        domain,
                                        proofPurpose: 'authentication',
                                    });

                                    console.log('[PostMessage] Signed VP:', signedVP);

                                    closeModal();
                                    resolve(signedVP);
                                } catch (error) {
                                    console.error('[PostMessage] Failed to create VP:', error);
                                    closeModal();
                                    resolve(null);
                                }
                            };

                            const handleCancel = () => {
                                console.log('[PostMessage] VPR cancelled');
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
                            console.error('[PostMessage] Failed to show VPR modal:', error);
                            resolve(null);
                        }
                    });
                },
                signCredential: async (credential: any) => {
                    return new Promise(async (resolve) => {
                        try {
                            console.log('[PostMessage] Sign credential requested:', credential);

                            // Dynamically import SignCredentialModal
                            const { default: SignCredentialModal } = await import(
                                '../../components/credentials/SignCredentialModal'
                            );

                            let signing = false;

                            const handleSign = async () => {
                                if (signing) return;
                                signing = true;

                                console.log('[PostMessage] Credential signing confirmed');

                                try {
                                    const learnCard = await initWallet();

                                    if (!learnCard) {
                                        console.error('[PostMessage] Wallet not initialized');
                                        closeModal();
                                        resolve(null);
                                        return;
                                    }

                                    const signedCredential = await learnCard.invoke.issueCredential(credential);

                                    console.log('[PostMessage] Signed credential:', signedCredential);
                                    closeModal();
                                    resolve(signedCredential);
                                } catch (error) {
                                    console.error('[PostMessage] Failed to sign credential:', error);
                                    closeModal();
                                    resolve(null);
                                }
                            };

                            const handleCancel = () => {
                                console.log('[PostMessage] Credential signing cancelled');
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
                            console.error('[PostMessage] Failed to show sign credential modal:', error);
                            resolve(null);
                        }
                    });
                },

                signPresentation: async (credential: any) => {
                    console.log('[PostMessage] Signing presentation:', credential);

                    const learnCard = await initWallet();

                    if (!learnCard) {
                        throw new Error('LearnCard wallet not initialized. Cannot sign presentation.');
                    }

                    const vp: UnsignedVP = {
                        '@context': ['https://www.w3.org/ns/credentials/v2'],
                        type: ['VerifiablePresentation'],
                        holder: learnCard.id.did(),
                        verifiableCredential: [credential],
                    };

                    try {
                        const signedPresentation = await learnCard.invoke.issuePresentation(vp, {
                            domain: embedOrigin
                        });

                        console.log('[PostMessage] Signed presentation:', signedPresentation);
                        return signedPresentation;
                    } catch (error) {
                        console.error('[PostMessage] Error signing presentation:', error);
                        return null;
                    }
                },

                // Navigation handler
                navigate: (path: string, params?: Record<string, string>) => {
                    console.log('[PostMessage] Navigating to:', path, params);
                    const queryParams = params
                        ? '?' + new URLSearchParams(params).toString()
                        : '';
                    history.push(path + queryParams);
                    
                    // Call optional onNavigate callback (e.g., to close modal)
                    if (onNavigate) {
                        onNavigate();
                    }
                },

                // Boost template issue handler
                showBoostIssueModal: async (templateId: string, draftRecipients?: string[]) => {
                    return new Promise(async (resolve) => {
                        try {
                            const learnCard = await initWallet();
                            if (!learnCard) {
                                console.error('[PostMessage] Wallet not initialized');
                                resolve(false);
                                return;
                            }

                            const profileId = (await learnCard.invoke.getProfile())?.profileId;
                            if (!profileId) {
                                console.error('[PostMessage] Profile ID not found');
                                resolve(false);
                                return;
                            }

                            // Get boost data by templateId
                            const boost = await learnCard.invoke.getBoost(templateId);
                            if (!boost) {
                                console.error('[PostMessage] Boost template not found:', templateId);
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

                            const boostCMSRecipients = draftRecipients?.map((recipient) => ({
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
                                        console.log('[PostMessage] Edit not available for issued templates');
                                    },
                                    draftRecipients: boostCMSRecipients, // Pass draft recipients if provided
                                    onSuccess: () => handleSuccessModal(),
                                    overrideClosingAllModals: true,
                                    showBoostContext: true
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
                            console.error('[PostMessage] Failed to show boost issue modal:', error);
                            resolve(false);
                        }
                    });
                },
                isUserAdminOfTemplate: async (templateId: string) => {
                    try {
                        const learnCard = await initWallet();
                        if (!learnCard) {
                            console.error('[PostMessage] Wallet not initialized');
                            return false;
                        }

                        // Get the current user's DID
                        const userProfileId = (await learnCard.invoke.getProfile())?.profileId;

                        // Get boost data
                        const boost = await learnCard.invoke.getBoost(templateId);
                        const admins = await learnCard.invoke.getBoostAdmins(templateId, { includeSelf: true });

                        if (!boost) {
                            console.error('[PostMessage] Boost template not found:', templateId);
                            return false;
                        }

                        // Check if boost.profileId matches current user
                        // profileId is typically the DID or profile identifier of the boost owner
                        return admins?.records?.map(admin => admin?.profileId).includes(userProfileId);
                    } catch (error) {
                        console.error('[PostMessage] Failed to check admin status:', error);
                        return false;
                    }
                },
            }),
        [isLoggedIn, initWallet, storeAndAddVCToWallet, history, embedOrigin, onNavigate, showConsentFlow, newModal, closeModal]
    );

    return handlers;
}
