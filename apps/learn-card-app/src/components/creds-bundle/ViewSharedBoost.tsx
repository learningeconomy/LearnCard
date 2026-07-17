import React, { useMemo, useState, useEffect } from 'react';
import queryString from 'query-string';
import { useLocation, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import {
    IonContent,
    IonFooter,
    IonRow,
    IonPage,
    useIonAlert,
    IonHeader,
    IonToolbar,
    useIonModal,
} from '@ionic/react';
import SharedBoostVerificationBlock, {
    SharedBoostVerificationBlockViewMode,
} from './SharedBoostVerificationBlock';
import Lottie from 'react-lottie-player';
const HourGlass = '/lotties/hourglass.json';
import MainHeader from '../main-header/MainHeader';
import EndorsementRequestModal from '../boost-endorsements/EndorsementRequestModal/EndorsementRequestModal';
import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import SharedBoostPageFooter from './SharedBoostPageFooter';
import ClrTranscriptFullPage from '../clr-transcript/surfaces/ClrTranscriptFullPage';

import { VC, VerificationItem, VP } from '@learncard/types';
import {
    getDefaultCategoryForCredential,
    getEndorsementsFromPresentations,
    isClrCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    ClrTranscriptSurface,
    normalizeClrTranscriptDisplayModel,
} from '../../helpers/clrRenderer.helpers';
import { BrandingEnum, useGetCredentialWithEdits, useIsLoggedIn } from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import {
    deriveLifecycleStatus,
    CredentialLifecycleStatus,
} from '../../hooks/deriveLifecycleStatus';
import endorsementsRequestStore from '../../stores/endorsementsRequestStore';
import EndorsementDraftRequestSuccess from '../boost-endorsements/EndorsementRequestForm/EndorsementDraftRequestSuccess';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';

const websiteLink = `${getAppBaseUrl()}/login`;

import { getLogger } from 'learn-card-base';
const log = getLogger('view-shared-boost');

const ViewSharedBoost: React.FC<{
    showEndorsementRequest?: boolean;
    showDraftSuccess?: boolean;
}> = ({ showEndorsementRequest, showDraftSuccess }) => {
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const { uri: _uri, seed: _seed, pin: _pin } = queryString.parse(location.search);
    const [isFront, setIsFront] = useState(true);
    const [vc, setVC] = useState<VP>();
    const [errMsg, setErrMsg] = useState<string | undefined | null>();
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const [lifecycleStatus, setLifecycleStatus] = useState<CredentialLifecycleStatus>('active');
    const [tryRefetch, setTryRefetch] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    // endorsements data
    const [shareLinkInfo, setShareLinkInfo] = useState<string>('');
    const [existingEndorsements, setExistingEndorsements] = useState<VC[] | null>(null);

    const draftEndorsementRequest = endorsementsRequestStore.useTracked.endorsementRequest();
    const draftEndorseRequestVC = endorsementsRequestStore.useTracked.credentialInfo();

    const uri = draftEndorseRequestVC?.uri || _uri;
    const seed = draftEndorseRequestVC?.seed || _seed;
    const pin = draftEndorseRequestVC?.pin || _pin;

    const [presentAlert] = useIonAlert();

    const [boost, setBoost] = useState<VC[] | undefined>();
    const [category, setCategory] = useState<string>('');
    const [wallet, setWallet] = useState<any>();

    const { credentialWithEdits } = useGetCredentialWithEdits(boost, uri);
    let _boost = credentialWithEdits ?? boost;
    const sharedCredential = Array.isArray(_boost) ? _boost[0] : _boost;
    const isSharedClrCredential = sharedCredential
        ? isClrCredential(sharedCredential as VC)
        : false;
    const clrModel = useMemo(
        () =>
            isSharedClrCredential && sharedCredential
                ? normalizeClrTranscriptDisplayModel(
                      sharedCredential as unknown as Record<string, unknown>
                  )
                : null,
        [sharedCredential, isSharedClrCredential]
    );

    // Get credential from ceramic
    const fetchCredential = async (uri: string) => {
        setLoading(true);
        const _seed = `${seed}${pin}`;

        try {
            const wallet = await getBespokeLearnCard(_seed);

            setWallet(wallet);
            const resolvedVc = await wallet.read.get(uri);

            const credentialToVerify = Array.isArray(resolvedVc?.verifiableCredential)
                ? resolvedVc?.verifiableCredential[0]
                : resolvedVc?.verifiableCredential;

            const verifications = await wallet?.invoke?.verifyCredential(
                credentialToVerify,
                {},
                true
            );

            setVerificationItems(verifications);

            // Derive revoked/suspended lifecycle status from a raw verification check
            // (prettify=false) using the same bespoke wallet, so the shared card can reflect
            // it. Fail-open to 'active' so a check error never renders a valid credential as
            // revoked.
            try {
                const rawCheck = await (wallet?.invoke?.verifyCredential as any)?.(
                    credentialToVerify,
                    {},
                    false
                );
                setLifecycleStatus(deriveLifecycleStatus(rawCheck));
            } catch {
                setLifecycleStatus('active');
            }

            setVC(resolvedVc);
            if (resolvedVc?.verifiableCredential) {
                // From array of credentials, sort them by type
                const credential = Array.isArray(resolvedVc?.verifiableCredential)
                    ? resolvedVc?.verifiableCredential[0]
                    : resolvedVc?.verifiableCredential;

                const endorsements = getEndorsementsFromPresentations(
                    resolvedVc?.verifiableCredential
                );
                const unwrappedVc = unwrapBoostCredential(credential);
                const category = getDefaultCategoryForCredential(unwrappedVc);

                setBoost(unwrappedVc);
                setCategory(category);
                setExistingEndorsements(endorsements);
            }
            setLoading(false);
            return vc;
        } catch (e) {
            setLoading(false);
            setErrMsg(`Error: wrong PIN: ${e}`);

            presentAlert({
                backdropDismiss: false,
                cssClass: 'boost-confirmation-alert',
                header: `Error fetching credential: ${e}`,
                buttons: [
                    {
                        text: 'OK',
                        role: 'confirm',
                        handler: async () => {
                            setTryRefetch(!tryRefetch);
                        },
                    },
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            log.info('Cancel clicked');
                        },
                    },
                ],
            });

            throw new Error(`Error fetching credential: ${e}`);
        }
    };

    useEffect(() => {
        if (pin && uri) {
            fetchCredential((uri as string).replace('localhost:', 'localhost%3A'));
            setShareLinkInfo(`uri=${uri}&seed=${seed}&pin=${pin}`);
        }
    }, [pin, tryRefetch]);

    const [presentModal, dismissModal] = useIonModal(SharedBoostVerificationBlock, {
        handleCloseModal: () => dismissModal(),
        mode: SharedBoostVerificationBlockViewMode.modal,
        verificationItems: verificationItems,
        boost: boost,
    });

    const openWebsite = async () => {
        if (Capacitor.isNativePlatform()) {
            await Browser?.open({ url: websiteLink });
        } else {
            window?.open(websiteLink);
        }
    };

    const redirectHome = () => history.push('/');

    // Revoked/suspended visual treatment for the shared card. Mirrors the shared
    // getLifecycleTreatment helper (kept inline here to avoid a cross-package import
    // for a distinct card surface). Inline filter style so it applies regardless of
    // Tailwind scanning.
    const isInactiveCredential = lifecycleStatus === 'revoked' || lifecycleStatus === 'suspended';
    const inactiveMediaStyle: React.CSSProperties | undefined = isInactiveCredential
        ? { filter: 'grayscale(1) brightness(0.9)' }
        : undefined;
    const lifecyclePillBg = lifecycleStatus === 'suspended' ? '#EA580C' : '#DC2626';
    const lifecyclePillLabel = lifecycleStatus === 'suspended' ? 'Suspended' : 'Revoked';

    if (showEndorsementRequest) {
        return (
            <EndorsementRequestModal
                credential={_boost}
                shareLinkInfo={shareLinkInfo}
                existingEndorsements={existingEndorsements}
            />
        );
    }

    if (showDraftSuccess) {
        return (
            <EndorsementDraftRequestSuccess credential={_boost} categoryType={category} autoSend />
        );
    }

    return (
        <IonPage>
            {!isLoggedIn && (
                <IonHeader color="light">
                    <IonToolbar className="flex">
                        <div className="flex justify-between items-center pl-[10px] pr-[10px] py-3 w-full relative">
                            <div className="cursor-pointer" onClick={redirectHome}>
                                <HeaderBranding
                                    branding={BrandingEnum.learncard}
                                    className="main-header-branding-public-route"
                                />
                            </div>

                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="text-grayscale-900 mr-[20px] text-lg"
                                    onClick={redirectHome}
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    className="bg-emerald-600 text-white p-2 rounded-full shadow-bottom normal font-poppins text-xl tracking-wide share-page-get-learncard-btn"
                                    onClick={redirectHome}
                                >
                                    Get LearnCard
                                </button>
                            </div>
                        </div>
                    </IonToolbar>
                </IonHeader>
            )}
            {isLoggedIn && <MainHeader showSideMenuButton />}
            <IonContent fullscreen className="share-page">
                {/* verification block */}
                {boost && wallet && !loading && (
                    <SharedBoostVerificationBlock
                        verificationItems={verificationItems}
                        boost={boost}
                    />
                )}

                {loading && (
                    <div className="relative w-full h-full text-center flex flex-col items-center justify-center">
                        <div className="max-w-[200px] mt-[-50px]">
                            <Lottie
                                loop
                                path={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                )}
                {boost && wallet && !loading && (
                    <section
                        className={`relative w-full h-full text-left flex flex-col items-center justify-start pt-4 overflow-y-scroll pb-[100px] ${
                            category === 'ID' ? 'px-[12px]' : 'px-[32px]'
                        } ]`}
                    >
                        {/* 
                           // TODO: FIX THE NAV BUTTON FOR CERTIFICATES  
                        */}
                        <SharedBoostVerificationBlock
                            mode={SharedBoostVerificationBlockViewMode.mini}
                            verificationItems={verificationItems}
                            boost={boost}
                            handleOnClick={presentModal}
                        />

                        {isSharedClrCredential && clrModel && sharedCredential ? (
                            <ClrTranscriptFullPage
                                model={clrModel}
                                boost={sharedCredential as VC}
                                boostUri={typeof uri === 'string' ? uri : undefined}
                                options={{
                                    viewer: 'student',
                                    surface: ClrTranscriptSurface.Full,
                                }}
                            />
                        ) : (
                            <div className="relative w-full flex flex-col items-center">
                                {/* Pill sits OUTSIDE the desaturated wrapper so it stays
                                    colored (a parent CSS filter would grayscale it too). */}
                                {isInactiveCredential && (
                                    <span
                                        className="mb-3 rounded-full px-[14px] py-[4px] text-[12px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
                                        style={{ backgroundColor: lifecyclePillBg }}
                                        data-testid="shared-boost-lifecycle-pill"
                                    >
                                        {lifecyclePillLabel}
                                    </span>
                                )}
                                <div
                                    className="w-full flex flex-col items-center"
                                    style={inactiveMediaStyle}
                                >
                                    <VCDisplayCardWrapper2
                                        credential={_boost}
                                        lc={wallet}
                                        hideNavButtons
                                        hideQRCode
                                        hideFrontFaceDetails
                                        isFrontOverride={isFront}
                                        setIsFrontOverride={setIsFront}
                                        lifecycleStatus={lifecycleStatus}
                                    />
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <IonFooter
                    mode="ios"
                    className="w-full flex justify-center items-center ion-no-border absolute bottom-0"
                >
                    <IonRow className="relative z-10 w-full flex justify-center items-center gap-8">
                        <BoostFooter
                            handleDetails={isFront ? () => setIsFront(!isFront) : undefined}
                            handleBack={!isFront ? () => setIsFront(!isFront) : undefined}
                        />
                    </IonRow>
                </IonFooter>
            </IonContent>
        </IonPage>
    );
};

export default ViewSharedBoost;
