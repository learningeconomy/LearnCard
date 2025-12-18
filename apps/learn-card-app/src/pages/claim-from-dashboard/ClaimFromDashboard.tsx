import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { VC, UnsignedVP } from '@learncard/types';
import {
    IonLoading,
    IonContent,
    IonPage,
    IonRow,
    IonFooter,
    IonToolbar,
    useIonModal,
} from '@ionic/react';

import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import ClaimFromDashboardLoggedOut from './ClaimFromDashboardLoggedOut';
import FatArrow from 'learn-card-base/svgs/FatArrow';
import NewDataSource from './NewDataSource';
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

import useTheme from '../../theme/hooks/useTheme';

export type FromDashboardMetadata = {
    credentialName: string;
    earnerName: string;
    awardedDate: string;
    issuedDate: string;
};

export const ClaimBoostBodyPreviewOverride: React.FC<{ boostVC: VC }> = ({ boostVC }) => {
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();

    const issuer = typeof boostVC.issuer === 'string' ? boostVC.issuer : boostVC?.issuer?.id ?? '';

    const isLCNetworkUrlIssuer = issuer?.includes('did:web');

    const profileId = isLCNetworkUrlIssuer ? getUserHandleFromDid(issuer) : '';
    const { data, isLoading } = useGetProfile(profileId);

    const issuerName = isLCNetworkUrlIssuer ? data?.displayName : getIssuerNameNonBoost(boostVC);
    const issuerImage = isLCNetworkUrlIssuer ? data?.image : getIssuerImageNonBoost(boostVC);
    const dateValue = boostVC?.issuanceDate || boostVC?.validFrom;
    const issueDate = moment(dateValue).format('MMM DD, YYYY');

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

const ClaimFromDashboard: React.FC = () => {
    const [isFront, setIsFront] = useState(true);
    const [loading, setLoading] = useState(false);
    const [claimingCredential, setClaimingCredential] = useState(false);
    const [name, setName] = useState('');
    const [credential, setCredential] = useState<VC | undefined>();
    const [metadata, setMetadata] = useState<FromDashboardMetadata | undefined>();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const queryClient = useQueryClient();
    const registry = useRegistry();

    const history = useHistory();
    const { search } = useLocation();
    const { url, token } = queryString.parse(search);

    const isLoggedIn = useIsLoggedIn();

    const { initWallet, storeAndAddVCToWallet } = useWallet();

    const { presentToast } = useToast();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleRedirectTo = () => {
        const redirectTo = `/claim/from-dashboard?url=${url}&token=${token}`;
        redirectStore.set.lcnRedirect(redirectTo);
        dismissModal();
        history.push('/');
    };

    const [presentModal, dismissModal] = useIonModal(ClaimBoostLoggedOutPrompt, {
        handleCloseModal: () => dismissModal(),
        handleRedirectTo: handleRedirectTo,
    });

    const [presentNewDataSourceModal, dismissNewDataSourceModal] = useIonModal(NewDataSource, {
        handleCloseModal: () => {
            history.push('/home');
            dismissNewDataSourceModal();
        },
        entryId: credential?.id,
    });

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${url}/get-credential-links`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.status !== 200) console.error('Rip lol');
                else {
                    const { links, metadata } = (await res.json()) as {
                        links: {
                            retrievalId: string;
                            directDeepLink: string;
                            vprDeepLink: string;
                            chapiVPR: {
                                challenge: string;
                                domain: string;
                                interact: {
                                    service: [
                                        { serviceEndpoint: string; type: string },
                                        { type: string }
                                    ];
                                };
                                query: { type: string };
                            };
                        }[];
                        metadata: {
                            credentialName: string;
                            earnerName: string;
                            awardedDate: string;
                            issuedDate: string;
                        };
                    };

                    const credentialName = metadata?.credentialName;

                    setName(credentialName);
                    setMetadata(metadata);

                    const wallet = await initWallet();
                    const chapiVpr = links[0]?.chapiVPR;

                    const didAuthVp: UnsignedVP = {
                        '@context': [
                            'https://www.w3.org/2018/credentials/v1',
                            'https://w3id.org/security/suites/ed25519-2020/v1',
                        ],
                        type: ['VerifiablePresentation'],
                        holder: wallet.id.did('key'), // Have to use did:key for now
                    };

                    const vp = await wallet.invoke.issuePresentation(didAuthVp, {
                        domain: chapiVpr.domain,
                        challenge: chapiVpr.challenge,
                        proofPurpose: 'authentication',
                        verificationMethod: await wallet.invoke.didToVerificationMethod(
                            wallet.id.did('key')
                        ),
                    });

                    const credResponse = await fetch(chapiVpr.interact.service[0].serviceEndpoint, {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify(vp),
                    });

                    setCredential(await credResponse.json());
                }
            } catch (error) {
                console.error(error);
            }

            setLoading(false);
        })();
    }, [isLoggedIn]);

    const handleAfterCredentialClaim = () => {
        if (!credential) return;

        const entryForCredential = registry.data?.find(
            entry => entry.membershipId === credential.id
        );

        if (entryForCredential) presentNewDataSourceModal();
        else history?.push('/home');
    };

    const handleClaimCredential = async () => {
        try {
            if (!credential) return;
            setClaimingCredential(true);

            await storeAndAddVCToWallet(credential, { title: name });

            const category = getDefaultCategoryForCredential(credential);
            const achievementType = getAchievementType(credential);

            if (credential) {
                logAnalyticsEvent('claim_boost', {
                    category: category,
                    boostType: achievementType,
                    method: 'Dashboard',
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
            /**
             * Sometimes, when claiming a credential, this error is thrown:
             * TRPCClientError: Record with that ID already exists!
             * Which means the user has this credential.
             * So, it's more of a warning and we can warn them that it already exists, and proceed.
             **/
            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast(`You have already claimed this credential.`, {
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                });

                // We are assuming it is a success since user already has this credential.
                handleAfterCredentialClaim();
            } else {
                presentToast(`Oops, we couldn't claim the credential.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        }
    };

    if (!isLoggedIn) {
        return <ClaimFromDashboardLoggedOut metadata={metadata} />;
    }

    const loadingText = claimingCredential ? 'Claiming Credential' : 'Fetching Credential';

    const isCertificate = credential?.display?.displayType === 'certificate';
    const isID =
        credential?.display?.displayType === 'id' || credential?.hasOwnProperty('boostID') || false;

    const credBackground = credential?.display?.backgroundImage ?? undefined;

    return (
        <IonPage>
            <IonLoading
                mode="ios"
                message={loadingText}
                isOpen={loading || claimingCredential}
                cssClass="[--background:none]"
            />
            <IonContent fullscreen color="grayscale-100">
                <div
                    className={`px-[40px] pb-[100px] vc-preview-modal-safe-area h-full overflow-y-auto ${
                        isID ? '!px-[12px]' : ''
                    }`}
                    style={{
                        backgroundImage: `url(${credBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    {!loading && !credential && (
                        <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <h1 className="text-center text-xl font-bold text-grayscale-800">
                                Eeek!
                            </h1>
                            <strong className="text-center font-medium text-grayscale-600">
                                Unable to find credential
                            </strong>
                        </section>
                    )}
                    {credential && !loading && (
                        <section
                            className={`w-full flex justify-center ${isCertificate ? 'py-16' : ''}`}
                        >
                            <VCDisplayCardWrapper2
                                overrideCardTitle={name}
                                credential={credential}
                                customBodyCardComponent={
                                    <ClaimBoostBodyPreviewOverride boostVC={credential} />
                                }
                                customFooterComponent={<div />}
                                checkProof={false}
                                hideNavButtons
                                isFrontOverride={isFront}
                                setIsFrontOverride={setIsFront}
                            />
                        </section>
                    )}
                </div>
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center p-[15px] ion-no-border absolute bottom-0"
            >
                <IonToolbar color="transparent" mode="ios">
                    <IonRow className="relative z-10 w-full flex flex-nowrap justify-center items-center gap-4">
                        <button
                            onClick={() => history.push('/')}
                            className="w-[50px] h-[50px] min-h-[50px] min-w-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                        >
                            <X className="text-black w-[30px]" />
                        </button>

                        {isLoggedIn && !loading && (
                            <button
                                onClick={handleClaimCredential}
                                className={`flex items-center justify-center bg-${primaryColor} text-white py-2 mr-3 font-bold text-2xl tracking-wider rounded-[40px] shadow-2xl w-[200px] max-w-[320px] ml-2 normal font-poppins`}
                                disabled={claimingCredential}
                            >
                                Accept
                            </button>
                        )}

                        {!isLoggedIn && !loading && (
                            <button
                                onClick={() => {
                                    presentModal({
                                        cssClass:
                                            'center-modal boost-logged-out-confirmation-prompt',
                                        backdropDismiss: true,
                                        showBackdrop: false,
                                    });
                                }}
                                className={`flex items-center justify-center bg-${primaryColor} text-white py-2 mr-3 font-bold text-2xl tracking-wider rounded-[40px] shadow-2xl w-[200px] max-w-[320px] ml-2 normal font-poppins`}
                                disabled={claimingCredential}
                            >
                                Accept
                            </button>
                        )}

                        <button
                            className="bg-grayscale-900 font-poppins text-xl text-white py-[15px] px-[20px] rounded-[20px] flex justify-center items-center gap-[5px] border-[3px] border-solid border-white"
                            onClick={() => setIsFront(!isFront)}
                        >
                            {isFront ? (
                                <FatArrow direction="right" />
                            ) : (
                                <FatArrow direction="left" />
                            )}
                        </button>
                    </IonRow>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default ClaimFromDashboard;
