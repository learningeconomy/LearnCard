import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { VC, VP, VerificationItem } from '@learncard/types';
import { IonContent, IonPage, IonFooter, IonLoading } from '@ionic/react';
import { Gift, Check, AlertCircle, Home, HelpCircle } from 'lucide-react';

import { getLogger } from 'learn-card-base';
const log = getLogger('exchange-accept-credentials');

import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import BoostDetailsSideMenu from '../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu';

import {
    useWallet,
    useToast,
    ToastTypeEnum,
    BoostPageViewMode,
    useModal,
    ModalTypes,
    useDeviceTypeByWidth,
    CredentialCategoryEnum,
} from 'learn-card-base';
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
    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
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

    // Mobile "Details" side panel — parity with ClaimBoost's footer.
    const openSingleCredentialDetails = (credential: VC) => {
        newModal(
            <BoostDetailsSideMenu
                credential={credential}
                categoryType={getDefaultCategoryForCredential(credential) as CredentialCategoryEnum}
                verificationItems={[] as VerificationItem[]}
                renderMethodCredential={credential}
            />,
            {
                className: '!bg-transparent',
                hideButton: true,
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const renderSingleCredentialCard = (credential: VC) => {
        const name = credential.name || 'Credential';

        return (
            <VCDisplayCardWrapper2
                useCurrentUserName
                credential={credential}
                overrideCardTitle={name}
                customFooterComponent={<div />}
                checkProof={false}
                hideNavButtons
                hideFrontFaceDetails={false}
                isFrontOverride={isFront}
                setIsFrontOverride={setIsFront}
            />
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
                        Tap each credential to select or deselect it. Only selected credentials will
                        be added to your wallet.
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
                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    selectedCredentials.length > 0
                                        ? 'bg-emerald-100'
                                        : 'bg-gray-100'
                                }`}
                            >
                                <Check
                                    className={`w-5 h-5 ${
                                        selectedCredentials.length > 0
                                            ? 'text-emerald-600'
                                            : 'text-gray-400'
                                    }`}
                                />
                            </div>

                            <div>
                                <p className="font-medium text-gray-900">
                                    {selectedCredentials.length} of {credentials.length} credential
                                    {credentials.length !== 1 ? 's' : ''} selected
                                </p>

                                <p className="text-sm text-gray-500">
                                    {selectedCredentials.length === 0
                                        ? 'Select at least one to continue'
                                        : 'These will be added to your wallet'}
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
                            {selectedCredentials.length === credentials.length
                                ? 'Deselect All'
                                : 'Select All'}
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
                    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
                            {/* Header with icon */}
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-10 h-10 text-white" />
                                </div>

                                <h1 className="text-2xl font-bold text-white mb-2">
                                    No Credentials Found
                                </h1>

                                <p className="text-amber-100 text-sm">
                                    This link doesn't contain any credentials
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    <p className="text-gray-600 text-center text-sm">
                                        The credential link you followed doesn't have any
                                        credentials to claim. This could happen if:
                                    </p>

                                    <ul className="text-sm text-gray-500 space-y-2 pl-4">
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
                                            The issuer removed the credential
                                        </li>
                                    </ul>

                                    {/* Suggestion box */}
                                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                                        <p className="text-xs font-medium text-cyan-600 uppercase tracking-wide mb-2">
                                            What to do
                                        </p>

                                        <p className="text-sm text-cyan-800">
                                            Contact the person or organization that sent you this
                                            link to request a new one.
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => history.push('/')}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                                    >
                                        <Home className="w-5 h-5" />
                                        Go to Home
                                    </button>

                                    <button
                                        onClick={() =>
                                            window.open('mailto:support@learncard.com', '_blank')
                                        }
                                        className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const claimBtnText = isClaimed ? 'Claimed' : claiming ? 'Loading...' : 'Accept';

    // Single-credential claim — full credential view, matching ClaimBoost:
    // themed background, edge-to-edge scroll area (no phantom padding / inset
    // scrollbar), and the shared frosted BoostFooter (Close / Details / Accept).
    if (credentials.length === 1) {
        const credential = credentials[0];

        return (
            <IonPage>
                <IonLoading isOpen={claiming} message={'Claiming Credential(s)...'} />
                <div className="flex h-full bg-grayscale-100">
                    <section className="flex h-full overflow-y-scroll flex-1 items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0 bg-grayscale-100">
                        <section
                            className={`px-6 w-full safe-area-top-margin overflow-y-auto max-h-full pb-32 disable-scrollbars ${
                                Capacitor.isNativePlatform() ? 'pt-0' : 'pt-[30px]'
                            }`}
                        >
                            <div className="pb-4 vc-preview-modal-safe-area h-full w-full">
                                {renderSingleCredentialCard(credential)}
                            </div>
                        </section>
                    </section>

                    <footer className="w-full flex justify-center items-center ion-no-border absolute bottom-0 z-10">
                        <BoostFooter
                            handleClose={() => history.push('/')}
                            handleDetails={
                                isMobile ? () => openSingleCredentialDetails(credential) : undefined
                            }
                            handleClaim={handleClaim}
                            claimBtnText={claimBtnText}
                            disableClaimButton={claiming || isClaimed}
                            useFullCloseButton={!isMobile}
                        />
                    </footer>
                </div>
            </IonPage>
        );
    }

    // Multiple-credential claim — grid selection view (unchanged).
    return (
        <IonPage>
            <IonLoading isOpen={claiming} message={'Claiming Credential(s)...'} />
            <IonContent fullscreen color="grayscale-100" className="ion-padding">
                {renderMultipleCredentials()}
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border absolute bottom-0"
            >
                <BoostFooter
                    handleClose={() => history.push('/')}
                    handleClaim={handleClaim}
                    claimBtnText={claimBtnText}
                    disableClaimButton={claiming || isClaimed}
                    useFullCloseButton={false}
                />
            </IonFooter>
        </IonPage>
    );
};

export default ExchangeAcceptCredentials;
