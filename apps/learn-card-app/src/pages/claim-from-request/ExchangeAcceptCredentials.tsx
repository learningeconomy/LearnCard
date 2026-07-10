import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { VC, VP } from '@learncard/types';
import { IonContent, IonPage, IonFooter, IonToolbar, IonRow, IonLoading } from '@ionic/react';
import { Gift, Check, X as XIcon, AlertCircle, Home, HelpCircle } from 'lucide-react';

import { getLogger } from 'learn-card-base';
const log = getLogger('exchange-accept-credentials');

import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import X from 'learn-card-base/svgs/X';

import { useWallet, useToast, ToastTypeEnum, BoostPageViewMode } from 'learn-card-base';
import {
    useAnalytics,
    AnalyticsEvents,
    ProfileBuildMethod,
    useProfileSnapshotCapture,
    ACCOUNT_CREATED_AT_KEY,
    SESSION_START_KEY,
} from '@analytics';
import { v4 as uuidv4 } from 'uuid';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { BoostEarnedCard } from '../../components/boost/boost-earned-card/BoostEarnedCard';
import { publishWalletEvent } from '../pathways/events/walletEventBus';

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
    const { track } = useAnalytics();
    const { capture, snapshotRef } = useProfileSnapshotCapture();
    const flowStartedAt = useRef(Date.now());

    const handleClaim = async () => {
        if (selectedCredentials.length === 0) {
            presentToast('Please select at least one credential to claim.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }
        setClaiming(true);
        // LC-1853: freeze pre-mutation profile snapshot for accurate totalItemsAfter.
        capture();

        try {
            // Capture the stored credential URIs so we can publish
            // a `credential-ingested` bus event for each one. Without
            // this, the VC-API `/request` claim path silently skips
            // the pathway-progress reactor — unlike the
            // `useAddCredentialToWallet` mutation (in
            // `apps/learn-card-app/src/components/boost/mutations.ts`)
            // which publishes the event in `onSuccess`. Exchange
            // acceptance calls `storeAndAddVCToWallet` directly, so
            // we do the publish inline here.
            const storeResults = await Promise.all(
                selectedCredentials.map((credential, i) => {
                    const name = credential.name || 'Credential';
                    const category = getDefaultCategoryForCredential(credential);
                    const achievementType = getAchievementType(credential);

                    track(AnalyticsEvents.CLAIM_BOOST, {
                        category: category,
                        boostType: achievementType,
                        method: 'VC-API Request',
                        msSinceMethodStarted: Date.now() - flowStartedAt.current,
                    });

                    const now = Date.now();
                    const sessionStart = Number(localStorage.getItem(SESSION_START_KEY) ?? now);
                    const accountCreatedAt = Number(
                        localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? now
                    );
                    track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
                        method: ProfileBuildMethod.VcApiRequest,
                        itemType: 'credential',
                        itemCount: 1,
                        // LC-1853: increment per credential within this batch.
                        totalItemsAfter: snapshotRef.current.credentialCount + 1 + i,
                        msSinceAccountCreated: now - accountCreatedAt,
                        msSinceSessionStart: now - sessionStart,
                    });

                    return storeAndAddVCToWallet(credential, { title: name }, 'LearnCloud', true);
                })
            );

            // Publish one `credential-ingested` event per claimed
            // VC. Wrapped in try/catch (matching
            // `useAddCredentialToWallet`): a corrupted VC or a bad
            // bus listener must never break the core claim flow —
            // the reactor's dedup-by-eventId tolerates a future
            // replay sweep that catches anything we drop here.
            selectedCredentials.forEach((credential, index) => {
                const credentialUri = storeResults[index]?.credentialUri;

                if (!credentialUri) return;

                try {
                    publishWalletEvent({
                        kind: 'credential-ingested',
                        eventId: uuidv4(),
                        credentialUri,
                        vc: credential as unknown as Record<string, unknown>,
                        ingestedAt: new Date().toISOString(),
                        source: 'vc-api-exchange',
                    });
                } catch (err) {
                    log.error('failed to publish ingest event', err);
                }
            });

            setIsClaimed(true);

            presentToast(`Successfully claimed ${selectedCredentials.length} credential(s)!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            onAccept({}, selectedCredentials.length);
        } catch (e) {
            log.error('Error claiming credential(s)', e);
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
        <div className="min-h-full bg-grayscale-100 pb-[120px] font-poppins">
            <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in-up">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-grayscale-200">
                        <Gift className="w-8 h-8 text-emerald-600" />
                    </div>

                    <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                        {credentials.length} credentials ready to claim
                    </h1>

                    <p className="text-grayscale-600 text-sm max-w-md mx-auto leading-relaxed">
                        Tap each credential to select or deselect it. Only selected credentials will
                        be added to your account.
                    </p>
                </div>

                {/* Credentials Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                    {credentials.map((cred, index) => (
                        <div key={index} className="w-[160px]">
                            <BoostEarnedCard
                                credential={cred}
                                categoryType={
                                    getDefaultCategoryForCredential(cred) || 'achievement'
                                }
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
                <div className="mt-6 p-5 bg-white rounded-[20px] border border-grayscale-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    selectedCredentials.length > 0
                                        ? 'bg-emerald-50'
                                        : 'bg-grayscale-100'
                                }`}
                            >
                                <Check
                                    className={`w-5 h-5 ${
                                        selectedCredentials.length > 0
                                            ? 'text-emerald-600'
                                            : 'text-grayscale-400'
                                    }`}
                                />
                            </div>

                            <div>
                                <p className="font-medium text-grayscale-900 text-sm">
                                    {selectedCredentials.length} of {credentials.length} credential
                                    {credentials.length !== 1 ? 's' : ''} selected
                                </p>

                                <p className="text-sm text-grayscale-500">
                                    {selectedCredentials.length === 0
                                        ? 'Select at least one to continue'
                                        : 'These will be added to your account'}
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
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            {selectedCredentials.length === credentials.length
                                ? 'Deselect all'
                                : 'Select all'}
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
                    <div className="min-h-full bg-grayscale-100 flex items-center justify-center p-4 font-poppins">
                        <div className="bg-white rounded-[20px] shadow-xl max-w-md w-full overflow-hidden safe-area-top-margin animate-fade-in-up">
                            {/* Header with icon */}
                            <div className="bg-white px-6 py-8 text-center border-b border-grayscale-200">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>

                                <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                                    No credentials found
                                </h1>

                                <p className="text-grayscale-500 text-sm">
                                    This link doesn't contain any credentials
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="space-y-5 mb-6">
                                    <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                                        The credential link you followed doesn't have any
                                        credentials to claim. This could happen if:
                                    </p>

                                    <ul className="text-sm text-grayscale-600 space-y-2 pl-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            The credential has already been claimed
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            The link has expired
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            The sender removed the credential
                                        </li>
                                    </ul>

                                    {/* Suggestion box */}
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                                        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                                            What to do
                                        </p>

                                        <p className="text-sm text-amber-800 leading-relaxed">
                                            Contact the person or organization that sent you this
                                            link to request a new one.
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => history.push('/')}
                                        className="w-full py-3 px-4 bg-grayscale-900 text-white font-medium text-sm rounded-[20px] hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        <Home className="w-4 h-4" />
                                        Go to home
                                    </button>

                                    <button
                                        onClick={() =>
                                            window.open('mailto:support@learncard.com', '_blank')
                                        }
                                        className="w-full py-3 px-4 text-sm text-grayscale-600 font-medium rounded-[20px] hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Contact support
                                    </button>
                                </div>
                            </div>
                        </div>
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
                            className="w-[50px] h-[50px] min-h-[50px] min-w-[50px] bg-white rounded-full flex items-center justify-center shadow-lg border border-grayscale-200 hover:bg-grayscale-10 transition-colors"
                        >
                            <XIcon className="text-grayscale-600 w-6 h-6" />
                        </button>

                        <button
                            onClick={handleClaim}
                            disabled={claiming || isClaimed}
                            className={`flex items-center justify-center bg-${primaryColor} text-white py-3 px-4 font-medium text-sm rounded-[20px] shadow-lg w-[200px] max-w-[320px] ml-2 font-poppins hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
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
