import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { VC, VP, VerificationItem } from '@learncard/types';
import { prettifyVerificationItems } from 'learn-card-base/helpers/verificationPrettifier';
import { IonContent, IonPage, IonFooter, IonLoading } from '@ionic/react';
import { Gift, Check, AlertCircle, Home, HelpCircle } from 'lucide-react';

import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
const log = getLogger('exchange-accept-credentials');

import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import BoostDetailsSideMenu from '../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu';
import BoostDetailsSideBar from '../../components/boost/boostCMS/BoostPreview/BoostDetailsSideBar';

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
    newFlowId,
} from '@analytics';
import { v4 as uuidv4 } from 'uuid';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';

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
    const { storeAndAddVCToWallet, initWallet } = useWallet();
    const { track } = useAnalytics();
    const { capture, snapshotRef } = useProfileSnapshotCapture();
    const { newModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
    const flowStartedAt = useRef(Date.now());
    const claimAttemptRef = useRef<{ flowId: string; startedAt: number } | null>(null);

    const resolvePartnerId = (issuerId?: string) => {
        const profileId = getUserHandleFromDid(issuerId ?? '');
        if (profileId) return profileId;

        try {
            return issuerId ? new URL(issuerId).host || undefined : undefined;
        } catch {
            return undefined;
        }
    };

    // Verify the (single) credential so the Details panel/sidebar shows real
    // Proof / Status / Expiration rows. Always run — the verification block is
    // shown on both mobile (Details modal) and desktop (persistent sidebar).
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    useEffect(() => {
        const cred = credentials[0];
        if (!cred) return;

        let cancelled = false;
        (async () => {
            try {
                const wallet = await initWallet();
                const verifications = await wallet?.invoke?.verifyCredential(cred, {}, true);
                if (!cancelled) {
                    setVerificationItems(prettifyVerificationItems(verifications ?? []));
                }
            } catch (err) {
                log.warn('Failed to verify claim credential', err);
            }
        })();

        return () => {
            cancelled = true;
        };
        // `credentials` is captured once from the VP at mount and never changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const beginClaimAttempt = () => {
        if (claimAttemptRef.current || selectedCredentials.length === 0)
            return claimAttemptRef.current;

        const primaryCredential = selectedCredentials[0];
        const issuerId =
            typeof primaryCredential?.issuer === 'string'
                ? primaryCredential.issuer
                : primaryCredential?.issuer?.id;
        const attempt = { flowId: newFlowId(), startedAt: Date.now() };

        claimAttemptRef.current = attempt;
        track(AnalyticsEvents.CREDENTIAL_CLAIM_STARTED, {
            flow_id: attempt.flowId,
            entry_point: 'vc_api_request',
            credential_type: getAchievementType(primaryCredential),
            category: getDefaultCategoryForCredential(primaryCredential),
            partner_id: resolvePartnerId(issuerId),
        });

        return attempt;
    };

    const completeClaimAttempt = (
        eventName:
            | typeof AnalyticsEvents.CREDENTIAL_CLAIM_SUCCEEDED
            | typeof AnalyticsEvents.CREDENTIAL_CLAIM_FAILED
            | typeof AnalyticsEvents.CREDENTIAL_CLAIM_CANCELLED,
        errorCode?: string
    ) => {
        const attempt = claimAttemptRef.current;
        const primaryCredential = selectedCredentials[0] ?? credentials[0];
        if (!attempt || !primaryCredential) return;

        const issuerId =
            typeof primaryCredential.issuer === 'string'
                ? primaryCredential.issuer
                : primaryCredential.issuer?.id;

        track(eventName, {
            flow_id: attempt.flowId,
            entry_point: 'vc_api_request',
            credential_type: getAchievementType(primaryCredential),
            category: getDefaultCategoryForCredential(primaryCredential),
            partner_id: resolvePartnerId(issuerId),
            duration_ms: Date.now() - attempt.startedAt,
            error_code: errorCode,
        });

        claimAttemptRef.current = null;
    };

    useEffect(() => {
        if (credentials.length > 0 && !isClaimed) {
            beginClaimAttempt();
        }
    }, [credentials, isClaimed, selectedCredentials.length]);

    const handleClaim = async () => {
        if (selectedCredentials.length === 0) {
            presentToast(m['toasts.selectCredential'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }
        beginClaimAttempt();
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
            completeClaimAttempt(AnalyticsEvents.CREDENTIAL_CLAIM_SUCCEEDED);

            presentToast(m['claim.accept.success']({ count: selectedCredentials.length }), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });

            onAccept({}, selectedCredentials.length);
        } catch (e) {
            completeClaimAttempt(
                AnalyticsEvents.CREDENTIAL_CLAIM_FAILED,
                e instanceof Error ? (e as Error & { code?: string }).code ?? e.name : undefined
            );
            log.error('Error claiming credential(s)', e);
            if (e instanceof Error && e?.message?.includes('exists')) {
                presentToast(m['claim.accept.exists'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } else {
                presentToast(m['claim.accept.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        } finally {
            setClaiming(false);
        }
    };

    // getDefaultCategoryForCredential can throw on malformed credentials, so
    // resolve defensively for the detail views (categoryType is optional on
    // both BoostDetailsSideMenu and BoostDetailsSideBar). Mirrors the guarded
    // resolution used for post-claim routing in ClaimFromRequest.
    const resolveDetailsCategoryType = (cred: VC): CredentialCategoryEnum | undefined => {
        try {
            return getDefaultCategoryForCredential(cred) as CredentialCategoryEnum;
        } catch (err) {
            log.warn('Failed to resolve credential category for details view', err);
            return undefined;
        }
    };

    // Mobile "Details" side panel — parity with ClaimBoost's footer.
    const openSingleCredentialDetails = (credential: VC) => {
        newModal(
            <BoostDetailsSideMenu
                credential={credential}
                categoryType={resolveDetailsCategoryType(credential)}
                verificationItems={verificationItems}
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
                // Disable the click-to-flip: the back face is superseded by the
                // Details overlay. Passing a no-op setter (and omitting
                // isFrontOverride) keeps the card fixed on its front face, the
                // same way the read-only detail views (BoostPreview/ClaimBoost)
                // suppress the flip.
                setIsFrontOverride={() => {}}
            />
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
                        {m['claim.accept.readyCount']({ count: credentials.length })}
                    </h1>

                    <p className="text-grayscale-600 text-sm max-w-md mx-auto leading-relaxed">
                        {m['claim.accept.tapHint']()}
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
                                    {credentials.length === 1
                                        ? m['claim.accept.selCount.one']({
                                              selected: selectedCredentials.length,
                                              total: credentials.length,
                                          })
                                        : m['claim.accept.selCount.other']({
                                              selected: selectedCredentials.length,
                                              total: credentials.length,
                                          })}
                                </p>

                                <p className="text-sm text-grayscale-500">
                                    {selectedCredentials.length === 0
                                        ? m['claim.accept.selectOne']()
                                        : m['claim.accept.willAdd']()}
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
                                ? m['claim.accept.deselAll']()
                                : m['claim.accept.selAll']()}
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
                                    {m['claim.accept.noneTitle']()}
                                </h1>

                                <p className="text-grayscale-500 text-sm">
                                    {m['claim.accept.noneSub']()}
                                </p>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="space-y-5 mb-6">
                                    <p className="text-grayscale-600 text-center text-sm leading-relaxed">
                                        {m['claim.accept.noneDesc']()}
                                    </p>

                                    <ul className="text-sm text-grayscale-600 space-y-2 pl-4">
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {m['claim.accept.reason1']()}
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {m['claim.accept.reason2']()}
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            {m['claim.accept.reason3']()}
                                        </li>
                                    </ul>

                                    {/* Suggestion box */}
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                                        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                                            {m['claim.accept.whatToDo']()}
                                        </p>

                                        <p className="text-sm text-amber-800 leading-relaxed">
                                            {m['claim.accept.noneHelp']()}
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
                                        {m['claim.accept.goHome']()}
                                    </button>

                                    <button
                                        onClick={() =>
                                            window.open('mailto:support@learncard.com', '_blank')
                                        }
                                        className="w-full py-3 px-4 text-sm text-grayscale-600 font-medium rounded-[20px] hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        {m['claim.accept.support']()}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const claimBtnText = isClaimed
        ? m['claim.accept.claimed']()
        : claiming
        ? m['common.loading']()
        : m['common.accept']();

    // Single-credential claim — full credential view, matching ClaimBoost:
    // themed background, edge-to-edge scroll area (no phantom padding / inset
    // scrollbar), and the shared frosted BoostFooter (Close / Details / Accept).
    if (credentials.length === 1) {
        const credential = credentials[0];

        return (
            <IonPage>
                <IonLoading isOpen={claiming} message={m['claim.accept.claiming']()} />
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
                            handleClose={() => {
                                completeClaimAttempt(AnalyticsEvents.CREDENTIAL_CLAIM_CANCELLED);
                                history.push('/');
                            }}
                            handleDetails={
                                isMobile ? () => openSingleCredentialDetails(credential) : undefined
                            }
                            handleClaim={handleClaim}
                            claimBtnText={claimBtnText}
                            disableClaimButton={claiming || isClaimed}
                            useFullCloseButton={!isMobile}
                        />
                    </footer>

                    {/* On desktop the Details footer button is hidden; show the
                        persistent Details/Endorsements sidebar instead, matching
                        the credential detail view (ClaimBoost/BoostPreview). */}
                    {!isMobile && (
                        <BoostDetailsSideBar
                            credential={credential}
                            categoryType={resolveDetailsCategoryType(credential)}
                            verificationItems={verificationItems}
                            renderMethodCredential={credential}
                        />
                    )}
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
                    handleClose={() => {
                        completeClaimAttempt(AnalyticsEvents.CREDENTIAL_CLAIM_CANCELLED);
                        history.push('/');
                    }}
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
