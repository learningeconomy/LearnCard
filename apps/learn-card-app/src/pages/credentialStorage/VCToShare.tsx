import { useVerifierHistoryEligibility } from '../../helpers/verifier-history/useEligibility';
import React, { useState, useRef } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('v-c-to-share');

import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import { ShareCredentialSelectionRow } from '../../components/share-links/ShareCredentialSelectionRow';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { chapiStore, redirectStore } from 'learn-card-base';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import {
    beginVerifierDisclosure,
    visibleCredentialTitles,
    type HistoryContext,
} from '../../helpers/verifier-history/history';
import {
    captureHistoryContext,
    captureHistoryAccount,
} from '../../helpers/verifier-history/account';
import type { VC } from '@learncard/types';
import type { CredentialRequestEvent } from '@learncard/chapi-plugin';
import type { CurrentUser } from 'learn-card-base/stores/currentUserStore';
import type {
    VerifierPresentationRequest,
    CredentialDisclosureSubmit,
} from '../../helpers/verifier-history/disclosure';
import * as m from '../../paraglide/messages.js';

const VCToShare: React.FC<{
    vcsToShare: VC[];
    categoriesById?: Record<string, string>;
    handleCloseModal: () => void;
    handleVcSelection: (id: string) => void;
    isVcSelected: (id: string) => boolean;
    event?: Pick<CredentialRequestEvent, 'respondWith'> & {
        credentialRequestOptions?: {
            web?: { VerifiablePresentation?: VerifierPresentationRequest };
        };
    };
    onSubmit?: CredentialDisclosureSubmit;
    onReject?: () => void;
    verifiablePresentationRequest?: VerifierPresentationRequest;
    currentUser: CurrentUser | null;
    getUniqueId: (vc: VC) => string;
}> = ({
    vcsToShare,
    categoriesById,
    handleCloseModal,
    handleVcSelection,
    isVcSelected,
    event,
    currentUser,
    getUniqueId,
    onSubmit,
    onReject,
    verifiablePresentationRequest,
}) => {
    const responded = useRef(false);
    const accountInvalidated = useRef(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [removedIds, setRemovedIds] = useState<string[]>([]);
    const selectedCredentials = vcsToShare.filter(vc => !removedIds.includes(getUniqueId(vc)));
    const { initWallet } = useWallet();
    const historyEligible = useVerifierHistoryEligibility();
    const { presentToast } = useToast();

    const renderCredentialList = selectedCredentials.map(vc => {
        const uniqueId = getUniqueId(vc);
        return (
            <ShareCredentialSelectionRow
                key={uniqueId}
                choice={{
                    uri: uniqueId,
                    credential: vc,
                    category:
                        categoriesById?.[uniqueId] ||
                        getDefaultCategoryForCredential(vc) ||
                        'Achievement',
                }}
                checked={isVcSelected(uniqueId)}
                disabled={isLoading || responded.current || accountInvalidated.current}
                onToggle={() => {
                    setRemovedIds(current => [...current, uniqueId]);
                    handleVcSelection(uniqueId);
                }}
            />
        );
    });

    const accept = async () => {
        const isSelectedAccount = captureHistoryAccount();
        let context: HistoryContext | undefined;
        try {
            setError('');
            setIsLoading(true);
            if (responded.current) throw new Error('Request already completed');
            const wallet = await initWallet();
            if (!isSelectedAccount()) throw new Error('Account changed. Please try again.');

            const presentation =
                event?.credentialRequestOptions?.web?.VerifiablePresentation ||
                verifiablePresentationRequest;
            const { challenge, domain } = presentation ?? {};

            try {
                chapiStore.set.isChapiInteraction(null);
                redirectStore.set.authRedirect(null);
            } catch {
                log.error('share.credentials.reset.failed');
            }

            context = captureHistoryContext(wallet, historyEligible);
            const history = await beginVerifierDisclosure(context, {
                protocol: event ? 'chapi' : 'vc-api',
                titles: visibleCredentialTitles(selectedCredentials),
            });
            const firstCredential = selectedCredentials[0];
            if (!firstCredential) throw new Error('No credentials selected');
            const vpToShare = {
                ...(await wallet.invoke.newPresentation(firstCredential)),
                verifiableCredential: selectedCredentials,
            };

            const data = await wallet.invoke.issuePresentation(vpToShare, {
                challenge,
                domain,
                proofPurpose: 'authentication',
            });

            if (!context.isCurrent()) throw new Error('Account changed');
            if (event) {
                responded.current = true;
                event.respondWith(
                    Promise.resolve({
                        dataType: 'VerifiablePresentation',
                        data,
                    })
                );
                void history.finish('handed-off').then(result => {
                    if (result === 'unavailable' && history.isCurrent())
                        presentToast(m['verifierHistory.saveFailed'](), {
                            type: ToastTypeEnum.Error,
                        });
                });
            } else if (onSubmit) {
                await onSubmit({ verifiablePresentation: data }, history);
            }
            setIsLoading(false);
            handleCloseModal();
        } catch (e) {
            log.error('share.credentials.failed');
            if (!isSelectedAccount() || (context && !context.isCurrent()))
                accountInvalidated.current = true;
            if (event && !responded.current) {
                responded.current = true;
                const rejection = Promise.reject(new Error('Credential sharing canceled'));
                void rejection.catch(() => undefined);
                try {
                    event.respondWith(rejection);
                } catch {
                    /* Mediator may already be closed. */
                }
            }
            setIsLoading(false);
            setError('Error sharing credential(s). Please try again.');
        }
    };

    const selectedCount = selectedCredentials?.length ?? 0;

    return (
        <section
            className="sentry-block ph-no-capture bg-grayscale-100 flex h-full w-full flex-col overflow-hidden font-poppins"
            data-html2canvas-ignore
            data-feedback-exclude
        >
            <header className="shrink-0 bg-white flex items-center justify-between gap-3 px-6 py-4 border-b border-grayscale-200">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        aria-label="Go back"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-grayscale-10 transition-colors"
                        onClick={() => handleCloseModal()}
                    >
                        <CaretLeft className="h-auto w-3 text-grayscale-900" />
                    </button>
                    <div className="text-left min-w-0">
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-tight">
                            Review
                        </h1>
                        <p className="text-xs text-grayscale-500 mt-0.5 truncate">
                            {selectedCount === 0
                                ? 'No credentials selected'
                                : `Sharing ${selectedCount} credential${
                                      selectedCount === 1 ? '' : 's'
                                  }`}
                        </p>
                    </div>
                </div>
                <button
                    className="shrink-0 bg-grayscale-900 rounded-[20px] text-white font-medium h-10 px-6 text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={accept}
                    disabled={
                        selectedCount === 0 ||
                        isLoading ||
                        Boolean(event && responded.current) ||
                        accountInvalidated.current
                    }
                >
                    {isLoading && !error ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sharing...
                        </span>
                    ) : (
                        'Share'
                    )}
                </button>
            </header>

            <div className="flex-1 overflow-auto px-4 py-5">
                {error && (
                    <div className="mb-5 mx-auto max-w-[420px] p-3 bg-red-50 border border-red-100 rounded-2xl">
                        <span className="text-sm text-red-700 leading-relaxed">{error}</span>
                    </div>
                )}

                {selectedCount === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
                        <div className="w-16 h-16 rounded-full bg-grayscale-100 flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-grayscale-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="4" width="18" height="16" rx="3" />
                                <path d="M3 9h18" />
                                <path d="M8 14h5" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold text-grayscale-900">
                            No credentials selected
                        </h2>
                        <p className="text-sm text-grayscale-500 mt-1 max-w-[260px]">
                            Go back and choose the credentials you'd like to share.
                        </p>
                        <button
                            type="button"
                            className="mt-5 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                            onClick={() => handleCloseModal()}
                        >
                            Back to Selection
                        </button>
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-2xl space-y-3 pb-6">
                        {renderCredentialList}
                    </div>
                )}
            </div>
        </section>
    );
};

export default VCToShare;
