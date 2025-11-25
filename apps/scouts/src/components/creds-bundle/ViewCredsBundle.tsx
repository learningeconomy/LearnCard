import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    IonCol,
    IonContent,
    IonButton,
    IonPage,
    IonRow,
    useIonAlert,
    IonHeader,
    IonToolbar,
    IonSpinner,
} from '@ionic/react';

import { getSortedCredentials, isEntryVC } from 'learn-card-base/helpers/credentialHelpers';
import { initLearnCard } from '@learncard/init';
import { VC, VP } from '@learncard/types';
import { SyncCredentialsVCs, CurvedBackdropEl } from 'learn-card-base';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';

import Coinage from '../../assets/images/smallcoinstack.svg';
import ClockIcon from '../../assets/images/clock.svg';
import CalendarIcon from '../../assets/images/calendar.svg';
import LocationIcon from '../../assets/images/location.svg';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import ShareBoostsBundle from './ShareBoostsBundle';

const ViewCredsBundle: React.FC = () => {
    const { uri, seed } = useParams<{ uri: string; seed: string }>();
    const [vc, setVC] = useState<VP>();
    const [sortedCreds, setSortedCreds] = useState<SyncCredentialsVCs | null>(null);
    const [pin, setPin] = useState<string | number | null>(null);
    const [errMsg, setErrMsg] = useState<string | undefined | null>();
    const [username, setUsername] = useState();
    const [loading, setLoading] = useState<boolean>(true);
    const [presentAlert] = useIonAlert();

    const [credentials, setCredentials] = useState<VC[] | undefined>();

    const [jobMetaData, setJobMetaData] = useState<any>(null);

    const showPinInputAlert = () => {
        presentAlert({
            backdropDismiss: false,
            header: 'Please enter your PIN to access this verified boost bundle.',
            buttons: [
                {
                    text: 'OK',
                    handler: alertData => {
                        if (!alertData?.pin || alertData?.pin?.trim() === '') return false;
                        if (alertData?.pin && alertData?.pin.length > 0) {
                            setPin(alertData.pin);
                        }
                    },
                },
            ],
            inputs: [
                {
                    placeholder: 'PIN (max 4 digits)',
                    name: 'pin',
                    attributes: {
                        maxlength: 4,
                    },
                },
            ],
        });
    };

    // Get credential from ceramic
    const fetchCredential = async (uri: string) => {
        setLoading(true);
        const _seed = `${seed}${pin}`;

        try {
            const wallet = await initLearnCard({ seed: _seed });
            let bundleWalletIndex = await wallet.invoke.getIDXIndex();
            // There should never be more than one in job id in this case
            //const jobId = jobWalletIndex?.jobs?.[0]?.jobId;

            //if (!jobId) throw new Error('No Resume Found');

            const userName = bundleWalletIndex?.bundles?.[0]?.name;
            // const jobData = registry?.find(job => job?.id === jobId);
            setUsername(userName);
            // setJobMetaData(jobData);

            const vcFromCeramic = await wallet.invoke.readContentFromCeramic(uri.split(':')[2]);

            setVC(vcFromCeramic);
            if (vcFromCeramic?.verifiableCredential) {
                // From array of credentials, sort them by type
                setCredentials(vcFromCeramic?.verifiableCredential);
            }
            setLoading(false);
            return vc;
        } catch (e) {
            setLoading(false);
            setErrMsg(`Error: wrong PIN: ${e}`);
            throw new Error(`Error fetching credential: ${e}`);
        }
    };

    useEffect(() => {
        if (!pin) {
            showPinInputAlert();
        }

        if (pin) {
            fetchCredential(uri);
        }
    }, [pin]);

    const websiteLink = 'https://www.learncard.com/#metaversity-app';

    const openWebsite = async () => {
        if (Capacitor.isNativePlatform()) {
            await Browser?.open({ url: websiteLink });
        } else {
            window?.open(websiteLink);
        }
    };

    const handleShowAlertAgain = () => {
        setErrMsg(null);
        setPin(null);
        showPinInputAlert();
    };

    return (
        <IonPage className="metaversity-primary-blue">
            <IonHeader translucent={true}>
                <IonToolbar className="flex">
                    <div className="flex justify-between items-center">
                        <div>
                            <h6
                                onClick={openWebsite}
                                className="text-base tracking-[6px] mx-[20px] font-bold text-mv_red-700 w-full"
                            >
                                LEARN<span className="text-mv_blue-700">CARD</span>
                            </h6>
                        </div>

                        <IonButton className="text-grayscale-600 mr-[20px]" onClick={openWebsite}>
                            Learn More
                        </IonButton>
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent
                fullscreen
                color="metaversity-primary-blue"
                className="metaversity-dark-blue"
            >
                {credentials && <ShareBoostsBundle initialCredentials={credentials} readOnly />}
            </IonContent>
        </IonPage>
    );
};

export default ViewCredsBundle;
