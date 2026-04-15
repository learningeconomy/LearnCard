import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IonContent, IonGrid, IonPage, IonSpinner, IonToggle } from '@ionic/react';
import {
    LEARNCARD_AI_URL,
    LEARNCARD_NETWORK_URL,
    LEARNCLOUD_URL,
    useAuthCoordinator,
    useCurrentUser,
    useWallet,
} from 'learn-card-base';
import { initLearnCard } from '@learncard/init';
import type { VC } from '@learncard/types';
import useShareCredentials from 'learn-card-base/hooks/useShareCredentials';
import ShareCredentialCards from 'learn-card-base/components/sharecreds/ShareCredentialCards';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';

const DEFAULT_AI_URL = LEARNCARD_AI_URL;

type EmbedPhase = 'authenticating' | 'loading-consented-data' | 'review' | 'generating' | 'error';

interface ContextData {
    prompt: string;
    metadata: {
        did: string;
        name?: string;
        [key: string]: unknown;
    };
    structuredContext?: unknown;
    credentials?: unknown[];
}

interface ConsentFlowCredentialRecord {
    uri: string;
    category: string;
}

interface ConsentFlowDataRecord {
    credentials: ConsentFlowCredentialRecord[];
}

interface EmbedContextWallet {
    invoke: {
        getConsentFlowDataForDid: (
            did: string,
            options: { limit: number }
        ) => Promise<{ records: ConsentFlowDataRecord[] }>;
    };
    read: {
        get: (uri: string) => Promise<VC | undefined>;
    };
}

type LearnerContextResponse = {
    prompt?: string;
    metadata?: Record<string, unknown>;
    structuredContext?: unknown;
    error?: string;
};

type EmbedReviewCredential = {
    uri: string;
    category: string;
    title: string;
    description?: string;
    issuerName?: string;
    vc: VC;
};

type ReviewContext = {
    did: string;
    name?: string;
    credentials: EmbedReviewCredential[];
};

const parseEmbedRequest = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const apiKey = urlParams.get('apiKey') ?? '';
    const requestId = urlParams.get('requestId') ?? '';
    const instructions = urlParams.get('instructions') || undefined;
    const detailLevel = urlParams.get('detailLevel') === 'expanded' ? 'expanded' : 'compact';
    const includeRawCredentials = urlParams.get('includeRawCredentials') === 'true';

    return { apiKey, requestId, instructions, detailLevel, includeRawCredentials };
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getPrimaryCredentialSubject = (credential: VC) => {
    const subject = Array.isArray(credential.credentialSubject)
        ? credential.credentialSubject[0]
        : credential.credentialSubject;

    return isObjectRecord(subject) ? subject : undefined;
};

const getAchievementRecord = (credential: VC) => {
    const subject = getPrimaryCredentialSubject(credential);
    const achievement = subject?.achievement;
    return isObjectRecord(achievement) ? achievement : undefined;
};

const getCredentialTitle = (credential: VC, category: string) => {
    if (typeof credential.name === 'string' && credential.name.trim().length > 0) {
        return credential.name.trim();
    }

    const achievementName = getAchievementRecord(credential)?.name;
    if (typeof achievementName === 'string' && achievementName.trim().length > 0) {
        return achievementName.trim();
    }

    return `${category} credential`;
};

const getCredentialDescription = (credential: VC) => {
    if (typeof credential.description === 'string' && credential.description.trim().length > 0) {
        return credential.description.trim();
    }

    const achievementDescription = getAchievementRecord(credential)?.description;
    if (typeof achievementDescription === 'string' && achievementDescription.trim().length > 0) {
        return achievementDescription.trim();
    }

    return undefined;
};

const getCredentialIssuerName = (credential: VC) => {
    if (typeof credential.issuer === 'string' && credential.issuer.trim().length > 0) {
        return credential.issuer.trim();
    }

    if (isObjectRecord(credential.issuer)) {
        const issuerName = credential.issuer.name;
        if (typeof issuerName === 'string' && issuerName.trim().length > 0) {
            return issuerName.trim();
        }

        const issuerId = credential.issuer.id;
        if (typeof issuerId === 'string' && issuerId.trim().length > 0) {
            return issuerId.trim();
        }
    }

    return undefined;
};

const getCredentialSelectionId = (credential: VC, moreUniqueness = '') => {
    if (credential.id && credential.id !== 'http://example.com/credentials/3527') {
        return `${credential.id}`;
    }

    return `${credential.id}-${credential.proof?.proofValue}-${credential.issuanceDate}${
        moreUniqueness ? `-${moreUniqueness}` : ''
    }`;
};

const EmbedContextPage = () => {
    const request = useMemo(parseEmbedRequest, []);
    const [phase, setPhase] = useState<EmbedPhase>('authenticating');
    const [errorMessage, setErrorMessage] = useState('');
    const { state } = useAuthCoordinator();
    const currentUser = useCurrentUser();
    const { initWallet } = useWallet();
    const hasPostedTerminalMessageRef = useRef(false);
    const userDid = currentUser?.did ?? state.did ?? '';

    const postToHost = useCallback(
        (message: Record<string, unknown>, options?: { closeWindow?: boolean }) => {
            if (hasPostedTerminalMessageRef.current) return;

            hasPostedTerminalMessageRef.current = true;

            const targetWindow = window.parent !== window ? window.parent : window.opener;

            targetWindow?.postMessage(message, '*');

            if (options?.closeWindow && window.opener) {
                window.close();
            }
        },
        []
    );

    const postError = useCallback(
        (message: string, code = 'FETCH_ERROR') => {
            postToHost(
                {
                    protocol: 'LEARNCARD_V1',
                    requestId: request.requestId,
                    type: 'ERROR',
                    error: { code, message },
                },
                { closeWindow: false }
            );
        },
        [postToHost, request.requestId]
    );

    const postSuccess = useCallback(
        (data: ContextData) => {
            postToHost(
                {
                    protocol: 'LEARNCARD_V1',
                    requestId: request.requestId,
                    type: 'SUCCESS',
                    data,
                },
                { closeWindow: true }
            );
        },
        [postToHost, request.requestId]
    );

    const postCancel = useCallback(() => {
        postToHost(
            {
                protocol: 'LEARNCARD_V1',
                requestId: request.requestId,
                type: 'ERROR',
                error: {
                    code: 'CANCELLED',
                    message: 'Learner context request cancelled by user.',
                },
            },
            { closeWindow: true }
        );
    }, [postToHost, request.requestId]);

    const postDeclinedNoCredentials = useCallback(() => {
        postToHost(
            {
                protocol: 'LEARNCARD_V1',
                requestId: request.requestId,
                type: 'ERROR',
                error: {
                    code: 'NO_CREDENTIALS_SELECTED',
                    message: 'User declined to share any credentials.',
                },
            },
            { closeWindow: true }
        );
    }, [postToHost, request.requestId]);

    const statusCopy = {
        authenticating: {
            title: 'Signing you in',
            description: 'We are checking your LearnCard session before opening the review step.',
        },
        'loading-consented-data': {
            title: 'Loading your approved data',
            description:
                'We are fetching the consented credential URIs and resolving the records you allowed.',
        },
        review: {
            title: 'Review what will be shared',
            description:
                'Take a quick look at the consented credentials before we format your learner context.',
        },
        generating: {
            title: 'Generating your learner context',
            description: 'Formatting the final prompt now. This can take a moment.',
        },
        error: {
            title: 'We could not open this context',
            description: 'Please try again or refresh the embed to continue.',
        },
    }[phase];

    useEffect(() => {
        if (!request.apiKey || !request.requestId) {
            setPhase('error');
            setErrorMessage('Missing required parameters.');
            postError('Missing required parameters.', 'INVALID_REQUEST');
            return;
        }

        if (state.status === 'idle') {
            const redirectTo = `${window.location.pathname}${window.location.search}`;
            window.location.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
        }
    }, [postError, request.apiKey, request.requestId, state.status]);

    const consentedDataQuery = useQuery<ReviewContext>({
        queryKey: ['getUserConsentedData', request.apiKey, userDid],
        enabled: Boolean(
            request.apiKey && request.requestId && state.status === 'ready' && userDid
        ),
        queryFn: async () => {
            const wallet = (await initLearnCard({
                apiKey: request.apiKey,
                network: LCN_URL || LEARNCARD_NETWORK_URL,
                cloud: { url: CLOUD_URL || LEARNCLOUD_URL },
            })) as unknown as EmbedContextWallet;
            const userWallet = await initWallet();

            const consentedData = await wallet.invoke.getConsentFlowDataForDid(userDid, {
                limit: 50,
            });

            const consentedCredentials = consentedData.records.flatMap(record =>
                record.credentials.map(credential => ({
                    ...credential,
                    category: credential.category || 'Credential',
                }))
            );

            const readableConsentedCredentials = consentedCredentials.filter(
                credential => typeof credential.uri === 'string' && credential.uri.length > 0
            );

            const dedupedConsentedCredentials = Array.from(
                new Map(
                    readableConsentedCredentials.map(credential => [credential.uri, credential])
                ).values()
            );

            const reviewCredentials = (
                await Promise.all(
                    dedupedConsentedCredentials.map(async credential => {
                        const vc = await userWallet.read.get(credential.uri);

                        if (!vc) return null;

                        return {
                            uri: credential.uri,
                            category: credential.category,
                            title: getCredentialTitle(vc, credential.category),
                            description: getCredentialDescription(vc),
                            issuerName: getCredentialIssuerName(vc),
                            vc,
                        } satisfies EmbedReviewCredential;
                    })
                )
            )
                .filter((credential): credential is EmbedReviewCredential => Boolean(credential))
                .sort((a, b) => a.title.localeCompare(b.title));

            return {
                did: userDid,
                name: currentUser?.name,
                credentials: reviewCredentials,
            };
        },
    });

    const allWalletCredentialsQuery = useQuery<VC[]>({
        queryKey: ['embedSelectableCredentials', userDid],
        enabled: Boolean(state.status === 'ready' && userDid),
        queryFn: async () => {
            const wallet = await initWallet();
            const records = [] as { uri: string }[];
            let cursor: string | undefined;

            for (let i = 0; i < 20; i++) {
                const page = await wallet.index.LearnCloud.getPage(undefined, {
                    cursor,
                    limit: 100,
                });
                records.push(...(page?.records ?? []));

                if (!page?.hasMore || !page?.cursor) break;
                cursor = page.cursor;
            }

            return (
                await Promise.all(records.map(async record => await wallet.read.get(record.uri)))
            ).filter(Boolean) as VC[];
        },
    });

    useEffect(() => {
        if (!request.apiKey || !request.requestId) return;

        if (phase === 'generating' || phase === 'error') return;

        if (state.status !== 'ready' || !userDid) {
            setPhase('authenticating');
            return;
        }

        if (consentedDataQuery.isError) {
            const message =
                consentedDataQuery.error instanceof Error
                    ? consentedDataQuery.error.message
                    : 'Unknown error';
            setPhase('error');
            setErrorMessage(message);
            postError(message, 'FETCH_ERROR');
            return;
        }

        if (consentedDataQuery.isSuccess) {
            setPhase('review');
            return;
        }

        setPhase('loading-consented-data');
    }, [
        consentedDataQuery.error,
        consentedDataQuery.isError,
        consentedDataQuery.isSuccess,
        phase,
        postError,
        request.apiKey,
        request.requestId,
        state.status,
        userDid,
    ]);

    const handleConfirm = async () => {
        if (!consentedDataQuery.data || phase === 'generating') return;

        const selectedCredentials = getAllSelectedCredentials();
        const effectiveSelectedCredentials = hasEditedSelection
            ? selectedCredentials
            : preSelectedCredentials;

        if (effectiveSelectedCredentials.length === 0) {
            postDeclinedNoCredentials();
            return;
        }

        try {
            setPhase('generating');

            const reviewContext = consentedDataQuery.data;

            const response = await fetch(`${DEFAULT_AI_URL}/ai/learner-context/format`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credentials: effectiveSelectedCredentials,
                    personalData: {
                        did: reviewContext.did,
                        name: reviewContext.name,
                    },
                    instructions: request.instructions,
                    detailLevel: request.detailLevel,
                    includeStructuredContext: true,
                    maxCredentials: effectiveSelectedCredentials.length,
                }),
            });

            const data = (await response.json().catch(() => null)) as LearnerContextResponse | null;

            if (!response.ok) {
                const backendError =
                    data?.error && data.error.trim().length > 0
                        ? data.error
                        : response.statusText || 'Request failed';
                throw new Error(`Failed to format learner context: ${backendError}`);
            }

            if (!data?.prompt) {
                throw new Error('Failed to format learner context: Empty response body');
            }

            const metadata =
                data.metadata && typeof data.metadata === 'object' ? data.metadata : {};

            const contextData: ContextData = {
                prompt: data.prompt,
                metadata: {
                    did: reviewContext.did,
                    name: reviewContext.name,
                    ...metadata,
                },
                structuredContext: data.structuredContext,
            };

            if (request.includeRawCredentials) {
                contextData.credentials = effectiveSelectedCredentials;
            }

            postSuccess(contextData);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setPhase('error');
            setErrorMessage(message);
            postError(message, 'FORMAT_ERROR');
        }
    };

    const handleCancel = () => {
        postCancel();
    };

    const reviewContext = consentedDataQuery.data ?? null;
    const [hasEditedSelection, setHasEditedSelection] = useState(false);
    const preSelectedCredentials = useMemo(
        () => reviewContext?.credentials.map(credential => credential.vc) ?? [],
        [reviewContext]
    );
    const mergedSelectableCredentials = useMemo(() => {
        const merged = [...preSelectedCredentials, ...(allWalletCredentialsQuery.data ?? [])];
        const deduped = new Map<string, VC>();

        for (const credential of merged) {
            deduped.set(getCredentialSelectionId(credential), credential);
        }

        return Array.from(deduped.values());
    }, [allWalletCredentialsQuery.data, preSelectedCredentials]);
    const {
        totalSelectedCount,
        totalCredentialsCount,
        allSelected,
        handleToggleSelectAll,
        handleToggleSelectAllType,
        handleVcClick,
        loading: selectableCredentialsLoading,
        errorMessage: selectableCredentialsError,
        vcCounts,
        getAllSelected,
        getUniqueId,
        getVcsByType,
        getAllSelectedCredentials,
        isVcSelected,
    } = useShareCredentials(preSelectedCredentials, false, mergedSelectableCredentials);
    const handleToggleSelectAllWithTracking = useCallback(() => {
        setHasEditedSelection(true);
        handleToggleSelectAll();
    }, [handleToggleSelectAll]);
    const handleToggleSelectAllTypeWithTracking = useCallback(
        (vcType: Parameters<typeof handleToggleSelectAllType>[0]) => {
            setHasEditedSelection(true);
            handleToggleSelectAllType(vcType);
        },
        [handleToggleSelectAllType]
    );
    const handleVcClickWithTracking = useCallback(
        (
            uniqueId: Parameters<typeof handleVcClick>[0],
            vcType: Parameters<typeof handleVcClick>[1]
        ) => {
            setHasEditedSelection(true);
            handleVcClick(uniqueId, vcType);
        },
        [handleVcClick]
    );
    const shareCredentialCardsController = useMemo(
        () => ({
            handleToggleSelectAllType: handleToggleSelectAllTypeWithTracking,
            handleVcClick: handleVcClickWithTracking,
            loading: selectableCredentialsLoading,
            getUniqueId,
            vcCounts,
            getAllSelected,
            getVcsByType,
            isVcSelected,
        }),
        [
            handleToggleSelectAllTypeWithTracking,
            handleVcClickWithTracking,
            getAllSelected,
            getUniqueId,
            getVcsByType,
            isVcSelected,
            selectableCredentialsLoading,
            vcCounts,
        ]
    );
    const isReview = phase === 'review';
    const isLoading = phase === 'authenticating' || phase === 'loading-consented-data';
    const isGenerating = phase === 'generating';
    const reviewCount = reviewContext?.credentials.length ?? 0;
    const displayTotalCredentialsCount = Math.max(
        totalCredentialsCount,
        preSelectedCredentials.length
    );
    const effectiveSelectedCount = hasEditedSelection
        ? totalSelectedCount
        : preSelectedCredentials.length;
    const displaySelectedCount = effectiveSelectedCount;

    return (
        <IonPage>
            <IonContent>
                <IonGrid className="embed-context-grid flex w-full items-center justify-center p-[20px] pb-[120px]">
                    <section className="w-full">
                        <div className="flex flex-col gap-[15px] text-grayscale-900">
                            <h1 className="text-[17px] font-[500] leading-[21px]">
                                {statusCopy.title}
                            </h1>
                            <p className="font-[500] text-grayscale-700 leading-[18px]">
                                {statusCopy.description}
                            </p>
                        </div>

                        <hr className="my-[20px]" />

                        <section>
                            {phase === 'error' ? (
                                <div className="mt-[50px]">
                                    <p className="text-red-500 font-bold">
                                        Sorry! There was an error fetching your credentials:{' '}
                                        {errorMessage}
                                    </p>
                                </div>
                            ) : isLoading || isGenerating ? (
                                <div className="w-full h-full flex flex-col opacity-[50%] items-center justify-center mt-[40px]">
                                    <IonSpinner />
                                    <p className="mt-[20px]">{statusCopy.description}</p>
                                </div>
                            ) : isReview ? (
                                <>
                                    <div className="flex flex-col items-center justify-center bg-white gap-[10px] text-[14px] leading-[18px] py-[20px] px-[40px] mt-[7px] mx-[7px] shadow-[0_0_7px_0px_rgba(0,0,0,0.2)] rounded-[10px]">
                                        <ProfilePicture
                                            customContainerClass="flex mr-[10px] flex-shrink-0 border-gray-300 border-[2px] w-[55px] h-[55px] items-center justify-center rounded-full overflow-hidden object-cover text-white font-medium text-4xl"
                                            customImageClass="w-full h-full object-cover flex-shrink-0"
                                            customSize={120}
                                        />
                                        <p className="font-[700] text-grayscale-900">
                                            {currentUser?.name || currentUser?.email}
                                        </p>
                                        <p className="font-[500] text-grayscale-700 text-center">
                                            We preselected {reviewCount} credential
                                            {reviewCount === 1 ? '' : 's'} you already consented to.
                                        </p>
                                        <p className="font-[500] text-grayscale-700 text-center">
                                            You have selected{' '}
                                            <span className="font-[700] text-grayscale-900">
                                                {displaySelectedCount}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-[700] text-grayscale-900">
                                                {displayTotalCredentialsCount}
                                            </span>{' '}
                                            credentials to review.
                                        </p>
                                    </div>

                                    <div className="mt-[15px] text-[14px]">
                                        {selectableCredentialsLoading ? (
                                            <div className="w-full h-full flex flex-col opacity-[50%] items-center justify-center mt-[40px]">
                                                <IonSpinner />
                                                <p className="mt-[20px]">
                                                    Fetching your credentials...
                                                </p>
                                            </div>
                                        ) : selectableCredentialsError ? (
                                            <div className="mt-[50px]">
                                                <p className="text-red-500 font-bold">
                                                    Sorry! There was an error fetching your
                                                    credentials: {selectableCredentialsError}
                                                </p>
                                            </div>
                                        ) : totalCredentialsCount === 0 ? (
                                            <section className="relative flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                                <img
                                                    src={MiniGhost}
                                                    alt="ghost"
                                                    className="max-w-[250px] m-auto mb-[20px]"
                                                />
                                                <div className="flex flex-col gap-[20px] text-grayscale-900 font-[700] font-montserrat">
                                                    <span className="text-[30px]">
                                                        No Credentials
                                                    </span>
                                                    <span className="text-[17px]">
                                                        "Love doesn't just sit there, like a stone,
                                                        it has to be made, like bread; remade all
                                                        the time, made new."
                                                    </span>
                                                </div>
                                            </section>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-center text-[13px] mt-[25px]">
                                                    <span className="mr-[10px] text-[14px] font-semibold">
                                                        Share all credentials
                                                    </span>
                                                    <IonToggle
                                                        slot="end"
                                                        checked={allSelected}
                                                        onClick={() =>
                                                            handleToggleSelectAllWithTracking()
                                                        }
                                                    />
                                                </div>

                                                <ShareCredentialCards
                                                    preSelectedCredentials={preSelectedCredentials}
                                                    controller={shareCredentialCardsController}
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </section>
                    </section>
                </IonGrid>

                {isReview && !selectableCredentialsLoading && (
                    <section className="embed-context-review-actions fixed-bottom-container fixed w-full bottom-[0px] px-[20px] py-[10px] z-[3] h-fit bg-grayscale-50 flex flex items-start justify-center">
                        <div className="flex w-full max-w-[760px] flex-col gap-[10px]">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="w-full rounded-[40px] border border-grayscale-300 bg-white py-[15px] px-[2px] text-grayscale-700 text-[17px] font-bold"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                className={`w-full bg-cyan-700 py-[15px] px-[2px] rounded-[40px] text-grayscale-50 text-[17px] font-bold ${
                                    displaySelectedCount === 0 ? 'bg-grayscale-500 opacity-70' : ''
                                }`}
                                disabled={displaySelectedCount === 0 || isGenerating}
                            >
                                {!isGenerating && 'Confirm and continue'}
                                {isGenerating && 'Generating...'}
                            </button>
                        </div>
                    </section>
                )}
            </IonContent>
        </IonPage>
    );
};

export default EmbedContextPage;
