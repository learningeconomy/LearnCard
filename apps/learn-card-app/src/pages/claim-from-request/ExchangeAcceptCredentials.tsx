import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { VC, VP } from '@learncard/types';
import {
    IonContent,
    IonPage,
    IonFooter,
    IonToolbar,
    IonRow,
    IonLoading,
} from '@ionic/react';
import { Gift, Check, X as XIcon, Loader2 } from 'lucide-react';

import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import X from 'learn-card-base/svgs/X';

import { useWallet, useToast, ToastTypeEnum, BoostPageViewMode } from 'learn-card-base';
import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { BoostEarnedCard } from '../../components/boost/boost-earned-card/BoostEarnedCard';

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

    // Track selected credentials - all selected by default
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
        () => new Set(credentials.map((_, i) => i))
    );

    const toggleCredentialSelection = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const selectedCredentials = credentials.filter((_, i) => selectedIndices.has(i));

    const history = useHistory();
    const { presentToast } = useToast();
    const { storeAndAddVCToWallet } = useWallet();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const handleClaim = async () => {
        if (selectedCredentials.length === 0) {
            presentToast('Please select at least one credential to claim.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }
        setClaiming(true);

        try {
            await Promise.all(
                selectedCredentials.map(credential => {
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

            presentToast(`Successfully claimed ${selectedCredentials.length} credential(s)!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            onAccept({}, selectedCredentials.length);
        } catch (e) {
            console.error('Error claiming credential(s)', e);
            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast(`You have already claimed this credential.`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } else {
                presentToast(`Oops, we couldn't claim the credential(s).`, {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
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
        <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50 pb-[120px]">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                        <Gift className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {credentials.length} Credentials Ready to Claim
                    </h1>

                    <p className="text-gray-600 text-sm max-w-md mx-auto">
                        Tap each credential to select or deselect it. 
                        Only selected credentials will be added to your wallet.
                    </p>
                </div>

                {/* Credentials Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                    {credentials.map((cred, index) => (
                        <div key={index} className="w-[160px]">
                            <BoostEarnedCard
                                credential={cred}
                                categoryType={getDefaultCategoryForCredential(cred) || 'achievement'}
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                showChecked={true}
                                initialCheckmarkState={selectedIndices.has(index)}
                                onCheckMarkClick={() => toggleCredentialSelection(index)}
                                className={`shadow-md transition-all ${
                                    selectedIndices.has(index) 
                                        ? 'ring-2 ring-emerald-500 ring-offset-2' 
                                        : 'opacity-60'
                                }`}
                            />
                        </div>
                    ))}
                </div>

                {/* Summary footer */}
                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedCredentials.length > 0 ? 'bg-emerald-100' : 'bg-gray-100'
                            }`}>
                                <Check className={`w-5 h-5 ${
                                    selectedCredentials.length > 0 ? 'text-emerald-600' : 'text-gray-400'
                                }`} />
                            </div>

                            <div>
                                <p className="font-medium text-gray-900">
                                    {selectedCredentials.length} of {credentials.length} credential{credentials.length !== 1 ? 's' : ''} selected
                                </p>

                                <p className="text-sm text-gray-500">
                                    {selectedCredentials.length === 0 
                                        ? 'Select at least one to continue'
                                        : 'These will be added to your wallet'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Select all / Deselect all toggle */}
                        <button
                            onClick={() => {
                                if (selectedCredentials.length === credentials.length) {
                                    setSelectedIndices(new Set());
                                } else {
                                    setSelectedIndices(new Set(credentials.map((_, i) => i)));
                                }
                            }}
                            className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                        >
                            {selectedCredentials.length === credentials.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
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
