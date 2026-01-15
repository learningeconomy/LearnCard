import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import { useLocation, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

import {
    useIonAlert,
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonFooter,
    IonRow,
} from '@ionic/react';

import Lottie from 'react-lottie-player';
// @ts-ignore
import HourGlass from '../../assets/lotties/hourglass.json';
import MainHeader from '../main-header/MainHeader';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';
import TroopIdDetails from '../../pages/troop/TroopIdDetails/TroopIdDetails';
import ViewTroopIdTemplate from '../../pages/troop/ViewTroopIdTemplate';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import SharedBoostVerificationBlock, {
    SharedBoostVerificationBlockViewMode,
} from './SharedBoostVerificationBlock';

import {
    getDefaultCategoryForCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { getBespokeLearnCard, getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';
import { getWallpaperBackgroundStyles, isTroopCredential } from '../../helpers/troop.helpers';
import { BrandingEnum, useGetProfile, useIsLoggedIn, useModal, ModalTypes } from 'learn-card-base';
import { VC, VerificationItem, VP } from '@learncard/types';

const websiteLink = 'https://pass.scout.org/login';

const ViewSharedBoost: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const { uri, seed, pin } = queryString.parse(location.search);
    const [isFront, setIsFront] = useState(true);
    const [vc, setVC] = useState<VP>();
    const [errMsg, setErrMsg] = useState<string | undefined | null>();
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const [tryRefetch, setTryRefetch] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [presentAlert] = useIonAlert();

    const [boost, setBoost] = useState<VC | undefined>();
    const [category, setCategory] = useState<string>('');
    const [wallet, setWallet] = useState<any>();

    const isTroopId = isTroopCredential(boost as any);
    const issueeDid = (boost as any)?.credentialSubject?.id;
    const issueeProfileId = getUserHandleFromDid(issueeDid ?? '');
    const { data: issueeProfile } = useGetProfile(issueeProfileId);

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const presentVerificationModal = () => {
        newModal(
            <SharedBoostVerificationBlock
                handleCloseModal={() => closeModal()}
                mode={SharedBoostVerificationBlockViewMode.modal}
                verificationItems={verificationItems}
                boost={boost as any}
            />
        );
    };

    // Get credential from ceramic
    const fetchCredential = async (uri: string) => {
        setLoading(true);
        const _seed = `${seed}${pin}`;

        try {
            const wallet = await getBespokeLearnCard(_seed);

            setWallet(wallet);
            const resolvedVc = await wallet.read.get(uri);

            const verifications = await wallet?.invoke?.verifyCredential(
                resolvedVc?.verifiableCredential as any,
                {},
                true
            );

            setVerificationItems(verifications);

            console.log('verifications', verifications);

            setVC(resolvedVc);
            if (resolvedVc?.verifiableCredential) {
                // From array of credentials, sort them by type
                const unwrappedVc = unwrapBoostCredential(resolvedVc.verifiableCredential as any);
                const category = getDefaultCategoryForCredential(unwrappedVc as any);

                setBoost(unwrappedVc as any);
                setCategory(category);
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
                            console.log('Cancel clicked');
                        },
                    },
                ],
            });

            throw new Error(`Error fetching credential: ${e}`);
        }
    };

    useEffect(() => {
        if (pin && uri) {
            fetchCredential(uri as string);
        }
    }, [pin, tryRefetch]);

    const openWebsite = async () => {
        if (Capacitor.isNativePlatform()) {
            await Browser?.open({ url: websiteLink });
        } else {
            window?.open(websiteLink);
        }
    };

    const redirectHome = () => history.push('/');

    const troopBackgroundStyles = getWallpaperBackgroundStyles(undefined, boost as any);
    const troopIdComponent = isFront ? (
        <ViewTroopIdTemplate
            idMainText={issueeProfile?.displayName}
            idThumb={issueeProfile?.image}
            credential={boost as any}
        />
    ) : (
        <div className="w-full max-w-[335px] mx-auto pt-[80px] pb-[120px]">
            <TroopIdDetails
                credential={boost as any}
                verificationItems={verificationItems}
                boostUri={(boost as any)?.boostId}
            //profileId={current user profile id?}
            />
        </div>
    );

    return (
        <IonPage>
            {!isLoggedIn && (
                <IonHeader color="light">
                    <IonToolbar className="flex">
                        <div className="flex justify-between items-center pl-[10px] pr-[10px] py-3 w-full relative">
                            <div className="cursor-pointer" onClick={redirectHome}>
                                <HeaderBranding
                                    branding={BrandingEnum.scoutPass}
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
                                    className="bg-emerald-600 text-white p-2 rounded-full shadow-bottom tracking-wide share-page-get-learncard-btn"
                                    onClick={redirectHome}
                                >
                                    Get ScoutPass
                                </button>
                            </div>
                        </div>
                    </IonToolbar>
                </IonHeader>
            )}
            {isLoggedIn && <MainHeader showSideMenuButton branding={BrandingEnum.scoutPass} />}
            <IonContent fullscreen className="share-page">
                {/* verification block */}
                {boost && wallet && !loading && (
                    <SharedBoostVerificationBlock
                        verificationItems={verificationItems}
                        boost={boost as any}
                    />
                )}

                {loading && (
                    <div className="relative w-full h-full text-center flex flex-col items-center justify-center">
                        <div className="max-w-[200px] mt-[-50px]">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                )}
                {boost && wallet && !loading && (
                    <section
                        className={`relative w-full h-full text-left flex flex-col items-center justify-start pt-4 overflow-y-scroll pb-[100px] ${category === 'ID' ? 'px-[12px]' : 'px-[32px]'
                            } ]`}
                        style={isTroopId ? troopBackgroundStyles : undefined}
                    >
                        {/* 
                           // TODO: FIX THE NAV BUTTON FOR CERTIFICATES  
                        */}
                        <SharedBoostVerificationBlock
                            mode={SharedBoostVerificationBlockViewMode.mini}
                            verificationItems={verificationItems}
                            boost={boost as any}
                            handleOnClick={presentVerificationModal}
                        />

                        {isTroopId ? (
                            troopIdComponent
                        ) : (
                            <VCDisplayCardWrapper2
                                credential={boost as any}
                                lc={wallet}
                                hideNavButtons
                                hideQRCode
                                brandingEnum={BrandingEnum.scoutPass}
                                isFrontOverride={isFront}
                                setIsFrontOverride={setIsFront}
                            />
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
