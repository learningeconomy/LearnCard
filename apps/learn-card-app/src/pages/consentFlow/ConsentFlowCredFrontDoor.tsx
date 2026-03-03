import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import {
    useGetCurrentLCNUser,
    useConsentToContract,
    useSyncConsentFlow,
    useResolveBoost,
    useCurrentUser,
    useModal,
} from 'learn-card-base';

import CredentialSyncConfirmation from './CredentialSyncConfirmation';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import BoostLoader from '../../components/boost/boostLoader/BoostLoader';
import { IonSpinner } from '@ionic/react';

import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';
import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

type ConsentFlowCredFrontDoorProps = {
    contractDetails: ConsentFlowContractDetails;
    isPreview?: boolean;
};

const ConsentFlowCredFrontDoor: React.FC<ConsentFlowCredFrontDoorProps> = ({
    contractDetails,
    isPreview,
}) => {
    const history = useHistory();
    const currentUser = useCurrentUser()!!!!!!!!!;
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { newModal, closeModal } = useModal();

    const [isFront, setIsFront] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncingCredentials, setIsSyncingCredentials] = useState(false);

    const {
        data: resolvedBoost,
        isLoading: resolvedBoostLoading,
        isFetching: resolvedBoostFetching,
    } = useResolveBoost(contractDetails.frontDoorBoostUri);

    const { refetch: fetchNewContractCredentials } = useSyncConsentFlow();

    const { data: consentedContracts } = useConsentedContracts();
    const consentedContract = consentedContracts?.find(
        c => c?.contract?.uri === contractDetails?.uri && c?.status !== 'withdrawn'
    );
    const hasAlreadyConsented = !!consentedContract;

    const { mutateAsync: consentToContract, isPending: consentingToContract } =
        useConsentToContract(contractDetails.uri, contractDetails?.owner?.did ?? '');

    let boost = resolvedBoost?.boostCredential ?? resolvedBoost;
    boost = {
        ...boost,
        credentialSubject: {
            ...boost?.credentialSubject,
            id: currentLCNUser?.did ?? boost?.id, // override ID so VCWrapper uses current user's info/pic
        },
    };

    const showBgImage = boost?.display?.backgroundImage && boost?.display?.displayType !== 'badge';

    const handleAcceptClick = () => {
        // if there are no credentials we can just go straight to handleAccept()

        newModal(
            <CredentialSyncConfirmation
                contractDetails={contractDetails}
                handleAcceptContract={handleAccept}
            />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    const handleAccept = async (terms?: ConsentFlowTerms) => {
        setIsLoading(true);
        setIsSyncingCredentials(false);
        try {
            await consentToContract({
                // currently no way to edit any of these in this flow
                terms: terms ?? getMinimumTermsForContract(contractDetails.contract, currentUser),
                expiresAt: '',
                oneTime: false,
            });

            setIsSyncingCredentials(true);

            // Credential syncing happens in useSyncConsentFlow
            //   it displays a toast that says "Successfully synced X credentials"
            await fetchNewContractCredentials();

            // history.push('/wallet');
        } finally {
            setIsSyncingCredentials(false);
            setIsLoading(false);
        }
    };

    return (
        <div
            className="h-full w-full bg-cover bg-grayscale-800"
            style={{
                backgroundImage: showBgImage
                    ? `url(${boost?.display?.backgroundImage})`
                    : undefined,
                backgroundColor: boost?.display?.backgroundColor,
            }}
        >
            <div className="h-full w-full bg-black bg-opacity-20 backdrop-blur-[5px] flex items-center justify-center">
                {isLoading && (
                    <BoostLoader
                        darkBackground
                        className="bg-opacity-50 backdrop-blur-[5px]"
                        text={
                            isSyncingCredentials
                                ? `Syncing Credentials...`
                                : 'Accepting Contract...'
                        }
                    />
                )}

                {!isLoading && (
                    <>
                        {resolvedBoost && (
                            <>
                                <section className="h-full w-full overflow-y-auto disable-scrollbars pt-[calc(30px+env(safe-area-inset-top))] pb-32 boost-preview-display">
                                    <VCDisplayCardWrapper2
                                        credential={boost}
                                        checkProof={false}
                                        hideNavButtons
                                        isFrontOverride={isFront}
                                        setIsFrontOverride={setIsFront}
                                    />
                                </section>

                                <footer className="absolute bottom-0 left-0 w-full z-9999">
                                    <BoostFooter
                                        handleClose={
                                            isPreview ? closeModal : () => history.push('/')
                                        }
                                        handleDetails={
                                            isFront ? () => setIsFront(false) : undefined
                                        }
                                        handleBack={isFront ? undefined : () => setIsFront(true)}
                                        handleClaim={handleAcceptClick}
                                        disableClaimButton={isPreview || hasAlreadyConsented}
                                        claimBtnText={hasAlreadyConsented ? 'Accepted' : undefined}
                                    />
                                </footer>
                            </>
                        )}

                        {!resolvedBoost && (
                            <div className="flex flex-col items-center gap-[10px]">
                                <IonSpinner className="h-[34px] w-[34px]" />
                                <span className="text-white text-[18px]">Loading...</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConsentFlowCredFrontDoor;
