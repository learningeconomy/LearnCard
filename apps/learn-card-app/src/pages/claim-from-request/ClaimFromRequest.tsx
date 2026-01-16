import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { VC, VP } from '@learncard/types';
import {
    IonLoading,
    IonContent,
    IonPage,
    IonRow,
    IonFooter,
    IonToolbar,
    useIonModal,
    IonButton,
    IonButtons,
    IonCol,
    IonGrid,
    IonHeader,
    IonIcon,
    IonMenuButton,
    IonText,
    IonTitle,
    IonSpinner,
} from '@ionic/react';

import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import FatArrow from 'learn-card-base/svgs/FatArrow';
import X from 'learn-card-base/svgs/X';

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
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';
import useRegistry from 'learn-card-base/hooks/useRegistry';
import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
    getIssuerImageNonBoost,
    getIssuerNameNonBoost,
} from 'learn-card-base/helpers/credentialHelpers';
import { getEmojiFromDidString, getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';

import ExchangePresentationRequest from './ExchangePresentationRequest';
import ExchangeRedirect from './ExchangeRedirect';
import ExchangeAcceptCredentials from './ExchangeAcceptCredentials';
import ExchangeInitiate from './ExchangeInitiate';
import ExchangeDidAuth from './ExchangeDidAuth';
import ExchangeLoading from './ExchangeLoading';

import {
    checkmarkCircleOutline,
    closeCircleOutline,
    homeOutline,
    refreshOutline,
} from 'ionicons/icons';
import { AlertCircle, RefreshCw, Home, HelpCircle, MessageCircle } from 'lucide-react';
import LoggedOutRequest from './LoggedOutRequest';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

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
                            <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
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
const getFriendlyErrorInfo = (errorMessage: string): { title: string; description: string; suggestion: string } => {
    const lowerMessage = errorMessage.toLowerCase();

    // Credential/Boost not found errors
    if (lowerMessage.includes('not found') || lowerMessage.includes('could not find boost')) {
        return {
            title: 'Credential Not Found',
            description: 'The credential you\'re trying to claim doesn\'t exist or is no longer available.',
            suggestion: 'The link may have expired or the credential may have been removed. Contact the issuer for a new link.',
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
            description: 'This credential is still being prepared and isn\'t ready to claim yet.',
            suggestion: 'Check back later or contact the issuer.',
        };
    }

    // Challenge/verification errors
    if (lowerMessage.includes('challenge') || lowerMessage.includes('verification failed')) {
        return {
            title: 'Verification Failed',
            description: 'We couldn\'t verify your identity for this claim.',
            suggestion: 'Try again. If the problem persists, you may need to request a new claim link.',
        };
    }

    // No pending credentials
    if (lowerMessage.includes('no pending credentials')) {
        return {
            title: 'Nothing to Claim',
            description: 'There are no pending credentials waiting for you with this link.',
            suggestion: 'You may have already claimed this credential, or it was sent to a different account.',
        };
    }

    // Invalid exchange ID
    if (lowerMessage.includes('invalid exchange')) {
        return {
            title: 'Invalid Link',
            description: 'This claim link appears to be malformed or corrupted.',
            suggestion: 'Check that you copied the full link, or request a new one from the issuer.',
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
            description: 'The issuer\'s signing setup isn\'t configured correctly for this credential.',
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
        <div className="min-h-full bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
                {/* Header with icon */}
                <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-8 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        {friendlyError.title}
                    </h1>

                    <p className="text-rose-100 text-sm">
                        We couldn't complete your request
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <p className="text-gray-600 text-center text-sm">
                            {friendlyError.description}
                        </p>

                        {/* Suggestion box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
                                What to do
                            </p>

                            <p className="text-sm text-amber-800">
                                {friendlyError.suggestion}
                            </p>
                        </div>

                        {/* Technical details (collapsed by default feeling) */}
                        {errorData && rawErrorMessage !== friendlyError.description && (
                            <details className="group">
                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                                    Show technical details
                                </summary>

                                <div className="mt-2 bg-gray-100 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 font-mono break-words">
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
                            className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>

                        <button
                            onClick={onCancel}
                            className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Go Back Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const queryClient = useQueryClient();
    const registry = useRegistry();

    const history = useHistory();
    const { search } = useLocation();
    const { vc_request_url } = queryString.parse(search);

    const isLoggedIn = useIsLoggedIn();

    const { initWallet, storeAndAddVCToWallet } = useWallet();

    const { presentToast } = useToast();

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
                console.error('Missing required parameters: vc_request_url');
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

            const responseData = await response.json();
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
                            handleAfterCredentialClaim();
                            setExchangeState({ state: ExchangeState.Finished });
                            return;
                        } else {
                            setExchangeState({ state: ExchangeState.DidAuth, data, strategy });
                        }
                }

                // Server sent a Verifiable Presentation, usually containing a verifiableCredential object
            } else if (type === RequestResponseDataType.VerifiablePresentation) {
                setExchangeState({ state: ExchangeState.AcceptCredentials, data, strategy });
                // Server sent a redirect URL
            } else if (type === RequestResponseDataType.RedirectUrl) {
                setExchangeState({ state: ExchangeState.Redirect, data, strategy });
                // Server sent something else: https://w3c-ccg.github.io/vc-api/#participate-in-an-exchange
            } else {
                setExchangeState({
                    state: ExchangeState.Error,
                    data: responseData?.message || 'Unknown response from server',
                });
            }
        } catch (error) {
            console.error('Error in VC-API exchange flow:', error);
            setExchangeState({ state: ExchangeState.Error, data: error });
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            handleRequest(); // Initiate the exchange
        }
    }, [isLoggedIn]);

    const handleAfterCredentialClaim = () => {
        // Navigate to home after claiming
        setExchangeState({ state: ExchangeState.Finished });
        history?.push('/home');
    };

    const handleClaimCredential = async () => {
        try {
            if (!credential) return;
            setClaimingCredential(true);

            // Store credential in LearnCloud Storage and index using LearnCard SDK
            await storeAndAddVCToWallet(credential, { title: name });

            const category = getDefaultCategoryForCredential(credential);
            const achievementType = getAchievementType(credential);

            if (credential) {
                logAnalyticsEvent('claim_boost', {
                    category: category,
                    boostType: achievementType,
                    method: 'VC-API Request',
                });
            }

            setClaimingCredential(false);
            handleAfterCredentialClaim();

            presentToast(`Successfully claimed Credential!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            setClaimingCredential(false);
            console.error('Error claiming credential', e);

            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast(`You have already claimed this credential.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });

                handleAfterCredentialClaim();
            } else {
                presentToast(`Oops, we couldn't claim the credential.`, {
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
