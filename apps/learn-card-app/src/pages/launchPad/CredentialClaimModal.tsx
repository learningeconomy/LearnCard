import React, { useState, useEffect, useRef } from 'react';
import { IonSpinner } from '@ionic/react';
import { X, Check, Loader2 } from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, BoostPageViewMode, BoostCategoryOptionsEnum } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

import { VC, VP } from '@learncard/types';

import { BoostEarnedCard } from '../../components/boost/boost-earned-card/BoostEarnedCard';
import {
    markModalMounted,
    markCredentialResolved,
    markClaimStarted,
    markClaimCompleted,
    flushOnError as flushSendCredentialFlowOnError,
    flushOnDismiss as flushSendCredentialFlowOnDismiss,
} from '../../helpers/sendCredentialFlow.helpers';

interface CredentialClaimModalProps {
    credentialUri: string;
    boostUri?: string;
    credential?: VC | VP; // LC-1644: pre-resolved credential from APP_EVENT response
    onDismiss: () => void;
}

export const CredentialClaimModal: React.FC<CredentialClaimModalProps> = ({
    credentialUri,
    boostUri,
    credential: preResolvedCredential,
    onDismiss,
}) => {
    const { initWallet, addVCtoWallet } = useWallet();
    const { presentToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [credential, setCredential] = useState<VC | VP | undefined | null>(null);
    const [error, setError] = useState<string | null>(null);

    // LC-1644 fast-path enrichment: when the modal is mounted with a preResolvedCredential
    // (Tasks 1+2 fast path), the credential lacks the wallet-side enrichment that
    // `wallet.read.get(uri)` provides (issuer registry name, verified badge, hydrated
    // display fields). We render immediately for the perf win, then re-fetch via the
    // wallet in the background and swap to the enriched version once it lands.
    // While the background fetch is pending, fields that depend on enrichment show a
    // shimmer placeholder rather than the generic "Credential" / "[?]" fallback.
    const [isEnrichingFromFastPath, setIsEnrichingFromFastPath] = useState(false);

    // LC-1644: Hoist wallet to ref so handleClaim can reuse it without a second initWallet()
    const walletRef = useRef<Awaited<ReturnType<typeof initWallet>> | null>(null);

    // LC-1644: any dismiss path before claim completes flushes the in-flight perf flow as
    // 'modal_dismissed'. Post-claim dismissals are no-ops because the flow is already terminated.
    const handleDismiss = () => {
        void flushSendCredentialFlowOnDismiss();
        onDismiss();
    };

    // Resolve the credential URI on mount
    // LC-1644: If preResolvedCredential is provided via prop, skip the network fetch entirely.
    useEffect(() => {
        let cancelled = false;

        // LC-1644 perf telemetry — record modal mount time. The flow may not be active
        // (e.g. modal opened from a non-sendCredential path); the helper no-ops in that case.
        markModalMounted();

        const resolveCredential = async () => {
            try {
                setIsLoading(true);
                setError(null);

                if (preResolvedCredential) {
                    // Fast path — render immediately with what we have
                    if (!cancelled) {
                        setCredential(preResolvedCredential);
                        markCredentialResolved({ fastPath: true });
                        setIsEnrichingFromFastPath(true);
                    }

                    // Init wallet (needed for handleClaim later, also for enrichment)
                    const wallet = await initWallet();
                    if (!cancelled) walletRef.current = wallet;

                    // Background enrichment: fetch the wallet-resolved version so the
                    // preview gets the proper issuer name + verified badge + display fields.
                    // Non-blocking for modal interactivity — user can click Accept any time.
                    if (wallet) {
                        try {
                            const enriched = await wallet.read.get(credentialUri);
                            if (!cancelled && enriched) {
                                setCredential(enriched);
                            }
                        } catch (enrichErr) {
                            // Enrichment failure is non-fatal — modal remains usable.
                            console.warn('[claim] background enrichment failed:', enrichErr);
                        } finally {
                            if (!cancelled) setIsEnrichingFromFastPath(false);
                        }
                    } else if (!cancelled) {
                        setIsEnrichingFromFastPath(false);
                    }
                    return;
                }

                // Slow path — fallback: fetch credential from network (back-compat)
                const wallet = await initWallet();
                if (!cancelled) walletRef.current = wallet;
                const vc = await wallet?.read.get(credentialUri);

                if (!vc) throw new Error('Error resolving credential');
                if (!cancelled) {
                    setCredential(vc);
                    markCredentialResolved({ fastPath: false });
                }
            } catch (err) {
                console.error('Failed to resolve credential:', err);
                if (!cancelled) setError('Unable to load credential');
                void flushSendCredentialFlowOnError({
                    phase: 'credential_resolve',
                    message: err instanceof Error ? err.message : String(err),
                });
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        resolveCredential();
        return () => { cancelled = true; };
    }, [credentialUri, preResolvedCredential]);

    const handleClaim = async () => {
        if (isClaiming || claimed) return;

        setIsClaiming(true);
        markClaimStarted();

        try {
            // LC-1644 Phase 2 perf: parallelize the local wallet write with the server-side
            // accept + notification query. All three are independent:
            //   - addVCtoWallet → local IndexedDB / wallet write
            //   - acceptCredential → server-side state update via tRPC
            //   - queryNotifications → server-side read for the matching notification record
            // Previously these ran sequentially, costing ~500–1500ms per JIRA estimates. Running
            // in parallel cuts the claim phase to roughly the slowest individual call.
            //
            // We use Promise.allSettled so a server-side hiccup on accept/query doesn't fail
            // the whole claim — we already treated those as best-effort below.
            const wallet = walletRef.current;

            const [addResult, acceptResult, queryResult] = await Promise.allSettled([
                addVCtoWallet({ uri: credentialUri }),
                wallet ? wallet.invoke.acceptCredential(credentialUri) : Promise.resolve(),
                wallet
                    ? wallet.invoke.queryNotifications(
                          { 'data.vcUris': credentialUri, archived: false },
                          { limit: 1 }
                      )
                    : Promise.resolve(undefined),
            ]);

            // The local wallet write is the user-perceived "credential claimed" event — if it
            // fails we have to surface the error. Server-side issues we just log.
            if (addResult.status === 'rejected') throw addResult.reason;

            if (acceptResult.status === 'rejected') {
                console.warn('Failed to accept credential server-side:', acceptResult.reason);
            }

            // Fire-and-forget the notification metadata update. The user already sees claim
            // success — bookkeeping shouldn't block the UI.
            if (
                wallet &&
                queryResult.status === 'fulfilled' &&
                queryResult.value &&
                typeof queryResult.value !== 'boolean' &&
                queryResult.value.notifications?.[0]?._id
            ) {
                const notifId = queryResult.value.notifications[0]._id;
                void wallet.invoke
                    .updateNotificationMeta(notifId, {
                        actionStatus: 'COMPLETED',
                        read: true,
                    })
                    .catch((notifErr: unknown) => {
                        console.warn('Failed to update notification:', notifErr);
                    });
            } else if (queryResult.status === 'rejected') {
                console.warn('Failed to query notification:', queryResult.reason);
            }

            setClaimed(true);
            void markClaimCompleted();

            presentToast('Successfully claimed Credential!', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            console.error('Failed to claim credential:', err);
            void flushSendCredentialFlowOnError({
                phase: 'claim',
                message: err instanceof Error ? err.message : String(err),
            });

            presentToast('Unable to claim Credential', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setIsClaiming(false);
        }
    };

    // Success state
    if (claimed) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-emerald-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Credential Claimed!
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            The credential has been added to your wallet.
                        </p>

                        <button
                            onClick={onDismiss}
                            className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
                    <div className="flex flex-col items-center justify-center">
                        <IonSpinner name="crescent" className="w-12 h-12 text-cyan-500" />

                        <p className="mt-4 text-gray-600 font-medium">Loading credential...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !credential) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Unable to Load Credential
                        </h3>

                        <p className="text-gray-500 text-sm mb-6">
                            {error || 'The credential could not be found.'}
                        </p>

                        <button
                            onClick={() => {
                                void flushSendCredentialFlowOnDismiss();
                                onDismiss();
                            }}
                            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get credential title
    const subject = Array.isArray(credential?.credentialSubject)
        ? credential?.credentialSubject[0]
        : credential?.credentialSubject;

    const resolvedCredentialName = credential?.name || subject?.achievement?.name;
    // LC-1644: while background enrichment is pending and we don't yet have a real
    // name, show a skeleton instead of the generic "Credential" fallback. Once the
    // enriched credential lands in state, this resolves to the real name and the
    // shimmer disappears.
    const showCredentialNameShimmer = isEnrichingFromFastPath && !resolvedCredentialName;
    const credentialName = resolvedCredentialName || 'Credential';

    const actionButtonText = isClaiming ? 'Claiming...' : claimed ? 'Claimed' : 'Accept';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col relative">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    disabled={isClaiming}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-md transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white text-center flex-shrink-0">
                    <h3 className="text-lg font-semibold">You've Earned a Credential!</h3>

                    <p className="text-white/80 text-sm mt-1 min-h-[20px]">
                        {showCredentialNameShimmer ? (
                            <span
                                className="inline-block h-[14px] w-32 bg-white/30 rounded animate-pulse align-middle"
                                aria-label="Loading credential name"
                            />
                        ) : (
                            credentialName
                        )}
                    </p>
                </div>

                {/* Credential Preview */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="flex justify-center">
                        <div className="w-[180px]">
                            <BoostEarnedCard
                                credential={credential as VC}
                                categoryType={getDefaultCategoryForCredential(credential as VC) || BoostCategoryOptionsEnum.achievement}
                                boostPageViewMode={BoostPageViewMode.Card}
                                useWrapper={false}
                                verifierState={false}
                                className="shadow-lg"
                                // LC-1644: while background enrichment is pending, render the
                                // card's built-in skeleton state instead of the fast-path
                                // credential's unenriched issuer "[?]" badge. Resolves itself
                                // once the enriched credential lands in state.
                                loading={isEnrichingFromFastPath}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 space-y-2">
                    <button
                        onClick={handleClaim}
                        disabled={isClaiming || claimed}
                        className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isClaiming ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Claiming...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Accept Credential
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleDismiss}
                        disabled={isClaiming}
                        className="w-full px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors disabled:opacity-50"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialClaimModal;
