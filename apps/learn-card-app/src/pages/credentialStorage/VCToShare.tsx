import React, { useState } from 'react';

import { IonHeader, IonRow, IonCol, IonGrid, IonPage } from '@ionic/react';
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
            const { challenge, domain } = presentation;

            try {
                chapiStore.set.isChapiInteraction(null);
                redirectStore.set.authRedirect(null);
            } catch (e) {
                console.error(e);
            }

            // TODO: Move this logic into LearnCard - LearnCard should handle presentation flow.
            const vpToShare = {
                '@context': [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://w3id.org/security/suites/ed25519-2020/v1',
                ],
                type: ['VerifiablePresentation'],
                verifiableCredential: vcsToShare,
                holder: wallet.id.did(),
            };

            console.log('✍️ Issuing VP to respond to CHAPI event', vpToShare);

            const data = await wallet.invoke.issuePresentation(vpToShare, {
                challenge,
                domain,
                proofPurpose: 'authentication',
            });

            console.log('✅ Issued VP', data);

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
        } catch {
            setError('Error sharing credential(s). Please try again.');
        }
    };

    return (
        <IonPage>
            <IonRow className="bg-grayscale-100 m-auto flex mobile:w-[85%] md:w-[509px] lg:w-[724px] h-5/6 rounded-3xl overflow-auto">
                <IonHeader className="bg-white flex items-center justify-between mobile:px-5 mobile:py-2.5 md:px-10 md:py-5">
                    <button
                        className="flex items-center justify-center font-poppins text-grayscale-900 text-xl m-1.5"
                        onClick={() => handleCloseModal()}
                    >
                        <CaretLeft className="h-auto w-3 mr-5" />
                        Review
                    </button>
                    <button
                        className={
                            vcsToShare.length === 0
                                ? 'bg-indigo-700 opacity-50 rounded-full text-white font-poppins h-10 w-24 text-2xl m-1.5 shadow-bottom'
                                : 'bg-indigo-700 rounded-full text-white font-poppins h-10 w-24 text-2xl m-1.5 shadow-bottom'
                        }
                        onClick={accept}
                        disabled={vcsToShare.length === 0 ? true : false}
                    >
                        {isLoading && !error ? 'SHARING...' : 'SHARE'}
                    </button>
                </IonHeader>
                <IonGrid>
                    {error && <p className="text-center text-rose-600 text-lg">{error}</p>}
                    <IonCol className="flex flex-row items-center flex-wrap mb-48 w-full  achievements-list-container">
                        {renderCredentialList}
                    </IonCol>
                </IonGrid>
            </IonRow>
        </IonPage>
    );
};

export default VCToShare;
