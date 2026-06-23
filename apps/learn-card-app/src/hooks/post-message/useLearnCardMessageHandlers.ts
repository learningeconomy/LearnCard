import React, { useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import {
    useIsLoggedIn,
    useWallet,
    useModal,
    ModalTypes,
    LEARNCARD_AI_URL,
    getOrFetchIntegrationForListing,
} from 'learn-card-base';
import { UnsignedVP, VC, VP } from '@learncard/types';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

import { ActionHandlers, AppEvent } from './useLearnCardPostMessage';
import { createActionHandlers } from './useLearnCardPostMessage.handlers';
import FullScreenConsentFlow from '../../pages/consentFlow/FullScreenConsentFlow';
import sdkActivityStore from '../../stores/sdkActivityStore';
import { publishWalletEvent } from '../../pages/pathways/events/walletEventBus';
import {
    startFlow as startSendCredentialFlow,
    markResponseReceived as markSendCredentialResponseReceived,
    markClaimCompleted as markSendCredentialClaimCompleted,
    flushOnError as flushSendCredentialFlowOnError,
} from '../../helpers/sendCredentialFlow.helpers';
import {
    clearLearnerContextCache,
    LEARNER_CONTEXT_CACHE_TTL_MS,
    getLearnerContextCacheKey,
    readLearnerContextCache,
    writeLearnerContextCache,
    type LearnerContextCacheEntry,
    type LearnerContextRequestOptions,
    type LearnerContextSourceData,
} from './learnerContextCache.helpers';

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
    onCredentialIssued?: (credentialUri: string, boostUri?: string, credential?: VC | VP) => void;
    onAppNotification?: (notification: {
        title?: string;
        body?: string;
        category?: string;
        priority?: string;
    }) => void;
    debug?: boolean;
}

import { getLogger } from 'learn-card-base';
const moduleLog = getLogger('use-learn-card-message-handlers');

type LearnerContextFillTimings = {
    credentialReadMs?: number;
    promptizerMs?: number;
};

const learnerContextCacheFills = new Map<
    string,
    { promise: Promise<LearnerContextCacheEntry>; timings: LearnerContextFillTimings }
>();
const prewarmedCacheKeys = new Map<string, number>();

type LearnerContextMetadata = {
    cacheStatus?: 'browser-hit' | 'browser-miss' | 'backend-hit' | 'backend-miss' | 'structured';
    timings?: {
        totalMs: number;
        sdkRoundTripMs?: number;
        appEventMs?: number;
        credentialReadMs?: number;
        promptizerMs?: number;
        cacheLookupMs?: number;
        prewarmAgeMs?: number;
    };
    backendMetadata?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const getStringValue = (
    record: Record<string, unknown> | undefined,
    key: string
): string | undefined => {
    const value = record?.[key];
    return typeof value === 'string' ? value : undefined;
};

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
    onAppNotification,
    debug = false,
}: UseLearnCardMessageHandlersOptions): ActionHandlers {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet, storeAndAddVCToWallet } = useWallet();
    const history = useHistory();
    const { newModal, closeModal } = useModal();
    const { data: consentedContracts } = useConsentedContracts();
    const queryClient = useQueryClient();

    // Debug logging helper
    const log = useCallback(
        (...args: unknown[]) => {
            if (debug) moduleLog.info('[PostMessage]', ...args);
        },
        [debug]
    );

    const logError = useCallback(
        (...args: unknown[]) => {
            if (debug) moduleLog.error('[PostMessage]', ...args);
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
                        sdkActivityStore.set.endActivity();
                        resolve({ granted: false });
                        return;
                    }

                    const contract = await wallet.invoke.getContract(contractUri);
                    if (!contract) {
                        logError('Contract not found:', contractUri);
                        sdkActivityStore.set.endActivity();
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
                        sdkActivityStore.set.endActivity();

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

                    // Hide activity indicator before showing modal
                    sdkActivityStore.set.endActivity();

                    newModal(
                        consentFlowElement,
                        { onClose: handleCancel },
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                    );
                } catch (error) {
                    logError('Failed to fetch consent contract:', error);
                    sdkActivityStore.set.endActivity();
                    resolve({ granted: false });
                }
            });
        },
        [initWallet, newModal, closeModal, consentedContracts, log, logError, generateVpAndRedirect]
    );

    const getIntegrationForListing = async (_listingId: string) => {
        if (!appId) return undefined;

        const wallet = await initWallet();

        return getOrFetchIntegrationForListing(queryClient, wallet, appId);
    };

    type LearnCardWallet = NonNullable<Awaited<ReturnType<typeof initWallet>>>;

    const normalizeLearnerContextOptions = useCallback(
        (options: LearnerContextRequestOptions = {}): LearnerContextRequestOptions => ({
            includeCredentials: options.includeCredentials ?? true,
            includePersonalData: options.includePersonalData ?? false,
            format: options.format ?? 'prompt',
            instructions: options.instructions,
            detailLevel: options.detailLevel ?? 'compact',
        }),
        []
    );

    const fetchLearnerContextSource = useCallback(
        async (
            learnCard: LearnCardWallet,
            options: LearnerContextRequestOptions
        ): Promise<LearnerContextSourceData> => {
            if (!appId) throw new Error('App listing not available');

            if (!learnCard.invoke.sendAppEvent) {
                throw new Error('sendAppEvent not available - rebuild types');
            }

            const result = await learnCard.invoke.sendAppEvent(appId, {
                type: 'request-learner-context',
                includeCredentials: options.includeCredentials,
                includePersonalData: options.includePersonalData,
                instructions: options.instructions,
                detailLevel: options.detailLevel,
            });

            const rawCredentialUris = Array.isArray(result.credentialUris)
                ? result.credentialUris
                : [];
            const credentialUris =
                options.includeCredentials === false
                    ? []
                    : Array.from(
                          new Set(
                              rawCredentialUris.filter(
                                  (uri): uri is string => typeof uri === 'string'
                              )
                          )
                      ).sort();
            const personalData =
                options.includePersonalData && isRecord(result.personalData)
                    ? result.personalData
                    : undefined;

            return {
                appId,
                did: typeof result.did === 'string' ? result.did : await learnCard.id.did(),
                credentialUris,
                personalData,
                displayName:
                    getStringValue(personalData, 'name') ??
                    getStringValue(personalData, 'displayName'),
            };
        },
        [appId]
    );

    const resolveLearnerContextCredentials = useCallback(
        async (learnCard: LearnCardWallet, credentialUris: string[]): Promise<unknown[]> => {
            const credentials = await Promise.all(
                credentialUris.map(async uri => {
                    try {
                        return learnCard.read.get(uri);
                    } catch (error) {
                        logError(`Failed to resolve credential ${uri}:`, error);
                        return undefined;
                    }
                })
            );

            return credentials.filter(credential => credential !== undefined);
        },
        [logError]
    );

    const generatePromptForLearnerContext = useCallback(
        async (
            credentials: unknown[],
            personalData: Record<string, unknown> | undefined,
            options: LearnerContextRequestOptions
        ): Promise<{ prompt: string; backendMetadata?: Record<string, unknown> }> => {
            const aiServiceUrl = (
                import.meta.env.VITE_LEARNCARD_AI_URL ||
                networkStore.get.aiServiceUrl() ||
                LEARNCARD_AI_URL
            ).replace(/\/+$/, '');

            try {
                // The formatter URL is tenant/deployment configuration, not partner input.
                // End-user authorization happens before this point via login + ConsentFlow.
                const promptizerResponse = await fetch(
                    `${aiServiceUrl}/ai/learner-context/format`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            credentials,
                            personalData,
                            instructions: options.instructions,
                            detailLevel: options.detailLevel,
                            includeStructuredContext: false,
                            maxCredentials: credentials.length,
                        }),
                    }
                );

                if (!promptizerResponse.ok) {
                    return {
                        prompt: `User has ${credentials.length} credentials.`,
                        backendMetadata: { promptizerError: true },
                    };
                }

                const promptizerData: unknown = await promptizerResponse.json();

                return {
                    prompt:
                        isRecord(promptizerData) && typeof promptizerData.prompt === 'string'
                            ? promptizerData.prompt
                            : '',
                    backendMetadata:
                        isRecord(promptizerData) && isRecord(promptizerData.metadata)
                            ? promptizerData.metadata
                            : undefined,
                };
            } catch (error) {
                logError('Failed to call promptizer:', error);

                return {
                    prompt: `User has ${credentials.length} credentials.`,
                    backendMetadata: { promptizerError: true },
                };
            }
        },
        [logError]
    );

    const fillLearnerContextCache = useCallback(
        async (
            learnCard: LearnCardWallet,
            source: LearnerContextSourceData,
            options: LearnerContextRequestOptions,
            key: string,
            timings?: LearnerContextMetadata['timings']
        ): Promise<LearnerContextCacheEntry> => {
            const existingFill = learnerContextCacheFills.get(key);
            if (existingFill) {
                const entry = await existingFill.promise;
                if (timings) Object.assign(timings, existingFill.timings);
                return entry;
            }

            const fillTimings: LearnerContextFillTimings = {};

            const fillPromise = (async () => {
                const credentialReadStartedAt = performance.now();
                const credentials = await resolveLearnerContextCredentials(
                    learnCard,
                    source.credentialUris
                );
                fillTimings.credentialReadMs = performance.now() - credentialReadStartedAt;

                const promptizerStartedAt = performance.now();
                const { prompt, backendMetadata } = await generatePromptForLearnerContext(
                    credentials,
                    source.personalData,
                    options
                );
                fillTimings.promptizerMs = performance.now() - promptizerStartedAt;

                const entry: LearnerContextCacheEntry = {
                    key,
                    prompt,
                    did: source.did,
                    displayName: source.displayName,
                    credentialUris: source.credentialUris,
                    personalData: source.personalData,
                    backendMetadata,
                    createdAt: Date.now(),
                };

                writeLearnerContextCache(entry);

                return entry;
            })();

            learnerContextCacheFills.set(key, { promise: fillPromise, timings: fillTimings });

            try {
                const entry = await fillPromise;
                if (timings) Object.assign(timings, fillTimings);
                return entry;
            } finally {
                learnerContextCacheFills.delete(key);
            }
        },
        [generatePromptForLearnerContext, resolveLearnerContextCredentials]
    );

    const prewarmLearnerContext = useCallback(
        async (inputOptions: LearnerContextRequestOptions): Promise<void> => {
            try {
                const learnCard = await initWallet();
                if (!learnCard) return;

                const options = normalizeLearnerContextOptions(inputOptions);
                const source = await fetchLearnerContextSource(learnCard, options);
                const key = getLearnerContextCacheKey(source, options);

                const now = Date.now();
                const lastPrewarmAt = prewarmedCacheKeys.get(key);
                if (
                    lastPrewarmAt !== undefined &&
                    now - lastPrewarmAt < LEARNER_CONTEXT_CACHE_TTL_MS
                ) {
                    return;
                }

                if (readLearnerContextCache(key, now)) return;

                await fillLearnerContextCache(learnCard, source, options, key);
                prewarmedCacheKeys.set(key, Date.now());
            } catch (error) {
                log('Learner context prewarm skipped', error);
            }
        },
        [
            fetchLearnerContextSource,
            fillLearnerContextCache,
            initWallet,
            log,
            normalizeLearnerContextOptions,
        ]
    );

    const handlers = useMemo(
        () =>
            createActionHandlers({
                // Identity handlers
                isUserAuthenticated: () => isLoggedIn,
                getUserInfo: async () => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        sdkActivityStore.set.endActivity();
                        throw new Error('LearnCard wallet not initialized. Cannot login.');
                    }

                    const did = await learnCard.id.did();
                    const profile = await learnCard.invoke.getProfile();

                    sdkActivityStore.set.endActivity();
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
                            //     log.info('[PostMessage] Origin already trusted:', origin);
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
                                sdkActivityStore.set.endActivity();
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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
                            resolve(false);
                        }
                    });
                },
                mintDelegatedToken: async (challenge?: string) => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        sdkActivityStore.set.endActivity();
                        throw new Error('LearnCard wallet not initialized. Cannot login.');
                    }

                    const jwt = await learnCard.invoke.getDidAuthVp({
                        proofFormat: 'jwt',
                        challenge,
                        domain: embedOrigin,
                    });

                    log('Minted delegated token');
                    sdkActivityStore.set.endActivity();

                    if (typeof jwt === 'string') return jwt;

                    throw new Error('LearnCard wallet did not return a jwt. Cannot login.');
                },

                // Consent handlers
                showConsentModal: async (contractUri: string, options?: { redirect?: boolean }) => {
                    log('Consent requested for contract:', contractUri, options);
                    return showConsentFlow(contractUri, options);
                },
                getContractUri: () => launchConfig?.contractUri as string | undefined,
                getIntegrationContractUri: async () => {
                    if (!appId) return undefined;

                    const integration = await getIntegrationForListing(appId);
                    const guideState = integration?.guideState as
                        | {
                              config?: {
                                  consentFlowConfig?: { contractUri?: string };
                                  embedAppConfig?: {
                                      featureConfig?: {
                                          'request-data-consent'?: { contractUri?: string };
                                      };
                                  };
                              };
                          }
                        | undefined;

                    return (
                        guideState?.config?.embedAppConfig?.featureConfig?.['request-data-consent']
                            ?.contractUri || guideState?.config?.consentFlowConfig?.contractUri
                    );
                },
                prewarmLearnerContext,

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

                                    // Announce the ingest to the pathway
                                    // reactor. Without this, pathway nodes
                                    // that terminate on this credential
                                    // never re-evaluate — the reactor is
                                    // event-driven and only wakes on
                                    // `credential-ingested`. Other ingest
                                    // call sites (claim-link, dashboard
                                    // import, self-issue, etc.) publish
                                    // their own variants; the Partner
                                    // Connect `SEND_CREDENTIAL` path has
                                    // been the one gap. We publish best-
                                    // effort: an event-bus failure should
                                    // not block the acceptance UX (the VC
                                    // is already saved by this point).
                                    if (credentialId) {
                                        try {
                                            publishWalletEvent({
                                                kind: 'credential-ingested',
                                                eventId: crypto.randomUUID(),
                                                credentialUri: credentialId,
                                                vc: credential,
                                                ingestedAt: new Date().toISOString(),
                                                source: 'partner-sdk',
                                            });
                                        } catch (publishErr) {
                                            logError(
                                                'Failed to publish credential-ingested event:',
                                                publishErr
                                            );
                                        }
                                    }

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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
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
                    sdkActivityStore.set.endActivity();
                    return stored.credentialUri;
                },
                getCredentialById: async (id: string) => {
                    log('Fetching credential:', id);
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        sdkActivityStore.set.endActivity();
                        throw new Error(
                            'LearnCard wallet not initialized. Cannot fetch credential.'
                        );
                    }

                    const credential = await learnCard.read.get(id);

                    log('Fetched credential:', credential);
                    sdkActivityStore.set.endActivity();
                    return credential;
                },
                searchCredentials: async (query: any) => {
                    const learnCard = await initWallet();

                    if (!learnCard) {
                        sdkActivityStore.set.endActivity();
                        throw new Error(
                            'LearnCard wallet not initialized. Cannot search credentials.'
                        );
                    }

                    if (!learnCard.index.LearnCloud.getPage) {
                        sdkActivityStore.set.endActivity();
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
                    sdkActivityStore.set.endActivity();
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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
                            resolve(null);
                        }
                    });
                },

                signPresentation: async (credential: any) => {
                    log('Signing presentation:', credential);

                    const learnCard = await initWallet();

                    if (!learnCard) {
                        sdkActivityStore.set.endActivity();
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
                        sdkActivityStore.set.endActivity();
                        return signedPresentation;
                    } catch (error) {
                        logError('Error signing presentation:', error);
                        sdkActivityStore.set.endActivity();
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
                    sdkActivityStore.set.endActivity();
                },

                // Boost template issue handler
                showBoostIssueModal: async (templateId: string, draftRecipients?: string[]) => {
                    return new Promise(async resolve => {
                        try {
                            const learnCard = await initWallet();
                            if (!learnCard) {
                                logError('Wallet not initialized');
                                sdkActivityStore.set.endActivity();
                                resolve(false);
                                return;
                            }

                            const profileId = (await learnCard.invoke.getProfile())?.profileId;
                            if (!profileId) {
                                logError('Profile ID not found');
                                sdkActivityStore.set.endActivity();
                                resolve(false);
                                return;
                            }

                            // Get boost data by templateId
                            const boost = await learnCard.invoke.getBoost(templateId);
                            if (!boost) {
                                logError('Boost template not found:', templateId);
                                sdkActivityStore.set.endActivity();
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

                            // Hide activity indicator before showing modal
                            sdkActivityStore.set.endActivity();

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
                            sdkActivityStore.set.endActivity();
                            resolve(false);
                        }
                    });
                },
                canUserIssueTemplate: async (templateId: string) => {
                    try {
                        const learnCard = await initWallet();
                        if (!learnCard) {
                            logError('Wallet not initialized');
                            sdkActivityStore.set.endActivity();
                            return false;
                        }

                        // Get the boost to verify it exists
                        const boost = await learnCard.invoke.getBoost(templateId);

                        if (!boost) {
                            logError('Boost template not found:', templateId);
                            sdkActivityStore.set.endActivity();
                            return false;
                        }

                        // Check if user has canIssue permission
                        // This covers: admin status, explicit canIssue permission, or defaultPermissions.canIssue
                        const permissions = await learnCard.invoke.getBoostPermissions(templateId);

                        sdkActivityStore.set.endActivity();
                        return Boolean(permissions?.canIssue);
                    } catch (error) {
                        logError('Failed to check issue permission:', error);
                        sdkActivityStore.set.endActivity();
                        return false;
                    }
                },

                // App events - only available when appId is provided
                sendAppEvent: appId
                    ? async (listingId: string, event: AppEvent) => {
                          const learnCard = await initWallet();

                          if (!learnCard) {
                              sdkActivityStore.set.endActivity();
                              throw new Error('Wallet not initialized');
                          }

                          if (!learnCard.invoke.sendAppEvent) {
                              sdkActivityStore.set.endActivity();
                              throw new Error('sendAppEvent not available - rebuild types');
                          }

                          // LC-1644 perf telemetry — only the send-credential path triggers
                          // the user-facing claim flow we want to time. Other event types
                          // (check-credential, send-ai-session-credential) follow different paths.
                          const isSendCredential = event.type === 'send-credential';
                          if (isSendCredential) {
                              startSendCredentialFlow({
                                  listingId,
                                  eventType: event.type,
                              });
                          }

                          let result;
                          try {
                              result = await learnCard.invoke.sendAppEvent(listingId, event);
                          } catch (err) {
                              if (isSendCredential) {
                                  void flushSendCredentialFlowOnError({
                                      phase: 'request',
                                      message: err instanceof Error ? err.message : String(err),
                                  });
                              }
                              throw err;
                          }

                          if (isSendCredential) {
                              markSendCredentialResponseReceived({
                                  alreadyClaimed: !!result.alreadyClaimed,
                              });
                          }

                          // If a credential was issued via send-credential event, notify the parent component
                          // Note: check-credential also returns credentialUri but should NOT trigger the modal
                          if (
                              event.type === 'send-credential' &&
                              result.credentialUri &&
                              !result.alreadyClaimed &&
                              onCredentialIssued
                          ) {
                              onCredentialIssued(
                                  result.credentialUri as string,
                                  result.boostUri as string | undefined,
                                  result.credential as VC | VP | undefined
                              );
                          } else if (isSendCredential) {
                              // alreadyClaimed branch (or send-credential without onCredentialIssued
                              // wired) — the modal never mounts, so flush the flow as a terminal
                              // event with whatever phases we captured. `already_claimed` outcome
                              // surfaces in PostHog so we can filter it out of warm-path stats.
                              void markSendCredentialClaimCompleted();
                          }

                          if (event.type === 'send-ai-session-credential') {
                              const { topicCredentialUri, sessionCredentialUri, isNewTopic } =
                                  result;

                              if (topicCredentialUri && isNewTopic) {
                                  try {
                                      const topicCredential = await learnCard.read.get(
                                          topicCredentialUri as string
                                      );
                                      if (topicCredential) {
                                          await storeAndAddVCToWallet(
                                              topicCredential,
                                              { title: topicCredential.name || 'AI Topic' },
                                              'LearnCloud',
                                              true
                                          );
                                      }
                                  } catch (e) {
                                      logError('[AI Topics] Failed to store topic credential:', e);
                                  }
                              }

                              if (sessionCredentialUri) {
                                  try {
                                      const sessionCredential = await learnCard.read.get(
                                          sessionCredentialUri as string
                                      );
                                      if (sessionCredential) {
                                          await storeAndAddVCToWallet(
                                              sessionCredential,
                                              { title: sessionCredential.name || 'AI Session' },
                                              'LearnCloud',
                                              true
                                          );
                                      }
                                  } catch (e) {
                                      logError(
                                          '[AI Topics] Failed to store session credential:',
                                          e
                                      );
                                  }
                              }
                          }

                          // If a notification was sent, trigger the toast overlay
                          if (
                              event.type === 'send-notification' &&
                              result.sent &&
                              onAppNotification
                          ) {
                              onAppNotification({
                                  title: (event as Record<string, unknown>).title as
                                      | string
                                      | undefined,
                                  body: (event as Record<string, unknown>).body as
                                      | string
                                      | undefined,
                                  actionPath: (event as Record<string, unknown>).actionPath as
                                      | string
                                      | undefined,
                                  category: (event as Record<string, unknown>).category as
                                      | string
                                      | undefined,
                                  priority: (event as Record<string, unknown>).priority as
                                      | string
                                      | undefined,
                              });
                          }

                          sdkActivityStore.set.endActivity();
                          return result;
                      }
                    : undefined,
                getAppListingId: appId ? () => appId : undefined,
                getIntegrationForListing: getIntegrationForListing,

                // Learner context - only available when appId is provided
                requestLearnerContext: appId
                    ? async (inputOptions: LearnerContextRequestOptions = {}) => {
                          const startedAt = performance.now();
                          const timings: NonNullable<LearnerContextMetadata['timings']> = {
                              totalMs: 0,
                          };
                          const options = normalizeLearnerContextOptions(inputOptions);
                          const learnCard = await initWallet();

                          if (!learnCard) throw new Error('Wallet not initialized');

                          const sourceStartedAt = performance.now();
                          const source = await fetchLearnerContextSource(learnCard, options);
                          timings.appEventMs = performance.now() - sourceStartedAt;

                          if (options.format === 'structured') {
                              const credentialReadStartedAt = performance.now();
                              const credentials = await resolveLearnerContextCredentials(
                                  learnCard,
                                  source.credentialUris
                              );
                              timings.credentialReadMs =
                                  performance.now() - credentialReadStartedAt;
                              timings.totalMs = performance.now() - startedAt;

                              return {
                                  prompt: '',
                                  raw: {
                                      credentials,
                                      personalData: source.personalData,
                                  },
                                  did: source.did,
                                  displayName: source.displayName,
                                  metadata: {
                                      cacheStatus: 'structured',
                                      timings,
                                  },
                              };
                          }

                          const cacheLookupStartedAt = performance.now();
                          const key = getLearnerContextCacheKey(source, options);
                          const cached = readLearnerContextCache(key);
                          timings.cacheLookupMs = performance.now() - cacheLookupStartedAt;

                          if (cached) {
                              timings.prewarmAgeMs = Date.now() - cached.createdAt;
                              timings.totalMs = performance.now() - startedAt;

                              return {
                                  prompt: cached.prompt,
                                  did: source.did,
                                  displayName: cached.displayName ?? source.displayName,
                                  metadata: {
                                      cacheStatus: 'browser-hit',
                                      timings,
                                      backendMetadata: cached.backendMetadata,
                                  },
                              };
                          }

                          const entry = await fillLearnerContextCache(
                              learnCard,
                              source,
                              options,
                              key,
                              timings
                          );
                          timings.totalMs = performance.now() - startedAt;

                          return {
                              prompt: entry.prompt,
                              did: source.did,
                              displayName: entry.displayName ?? source.displayName,
                              metadata: {
                                  cacheStatus: 'browser-miss',
                                  timings,
                                  backendMetadata: entry.backendMetadata,
                              },
                          };
                      }
                    : undefined,
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
            onAppNotification,
            log,
            logError,
            launchConfig,
            getIntegrationForListing,
            fetchLearnerContextSource,
            fillLearnerContextCache,
            normalizeLearnerContextOptions,
            prewarmLearnerContext,
            resolveLearnerContextCredentials,
        ]
    );

    useEffect(() => {
        if (isLoggedIn) return;

        clearLearnerContextCache();
        learnerContextCacheFills.clear();
        prewarmedCacheKeys.clear();
    }, [isLoggedIn]);

    useEffect(() => {
        if (!isLoggedIn || !appId || !embedOrigin) return;

        void prewarmLearnerContext({
            includeCredentials: true,
            includePersonalData: false,
            format: 'prompt',
            detailLevel: 'compact',
        });
    }, [appId, embedOrigin, isLoggedIn, prewarmLearnerContext]);

    return handlers;
}
