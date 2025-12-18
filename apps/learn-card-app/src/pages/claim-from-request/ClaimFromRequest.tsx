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

const ExchangeErrorDisplay: React.FC<{
    errorData: any;
    onRetry: () => void;
    onCancel: () => void;
}> = ({ errorData, onRetry, onCancel }) => {
    const errorMessage =
        typeof errorData === 'string'
            ? errorData
            : errorData?.message || 'An unexpected error occurred.';

    return (
        <IonGrid
            className="ion-padding ion-text-center w-full flex flex-col items-center"
            style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
        >
            <IonRow className="ion-justify-content-center w-full">
                <IonCol size="12" size-md="8" size-lg="6">
                    <IonIcon
                        icon={closeCircleOutline}
                        color="danger"
                        style={{ fontSize: '64px', marginBottom: '1rem' }}
                    />

                    <IonText color="danger">
                        <h2
                            style={{
                                marginTop: '0.5rem',
                                marginBottom: '1rem',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                            }}
                        >
                            Oops! Something Went Wrong
                        </h2>
                    </IonText>

                    <IonText color="medium" style={{ display: 'block', marginBottom: '1.5rem' }}>
                        <p>We encountered an issue while processing your request.</p>
                        {errorData && (
                            <p style={{ marginTop: '0.5rem' }}>
                                <strong>Details:</strong> {errorMessage}
                            </p>
                        )}
                        <p style={{ marginTop: '0.5rem' }}>
                            Please try again, or you can return to the home page.
                        </p>
                    </IonText>
                </IonCol>
            </IonRow>

            <IonRow
                className="ion-justify-content-center ion-align-items-center w-full"
                style={{ marginTop: '1rem' }}
            >
                <IonCol size="12" size-sm="auto" className="ion-padding-bottom-half">
                    <IonButton
                        onClick={() => onRetry()}
                        expand="block"
                        style={{ minWidth: '150px' }}
                    >
                        <IonIcon slot="start" icon={refreshOutline} />
                        Retry
                    </IonButton>
                </IonCol>
                <IonCol size="12" size-sm="auto">
                    <IonButton
                        onClick={onCancel}
                        color="light"
                        expand="block"
                        style={{ minWidth: '150px' }}
                    >
                        <IonIcon slot="start" icon={homeOutline} />
                        Go Home
                    </IonButton>
                </IonCol>
            </IonRow>
        </IonGrid>
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
