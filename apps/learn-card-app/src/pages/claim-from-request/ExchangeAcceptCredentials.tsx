import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { VC, VP } from '@learncard/types';
import {
    IonContent,
    IonPage,
    IonFooter,
    IonToolbar,
    IonRow,
    useIonToast,
    IonLoading,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
} from '@ionic/react';

import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import X from 'learn-card-base/svgs/X';

import { useWallet } from 'learn-card-base';
import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { VCAPIRequestStrategy } from './ClaimFromRequest';

import useTheme from '../../theme/hooks/useTheme';

interface ExchangeAcceptCredentialsProps {
    verifiablePresentation: VP; // Contains the verifiablePresentation from the server
    onAccept: (body: any, credentialClaimCount: number) => void; // Callback to continue the exchange
    strategy?: VCAPIRequestStrategy;
}

const ExchangeAcceptCredentials: React.FC<ExchangeAcceptCredentialsProps> = ({
    verifiablePresentation,
    onAccept,
    strategy,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [isFront, setIsFront] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);

    // Normalize credential(s) to always be an array
    const getCredentials = () => {
        const creds = verifiablePresentation?.verifiableCredential;
        if (!creds) return [];
        return Array.isArray(creds) ? creds : [creds];
    };
    const [credentials] = useState<VC[]>(getCredentials());

    const history = useHistory();
    const [presentToast] = useIonToast();
    const { storeAndAddVCToWallet } = useWallet();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const handleClaim = async () => {
        if (credentials.length === 0) return;
        setClaiming(true);

        try {
            await Promise.all(
                credentials.map(credential => {
                    const name = credential.name || 'Credential';
                    const category = getDefaultCategoryForCredential(credential);
                    const achievementType = getAchievementType(credential);

                    logAnalyticsEvent('claim_boost', {
                        category: category,
                        boostType: achievementType,
                        method: 'VC-API Request',
                    });

                    return storeAndAddVCToWallet(credential, { title: name }, 'LearnCloud', true);
                })
            );

            setIsClaimed(true);

            presentToast({
                message: `Successfully claimed ${credentials.length} credential(s)!`,
                duration: 3000,
                position: 'top',
                cssClass: 'login-link-success-toast',
            });

            onAccept({}, credentials.length);
        } catch (e) {
            console.error('Error claiming credential(s)', e);
            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast({
                    message: `You have already claimed this credential.`,
                    duration: 3000,
                    cssClass: 'ion-toast-bottom-nav-offset',
                });
            } else {
                presentToast({
                    message: `Oops, we couldn't claim the credential(s).`,
                    duration: 3000,
                    cssClass: 'login-link-warning-toast ion-toast-bottom-nav-offset',
                });
            }
        } finally {
            setClaiming(false);
        }
    };

    const renderSingleCredential = () => {
        const credential = credentials[0];
        const name = credential.name || 'Credential';

        return (
            <div className="px-[40px] pb-[100px] vc-preview-modal-safe-area h-full overflow-y-auto">
                <section className="w-full flex justify-center py-16">
                    <VCDisplayCardWrapper2
                        overrideCardTitle={name}
                        credential={credential}
                        checkProof={false}
                        hideNavButtons
                        isFrontOverride={isFront}
                        setIsFrontOverride={setIsFront}
                    />
                </section>
            </div>
        );
    };

    const renderMultipleCredentials = () => (
        <IonList>
            <IonListHeader>
                <IonLabel>The following credentials will be added to your wallet:</IonLabel>
            </IonListHeader>
            {credentials.map((cred, index) => (
                <IonItem key={index}>
                    <IonLabel>
                        <h3>{cred.name || 'Unnamed Credential'}</h3>
                        <p>Type: {cred.type.join(', ')}</p>
                        <p>
                            Issuer: {typeof cred.issuer === 'string' ? cred.issuer : cred.issuer.id}
                        </p>
                    </IonLabel>
                </IonItem>
            ))}
        </IonList>
    );

    if (credentials.length === 0) {
        return (
            <IonPage>
                <IonContent fullscreen className="ion-padding">
                    <div className="flex flex-col items-center justify-center h-full">
                        <h1 className="text-xl font-bold">Error</h1>
                        <p>No credential data found to accept.</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonLoading isOpen={claiming} message={'Claiming Credential(s)...'} />
            <IonContent fullscreen color="grayscale-100" className="ion-padding">
                {credentials.length === 1 ? renderSingleCredential() : renderMultipleCredentials()}
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center p-[15px] ion-no-border absolute bottom-0"
            >
                <IonToolbar color="transparent" mode="ios">
                    <IonRow className="relative z-10 w-full flex flex-nowrap justify-center items-center gap-4">
                        <button
                            onClick={() => history.push('/')} // Or some other cancel action
                            className="w-[50px] h-[50px] min-h-[50px] min-w-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                        >
                            <X className="text-black w-[30px]" />
                        </button>

                        <button
                            onClick={handleClaim}
                            disabled={claiming || isClaimed}
                            className={`flex items-center justify-center bg-${primaryColor} text-white py-2 mr-3 font-bold text-2xl tracking-wider rounded-[40px] shadow-2xl w-[200px] max-w-[320px] ml-2 normal font-poppins`}
                        >
                            {isClaimed ? 'Claimed' : 'Accept'}
                        </button>
                    </IonRow>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default ExchangeAcceptCredentials;
