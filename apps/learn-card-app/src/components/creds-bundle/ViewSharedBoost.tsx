import React, { useState, useEffect } from 'react';
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
import HourGlass from '../../assets/lotties/hourglass.json';
import MainHeader from '../main-header/MainHeader';
import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import SharedBoostPageFooter from './SharedBoostPageFooter';

import { VC, VerificationItem, VP } from '@learncard/types';
import {
    getDefaultCategoryForCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { BrandingEnum, useGetCredentialWithEdits, useIsLoggedIn } from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

const websiteLink = 'https://learncard.app/login';

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

    const [boost, setBoost] = useState<VC[] | undefined>();
    const [category, setCategory] = useState<string>('');
    const [wallet, setWallet] = useState<any>();

    const { credentialWithEdits } = useGetCredentialWithEdits(boost, uri);
    let _boost = credentialWithEdits ?? boost;

    // Get credential from ceramic
    const fetchCredential = async (uri: string) => {
        setLoading(true);
        const _seed = `${seed}${pin}`;

        try {
            const wallet = await getBespokeLearnCard(_seed);

            setWallet(wallet);
            const resolvedVc = await wallet.read.get(uri);

            console.log({ resolvedVc, uri });

            const verifications = await wallet?.invoke?.verifyCredential(
                resolvedVc?.verifiableCredential,
                {},
                true
            );

            setVerificationItems(verifications);

            setVC(resolvedVc);
            if (resolvedVc?.verifiableCredential) {
                // From array of credentials, sort them by type
                const unwrappedVc = unwrapBoostCredential(resolvedVc.verifiableCredential);
                const category = getDefaultCategoryForCredential(unwrappedVc);

                setBoost(unwrappedVc);
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
            fetchCredential((uri as string).replace('localhost:', 'localhost%3A'));
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
                                animationData={HourGlass}
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

                        <VCDisplayCardWrapper2
                            credential={_boost}
                            lc={wallet}
                            hideNavButtons
                            hideQRCode
                            hideFrontFaceDetails
                            isFrontOverride={isFront}
                            setIsFrontOverride={setIsFront}
                        />
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
