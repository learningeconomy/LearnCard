import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { VC, VP } from '@learncard/types';
import { IonContent, IonPage, useIonModal } from '@ionic/react';

import { getLogger } from 'learn-card-base';
const log = getLogger('claim-from-request');

import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';

import {
    ProfilePicture,
    UserProfilePicture,
    useGetProfile,
    redirectStore,
    useIsLoggedIn,
    useWallet,
    useCurrentUser,
    useToast,
    ToastTypeEnum,
    CredentialCategoryEnum,
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import useRegistry from 'learn-card-base/hooks/useRegistry';
import {
    useAnalytics,
    AnalyticsEvents,
    createFlowLifecycle,
    newFlowId,
    type FlowLifecycle,
} from '@analytics';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
    getIssuerImageNonBoost,
    getIssuerNameNonBoost,
} from 'learn-card-base/helpers/credentialHelpers';
import { getEmojiFromDidString, getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';
import { v4 as uuidv4 } from 'uuid';

import { publishWalletEvent } from '../pathways/events/walletEventBus';
import { CATEGORY_TO_ROUTE } from '../../helpers/categoryRoutes';
import { ROUTE_PRELOAD } from '../../Routes';

import ExchangePresentationRequest from './ExchangePresentationRequest';
import ExchangeRedirect from './ExchangeRedirect';
import ExchangeAcceptCredentials from './ExchangeAcceptCredentials';
import ExchangeInitiate from './ExchangeInitiate';
import ExchangeDidAuth from './ExchangeDidAuth';
import ExchangeLoading from './ExchangeLoading';

import { AlertCircle, RefreshCw, Home, CheckCircle } from 'lucide-react';
import LoggedOutRequest from './LoggedOutRequest';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import * as m from '../../paraglide/messages.js';

export type RequestMetadata = {
    credentialName: string;
    earnerName: string;
    awardedDate: string;
    issuedDate: string;
};

export enum ExchangeState { // For state machine
    Initiate,
    PresentationRequest,
    AcceptCredentials,
    Redirect,
    DidAuth,
    Loading,
    Error,
    Finished,
}

export type ExchangeResponse = {
    // For state machine
    state: ExchangeState;
    data?: any;
    strategy?: VCAPIRequestStrategy;
};

export enum RequestResponseDataType {
    VerifiablePresentationRequest,
    VerifiablePresentation,
    RedirectUrl,
    Unknown,
}
export enum VCAPIRequestStrategy {
    Wrapped,
    Unwrapped,
}

/**
 * Normalizes the response from the server to a common format to support backwards compatibility with older versions of the VC-API.
 * As of VC-API 0.7, the requests and responses are wrapped in an object with a verifiablePresentationRequest, verifiablePresentation, or redirectUrl property.
 * Before VC-API 0.7, the requests and responses were not wrapped in an object, and must be implicitly determined by the shape of the object.
 */
const normalizeRequestResponseData = (
    data = {} as any
): { type: RequestResponseDataType; data: any; strategy: VCAPIRequestStrategy } => {
    if (data?.verifiablePresentationRequest) {
        return {
            type: RequestResponseDataType.VerifiablePresentationRequest,
            data: data.verifiablePresentationRequest,
            strategy: VCAPIRequestStrategy.Wrapped,
        };
    } else if (data?.query && data?.challenge) {
        return {
            type: RequestResponseDataType.VerifiablePresentationRequest,
            data: data,
            strategy: VCAPIRequestStrategy.Unwrapped,
        };
    } else if (data?.verifiablePresentation) {
        return {
            type: RequestResponseDataType.VerifiablePresentation,
            data: data.verifiablePresentation,
            strategy: VCAPIRequestStrategy.Wrapped,
        };
    } else if (data?.hasOwnProperty('@context')) {
        return {
            type: RequestResponseDataType.VerifiablePresentation,
            data: data,
            strategy: VCAPIRequestStrategy.Unwrapped,
        };
    } else if (data?.redirectUrl) {
        return {
            type: RequestResponseDataType.RedirectUrl,
            data: data.redirectUrl,
            strategy: VCAPIRequestStrategy.Wrapped,
        };
    } else {
        return {
            type: RequestResponseDataType.Unknown,
            data: data,
            strategy: VCAPIRequestStrategy.Unwrapped,
        };
    }
};

const ClaimBoostBodyPreviewOverride: React.FC<{ boostVC: VC }> = ({ boostVC }) => {
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();

    const issuer = typeof boostVC.issuer === 'string' ? boostVC.issuer : boostVC?.issuer?.id ?? '';

    const isLCNetworkUrlIssuer = issuer?.includes('did:web');

    const profileId = isLCNetworkUrlIssuer ? getUserHandleFromDid(issuer) : '';
    const { data, isLoading } = useGetProfile(profileId);

    const issuerName = isLCNetworkUrlIssuer ? data?.displayName : getIssuerNameNonBoost(boostVC);
    const issuerImage = isLCNetworkUrlIssuer ? data?.image : getIssuerImageNonBoost(boostVC);

    const { createdAt } = getInfoFromCredential(boostVC, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });
    const issueDate = moment(createdAt).format('MMM DD, YYYY');

    if (isLoggedIn) {
        return (
            <>
                <h3 className="text-[25px] leading-[130%] text-grayscale-900 capitalize">
                    {currentUser?.name}
                </h3>
                <div className="relative">
                    <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                        <ProfilePicture
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
                            customSize={500}
                        />
                    </div>
                    <div className="vc-issuer-image h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px]">
                        {isLCNetworkUrlIssuer || issuerImage ? (
                            <UserProfilePicture
                                user={
                                    isLCNetworkUrlIssuer
                                        ? data
                                        : { image: issuerImage, name: issuerName }
                                }
                                customImageClass="w-full h-full object-cover"
                                customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                                customSize={500}
                            />
                        ) : (
                            <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-grayscale-100 text-emerald-700 font-semibold text-xl">
                                {getEmojiFromDidString(issuer)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                    <span className="created-at text-grayscale-700">{issueDate}</span>
                    <span className="issued-by text-grayscale-900 font-[500]">
                        by <strong className="font-[700] capitalize">{issuerName}</strong>
                    </span>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative">
                <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                    <UserProfilePicture
                        user={data}
                        customImageClass="w-full h-full object-cover"
                        customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
                        customSize={500}
                    />
                </div>
            </div>
            <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                <span className="created-at text-grayscale-700">{issueDate}</span>
                <span className="issued-by text-grayscale-900 font-[500]">
                    by <strong className="font-[700] capitalize">{issuerName}</strong>
                </span>
            </div>
        </>
    );
};

// Map technical error messages to user-friendly explanations
const getFriendlyErrorInfo = (
    errorMessage: string
): { title: string; description: string; suggestion: string } => {
    const lowerMessage = errorMessage.toLowerCase();

    // Credential/Boost not found errors
    if (lowerMessage.includes('not found') || lowerMessage.includes('could not find boost')) {
        return {
            title: 'Credential Not Found',
            description:
                "The credential you're trying to claim doesn't exist or is no longer available.",
            suggestion:
                'The link may have expired or the credential may have been removed. Contact the issuer for a new link.',
        };
    }

    // Expired or invalid claim token
    if (lowerMessage.includes('expired') || lowerMessage.includes('invalid claim token')) {
        return {
            title: 'Link Expired',
            description: 'This claim link has expired or is no longer valid.',
            suggestion: 'Request a new claim link from the issuer.',
        };
    }

    // Draft boost error
    if (lowerMessage.includes('draft')) {
        return {
            title: 'Credential Not Ready',
            description: "This credential is still being prepared and isn't ready to claim yet.",
            suggestion: 'Check back later or contact the issuer.',
        };
    }

    // Challenge/verification errors
    if (lowerMessage.includes('challenge') || lowerMessage.includes('verification failed')) {
        return {
            title: 'Verification Failed',
            description: "We couldn't verify your identity for this claim.",
            suggestion:
                'Try again. If the problem persists, you may need to request a new claim link.',
        };
    }

    // No pending credentials
    if (lowerMessage.includes('no pending credentials')) {
        return {
            title: 'Nothing to Claim',
            description: 'There are no pending credentials waiting for you with this link.',
            suggestion:
                'You may have already claimed this credential, or it was sent to a different account.',
        };
    }

    // Invalid exchange ID
    if (lowerMessage.includes('invalid exchange')) {
        return {
            title: 'Invalid Link',
            description: 'This claim link appears to be malformed or corrupted.',
            suggestion:
                'Check that you copied the full link, or request a new one from the issuer.',
        };
    }

    // Server/issuing errors
    if (lowerMessage.includes('failed to issue') || lowerMessage.includes('internal')) {
        return {
            title: 'Server Error',
            description: 'Something went wrong on our end while processing your claim.',
            suggestion: 'This is usually temporary. Wait a moment and try again.',
        };
    }

    // Signing authority errors
    if (lowerMessage.includes('signing authority')) {
        return {
            title: 'Issuer Configuration Error',
            description:
                "The issuer's signing setup isn't configured correctly for this credential.",
            suggestion: 'Contact the issuer to resolve this issue.',
        };
    }

    // Default fallback
    return {
        title: 'Something Went Wrong',
        description: 'We encountered an unexpected error while processing your request.',
        suggestion: 'Try again, or contact support if the problem persists.',
    };
};

const ExchangeErrorDisplay: React.FC<{
    errorData: any;
    onRetry: () => void;
    onCancel: () => void;
}> = ({ errorData, onRetry, onCancel }) => {
    const rawErrorMessage =
        typeof errorData === 'string'
            ? errorData
            : errorData?.message || 'An unexpected error occurred.';

    const friendlyError = getFriendlyErrorInfo(rawErrorMessage);

    return (
        <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
            <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                {/* Header with icon */}
                <div className="bg-white px-6 py-8 text-center border-b border-grayscale-200">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>

                    <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                        {friendlyError.title}
                    </h1>

                    <p className="text-grayscale-500 text-sm">We couldn't complete your request</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-5 mb-6">
                        <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                            {friendlyError.description}
                        </p>

                        {/* Suggestion box */}
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                                What to do
                            </p>

                            <p className="text-sm text-amber-800 leading-relaxed">
                                {friendlyError.suggestion}
                            </p>
                        </div>

                        {/* Technical details (collapsed by default feeling) */}
                        {errorData && rawErrorMessage !== friendlyError.description && (
                            <details className="group">
                                <summary className="text-xs text-grayscale-400 cursor-pointer hover:text-grayscale-600 transition-colors">
                                    Show technical details
                                </summary>

                                <div className="mt-3 bg-grayscale-100 rounded-xl p-4">
                                    <p className="text-xs text-grayscale-600 font-mono break-words">
                                        {rawErrorMessage}
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => onRetry()}
                            className="w-full py-3 px-4 bg-grayscale-900 text-white font-medium text-sm rounded-[20px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try again
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-4 text-sm text-grayscale-600 font-medium rounded-[20px] hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Go back home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExchangeSuccessDisplay: React.FC<{
    title?: string;
    description?: string;
    onDone: () => void;
}> = ({
    title = 'Shared successfully',
    description = 'Your credentials were shared successfully.',
    onDone,
}) => (
    <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-8 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-white mb-2">{title}</h1>
                <p className="text-emerald-50 text-sm">You're all set</p>
            </div>
            <div className="p-6">
                <p className="text-grayscale-600 text-center text-sm leading-relaxed mb-6">
                    {description}
                </p>
                <button
                    onClick={onDone}
                    className="w-full py-3 px-4 bg-grayscale-900 text-white font-medium text-sm rounded-[20px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    Done
                </button>
            </div>
        </div>
    </div>
);

const ClaimFromRequest: React.FC = () => {
    const [isFront, setIsFront] = useState(true);
    const [loading, setLoading] = useState(false);
    const [claimingCredential, setClaimingCredential] = useState(false);
    const [name, setName] = useState('');
    const [credential, setCredential] = useState<VC | undefined>();
    const [metadata, setMetadata] = useState<RequestMetadata | undefined>();
    const [exchangeState, setExchangeState] = useState<ExchangeResponse>({
        state: ExchangeState.Loading,
    });

    // The credential the user is claiming, captured so that after the exchange
    // completes we can drop them on that credential's wallet category page
    // (e.g. /achievements) instead of the generic passport (all categories).
    const claimedCredentialRef = useRef<VC | undefined>(undefined);

    const { track } = useAnalytics();
    const claimAttemptRef = useRef<FlowLifecycle | null>(null);
    const presentedCredentialIdRef = useRef<string | null>(null);

    const resolvePartnerId = (issuerId?: string) => {
        const profileId = getUserHandleFromDid(issuerId ?? '');
        if (profileId) return profileId;

        try {
            return issuerId ? new URL(issuerId).host || undefined : undefined;
        } catch {
            return undefined;
        }
    };

    const getClaimErrorCode = (e: unknown): string =>
        (e as { code?: string })?.code ??
        (e instanceof Error && e.name !== 'Error' ? e.name : 'unknown');

    const beginClaimAttempt = (claimCredential?: VC) => {
        if (!claimCredential) return null;

        const issuerId =
            typeof claimCredential.issuer === 'string'
                ? claimCredential.issuer
                : claimCredential.issuer?.id;
        const attempt = createFlowLifecycle();

        claimAttemptRef.current = attempt;
        track(AnalyticsEvents.CREDENTIAL_CLAIM_STARTED, {
            flow_id: attempt.id,
            entry_point: 'vc_api_request',
            credential_type: getAchievementType(claimCredential),
            category: getDefaultCategoryForCredential(claimCredential),
            partner_id: resolvePartnerId(issuerId),
            credential_count: 1,
        });

        return attempt;
    };

    const completeClaimAttempt = (
        claimCredential: VC | undefined,
        eventName:
            | typeof AnalyticsEvents.CREDENTIAL_CLAIM_SUCCEEDED
            | typeof AnalyticsEvents.CREDENTIAL_CLAIM_FAILED,
        errorCode?: string
    ) => {
        const attempt = claimAttemptRef.current;
        if (!attempt || !claimCredential || !attempt.terminate()) return;

        const issuerId =
            typeof claimCredential.issuer === 'string'
                ? claimCredential.issuer
                : claimCredential.issuer?.id;

        track(eventName, {
            flow_id: attempt.id,
            entry_point: 'vc_api_request',
            credential_type: getAchievementType(claimCredential),
            category: getDefaultCategoryForCredential(claimCredential),
            partner_id: resolvePartnerId(issuerId),
            credential_count: 1,
            duration_ms: attempt.durationMs(),
            error_code: errorCode,
        });

        claimAttemptRef.current = null;
    };

    useEffect(() => {
        const credentialId = credential?.id;
        if (!credential || !credentialId || presentedCredentialIdRef.current === credentialId)
            return;

        const issuerId =
            typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id;

        presentedCredentialIdRef.current = credentialId;
        track(AnalyticsEvents.CREDENTIAL_CLAIM_PRESENTED, {
            flow_id: newFlowId(),
            entry_point: 'vc_api_request',
            credential_type: getAchievementType(credential),
            category: getDefaultCategoryForCredential(credential),
            partner_id: resolvePartnerId(issuerId),
            credential_count: 1,
        });
    }, [credential, track]);

    const queryClient = useQueryClient();
    const registry = useRegistry();

    const history = useHistory();
    const { search } = useLocation();
    const { vc_request_url } = queryString.parse(search);

    const isLoggedIn = useIsLoggedIn();

    const { initWallet, storeAndAddVCToWallet } = useWallet();

    const { presentToast } = useToast();

    // Resolve the wallet category route for a just-claimed credential (e.g.
    // "/achievements", "/socialBadges"). Falls back to the passport ("/home")
    // when the category can't be resolved.
    const resolvePostClaimRoute = (claimedCredential?: VC): string => {
        if (!claimedCredential) return '/home';
        try {
            const category = getDefaultCategoryForCredential(claimedCredential);
            return CATEGORY_TO_ROUTE[category as CredentialCategoryEnum] ?? '/home';
        } catch (err) {
            log.warn('Failed to resolve post-claim category route', err);
            return '/home';
        }
    };

    // Warm the destination category chunk ahead of navigation. The credential
    // itself is already inserted optimistically into the category list cache by
    // storeAndAddVCToWallet, so warming the lazy route chunk while the user is
    // still on the accept screen makes the post-claim hop feel instant (no
    // Suspense fallback flash). Fire-and-forget.
    const warmPostClaimRoute = (claimedCredential?: VC): void => {
        void ROUTE_PRELOAD[resolvePostClaimRoute(claimedCredential)]?.();
    };

    const handleRedirectTo = () => {
        const redirectTo = `/request?vc_request_url=${vc_request_url}`;
        redirectStore.set.lcnRedirect(redirectTo);
        dismissModal();
        history.push('/');
    };

    const [presentModal, dismissModal] = useIonModal(ClaimBoostLoggedOutPrompt, {
        handleCloseModal: () => dismissModal(),
        handleRedirectTo: handleRedirectTo,
    });

    const handleRequest = async (body: any = {}, credentialClaimCount?: number) => {
        setExchangeState({ state: ExchangeState.Loading });
        try {
            if (!vc_request_url) {
                log.error('Missing required parameters: vc_request_url');
                setExchangeState({ state: ExchangeState.Error, data: 'Missing vc_request_url' });
                return;
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const response = await fetch(vc_request_url as string, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error(`${response.status}`);

            const responseText = await response.text();
            let responseData: any = {};
            if (responseText) {
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    log.warn('Non-JSON exchange response, treating as empty', parseError);
                    responseData = {};
                }
            }
            const { type, data, strategy } = normalizeRequestResponseData(responseData);

            // Server sent a Verifiable Presentation Request
            if (type === RequestResponseDataType.VerifiablePresentationRequest) {
                // Check if it's for specific credentials or general DID Auth
                // This logic might need refinement based on your VPR structure

                const vprType = Array.isArray(data?.query?.[0]?.type)
                    ? data?.query?.[0]?.type[0]
                    : data?.query?.[0]?.type;

                switch (vprType) {
                    case 'QueryByExample':
                        setExchangeState({
                            state: ExchangeState.PresentationRequest,
                            data,
                            strategy,
                        });
                        break;
                    case 'DIDAuthentication':
                    case 'DIDAuth':
                    default:
                        if (credentialClaimCount && credentialClaimCount > 0) {
                            // handleAfterCredentialClaim sets ExchangeState.Finished itself.
                            void handleAfterCredentialClaim();
                            return;
                        } else {
                            setExchangeState({ state: ExchangeState.DidAuth, data, strategy });
                        }
                }

                // Server sent a Verifiable Presentation, usually containing a verifiableCredential object
            } else if (type === RequestResponseDataType.VerifiablePresentation) {
                // Remember the (first) credential being claimed for post-claim routing.
                const vpCreds = data?.verifiableCredential;
                claimedCredentialRef.current = Array.isArray(vpCreds) ? vpCreds[0] : vpCreds;
                // Warm the destination category chunk while the user reviews the
                // card so the post-claim navigation is instant.
                warmPostClaimRoute(claimedCredentialRef.current);
                setExchangeState({ state: ExchangeState.AcceptCredentials, data, strategy });
                // Server sent a redirect URL
            } else if (type === RequestResponseDataType.RedirectUrl) {
                setExchangeState({ state: ExchangeState.Redirect, data, strategy });
                // Server sent something else: https://w3c-ccg.github.io/vc-api/#participate-in-an-exchange
            } else {
                const submittedPresentation =
                    !!body?.verifiablePresentation ||
                    Object.prototype.hasOwnProperty.call(body ?? {}, '@context');
                const isEmptyResponse = !responseData || Object.keys(responseData).length === 0;

                // VC-API: an empty 2xx response after presenting means the exchange completed
                // with no further steps — an implicit success (not an error).
                if (submittedPresentation && isEmptyResponse) {
                    setExchangeState({
                        state: ExchangeState.Finished,
                        data: { description: 'Your credentials were shared successfully.' },
                    });
                    return;
                }

                setExchangeState({
                    state: ExchangeState.Error,
                    data: responseData?.message || 'Unknown response from server',
                });
            }
        } catch (error) {
            log.error('Error in VC-API exchange flow:', error);
            setExchangeState({ state: ExchangeState.Error, data: error });
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            handleRequest(); // Initiate the exchange
        }
    }, [isLoggedIn]);

    const handleAfterCredentialClaim = async (claimedCredential?: VC) => {
        setExchangeState({ state: ExchangeState.Finished });

        // Land the user on the specific wallet category page of the credential
        // they just claimed (not the generic passport) so they see it in context.
        const route = resolvePostClaimRoute(claimedCredential ?? claimedCredentialRef.current);

        // Await the destination chunk before navigating so the current view stays
        // mounted (no Suspense fallback). warmPostClaimRoute already kicked this
        // off when the accept screen appeared, so this usually resolves instantly;
        // cap the wait so a stalled fetch can't block navigation.
        const preload = ROUTE_PRELOAD[route];
        if (preload) {
            await Promise.race([
                preload(),
                new Promise<void>(resolve => setTimeout(resolve, 4000)),
            ]).catch(() => undefined);
        }

        history?.push(route);
    };

    const handleClaimCredential = async () => {
        try {
            if (!credential) return;
            beginClaimAttempt(credential);
            setClaimingCredential(true);

            // Store credential in LearnCloud Storage and index using LearnCard SDK.
            // Capture the returned `credentialUri` so we can publish a
            // `credential-ingested` event to the pathway-progress bus —
            // this is the single-credential VC-API claim path, parallel
            // to the multi-credential path in
            // `ExchangeAcceptCredentials.tsx` and the boost-claim path
            // in `components/boost/mutations.ts`. Without this publish
            // the reactor silently ignores the claim and no pathway
            // nodes flip.
            const storeResult = await storeAndAddVCToWallet(credential, { title: name });

            const category = getDefaultCategoryForCredential(credential);
            const achievementType = getAchievementType(credential);

            if (credential) {
                completeClaimAttempt(credential, AnalyticsEvents.CREDENTIAL_CLAIM_SUCCEEDED);
                track(AnalyticsEvents.CLAIM_BOOST, {
                    category: category,
                    boostType: achievementType,
                    method: 'VC-API Request',
                });
            }

            // Publish the `credential-ingested` event. Wrapped in
            // try/catch: a bad bus listener must never break the core
            // claim flow — the reactor's dedup-by-eventId tolerates a
            // replay sweep that catches anything we drop here.
            if (storeResult?.credentialUri) {
                try {
                    publishWalletEvent({
                        kind: 'credential-ingested',
                        eventId: uuidv4(),
                        credentialUri: storeResult.credentialUri,
                        vc: credential as unknown as Record<string, unknown>,
                        ingestedAt: new Date().toISOString(),
                        source: 'vc-api-request',
                    });
                } catch (err) {
                    log.error('failed to publish ingest event', err);
                }
            }

            setClaimingCredential(false);
            void handleAfterCredentialClaim(credential);

            presentToast(m['toasts.credentialClaimed'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            completeClaimAttempt(
                credential,
                AnalyticsEvents.CREDENTIAL_CLAIM_FAILED,
                getClaimErrorCode(e)
            );
            setClaimingCredential(false);
            log.error('Error claiming credential', e);

            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast(m['toasts.alreadyClaimed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });

                void handleAfterCredentialClaim(credential);
            } else {
                presentToast(m['toasts.claimOops'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    const renderExchangeStep = () => {
        switch (exchangeState.state) {
            case ExchangeState.PresentationRequest:
                return (
                    <ExchangePresentationRequest
                        verifiablePresentationRequest={exchangeState.data}
                        onSubmit={handleRequest}
                        strategy={exchangeState.strategy}
                        onCancel={() => history.push('/')}
                    />
                );
            case ExchangeState.AcceptCredentials:
                return (
                    <ExchangeAcceptCredentials
                        verifiablePresentation={exchangeState.data}
                        onAccept={handleRequest}
                        strategy={exchangeState.strategy}
                    />
                );
            case ExchangeState.Redirect:
                return <ExchangeRedirect redirectUrl={exchangeState.data} />;
            case ExchangeState.DidAuth:
                return (
                    <ExchangeDidAuth
                        verifiablePresentationRequest={exchangeState.data}
                        onSubmit={handleRequest}
                        strategy={exchangeState.strategy}
                    />
                );
            case ExchangeState.Finished:
                return (
                    <ExchangeSuccessDisplay
                        title={exchangeState.data?.title}
                        description={exchangeState.data?.description}
                        onDone={() => history.push('/')}
                    />
                );
            case ExchangeState.Loading:
                return <ExchangeLoading />;
            case ExchangeState.Error:
                return (
                    <ExchangeErrorDisplay
                        errorData={exchangeState.data}
                        onRetry={handleRequest}
                        onCancel={() => history.push('/')}
                    />
                );
            default:
                return <ExchangeInitiate onStart={handleRequest} />;
        }
    };

    if (!isLoggedIn) {
        return <LoggedOutRequest vc_request_url={vc_request_url} />;
    }
    return (
        <IonPage>
            <IonContent>{renderExchangeStep()}</IonContent>
        </IonPage>
    );
};

export default ClaimFromRequest;
