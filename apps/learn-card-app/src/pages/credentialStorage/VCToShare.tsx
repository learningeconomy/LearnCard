import React, { useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('v-c-to-share');

import { IonRow, IonPage } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BoostEarnedCard from 'apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { categoryMetadata, chapiStore, redirectStore } from 'learn-card-base';
import { useWallet } from 'learn-card-base';

const VCToShare: React.FC<{
    vcsToShare: Array<any>;
    handleCloseModal: () => void;
    handleVcSelection: () => void;
    isVcSelected: () => void;
    event?: any;
    onSubmit?: (body: { verifiablePresentation: VP }) => void;
    onReject?: () => void;
    verifiablePresentationRequest?: any;
    currentUser: any;
    getUniqueId: () => void;
}> = ({
    vcsToShare,
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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const { initWallet } = useWallet();

    const renderCredentialList = vcsToShare?.map(vc => {
        const categoryFromVc = getDefaultCategoryForCredential(vc);
        const category = categoryFromVc || 'Achievement';
        const categoryImgUrl = categoryMetadata[category].defaultImageSrc;
        const uniqueId = getUniqueId(vc);

        return (
            <>
                <BoostEarnedCard
                    key={uniqueId}
                    credential={vc}
                    defaultImg={categoryImgUrl}
                    categoryType={category}
                    verifierState={true}
                    showChecked={true}
                    onCheckMarkClick={() => handleVcSelection(uniqueId)}
                    initialCheckmarkState={isVcSelected(uniqueId)}
                />
            </>
        );
    });

    const accept = async () => {
        try {
            setIsLoading(true);
            const wallet = await initWallet();

            const presentation =
                event?.credentialRequestOptions?.web?.VerifiablePresentation ||
                verifiablePresentationRequest;
            const { challenge, domain } = presentation ?? {};

            try {
                chapiStore.set.isChapiInteraction(null);
                redirectStore.set.authRedirect(null);
            } catch (e) {
                log.error(e);
            }

            const vpToShare = await wallet.invoke.newPresentation(vcsToShare as any);

            log.info('✍️ Issuing VP to respond to CHAPI event', vpToShare);

            const data = await wallet.invoke.issuePresentation(vpToShare, {
                challenge,
                domain,
                proofPurpose: 'authentication',
            });

            log.info('✅ Issued VP', data);

            if (event) {
                event.respondWith(
                    Promise.resolve({
                        dataType: 'VerifiablePresentation',
                        data,
                    })
                );
            }
            if (onSubmit) {
                onSubmit({ verifiablePresentation: data });
            }
            setIsLoading(false);
            handleCloseModal();
        } catch (e) {
            log.error('share.credentials.failed', e);
            setIsLoading(false);
            setError('Error sharing credential(s). Please try again.');
        }
    };

    const selectedCount = vcsToShare?.length ?? 0;

    return (
        <IonPage>
            <IonRow className="bg-grayscale-100 m-auto flex flex-col mobile:w-[85%] md:w-[509px] lg:w-[724px] h-5/6 max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] rounded-3xl overflow-hidden font-poppins">
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
                        disabled={selectedCount === 0 || (isLoading && !error)}
                    >
                        {isLoading && !error ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sharing...
                            </span>
                        ) : (
                            'SHARE'
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
                        <div className="flex flex-row flex-wrap items-start justify-center gap-4 pb-6 w-full achievements-list-container [&>ion-col]:!w-[220px] [&>ion-col]:!max-w-[220px] [&>ion-col]:!flex-none [&>ion-col]:!p-0">
                            {renderCredentialList}
                        </div>
                    )}
                </div>
            </IonRow>
        </IonPage>
    );
};

export default VCToShare;
