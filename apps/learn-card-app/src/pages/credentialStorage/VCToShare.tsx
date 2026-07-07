import React, { useState } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('v-c-to-share');

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
                        className="bg-grayscale-900 rounded-[20px] text-white font-poppins font-medium h-10 px-6 text-sm m-1.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={accept}
                        disabled={vcsToShare.length === 0 || (isLoading && !error)}
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
