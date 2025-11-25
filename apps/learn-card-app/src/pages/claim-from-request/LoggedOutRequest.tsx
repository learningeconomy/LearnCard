import React, { useEffect } from 'react';
import { useIonModal } from '@ionic/react';
import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';
import { redirectStore } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import ClaimLoginPage from '../login/ClaimLoginPage';
import DoubleTrapezoid from 'learn-card-base/svgs/DoubeTrapezoid';
import LCAColorBlockPlus from 'learn-card-base/svgs/LCAColorBlockPlus';
import { IonRow } from '@ionic/react';
import { useModal, ModalTypes } from 'learn-card-base';
import LearnCardTextLogo from '../../components/svgs/LearnCardTextLogo';
import GenericErrorBoundary from 'learn-card-base/components/generic/GenericErrorBoundary';
import LoginFooter from '../login/LoginFooter';
import LearnCardBrandmark from '../../components/svgs/LearnCardBrandmark';
import InteractWithWallet from './InteractWithWallet';
const LoggedOutRequest: React.FC<{ vc_request_url?: string | (string | null)[] | null }> = ({
    vc_request_url,
}) => {
    useEffect(() => {
        const redirectTo = `/request?vc_request_url=${vc_request_url}`;
        redirectStore.set.lcnRedirect(redirectTo);
    }, []);

    return (
        <ClaimLoginPage
            vc_request_url={vc_request_url}
            alternateBgComponent={
                <SomeoneSentYouACredentialRequest vc_request_url={vc_request_url} />
            }
        />
    );
};

export default LoggedOutRequest;

export const SomeoneSentYouACredentialRequest: React.FC<{
    vc_request_url?: string | (string | null)[] | null;
}> = ({ vc_request_url }) => {
    const { newModal, closeModal } = useModal();
    const handleInteractionModal = () => {
        newModal(
            <InteractWithWallet vc_request_url={vc_request_url} />,
            { className: 'shrink-1' },
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-[650px] max-h-[650px] z-0">
                <DoubleTrapezoid className="w-full h-full z-0" />

                <div className="absolute top-[0px] flex flex-col items-center justify-center w-full h-full px-8 z-10 max-w-[650px] px-[50px]">
                    <div className="flex w-full justify-center items-center mb-[20px]">
                        <LCAColorBlockPlus className="top-[0px] flex flex-col w-[127px] h-[127px] z-10 max-w-[200px]" />
                    </div>

                    <h1 className="text-[30px] font-semibold text-center mb-4 max-w-[300px]">
                        Someone sent you a credential
                    </h1>
                    <p className="text-[17px] font-semibold text-center px-[20px] my-[10px]">
                        Sign into LearnCard to view and claim,
                        <br />
                        <span onClick={handleInteractionModal}>
                            or{' '}
                            <span className="underline cursor-pointer">
                                {' '}
                                claim with another wallet.
                            </span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export const SomeoneSentYouACredentialRequestMobile: React.FC<{
    onClick?: () => void;
    vc_request_url?: string | (string | null)[] | null;
}> = ({ onClick, vc_request_url }) => {
    const { newModal, closeModal } = useModal();
    const handleInteractionModal = () => {
        newModal(
            <InteractWithWallet vc_request_url={vc_request_url} />,
            { className: 'shrink-1' },
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-[650px] max-h-[650px] z-0">
                <DoubleTrapezoid className="w-full h-full z-0" />

                <div className="absolute top-[0px] flex flex-col items-center justify-center w-full h-full px-8 z-10 max-w-[650px] px-[20px]">
                    <div className="flex w-full justify-center items-center mb-[20px]">
                        <LCAColorBlockPlus className="top-[0px] flex flex-col w-[127px] h-[127px] z-10 max-w-[200px]" />
                    </div>

                    <IonRow className="p-0 m-0 w-full flex items-center justify-center relative pb-[20px]">
                        <div className="flex flex-col items-center justify-center w-full">
                            <LearnCardTextLogo />
                        </div>
                    </IonRow>

                    <h1 className="text-[24px] font-semibold text-center mb-4 max-w-[300px]">
                        Someone sent you a credential
                    </h1>
                    <button
                        className="bg-white text-grayscale-800 font-semibold flex items-center justify-center p-4 py-2 rounded-[15px] h-[54px]font-semibold text-[17px] shadow-soft-bottom"
                        onClick={onClick}
                    >
                        <LearnCardBrandmark className="rounded-full h-[40px] w-[40px] mr-[10px]" />
                        Sign In to View and Claim
                    </button>
                    <div className="flex w-full items-center justify-center text-white font-semibold text-[14px] mt-[40px]">
                        <hr className="w-[25%] mr-[20px]" />
                        OR
                        <hr className="w-[25%] ml-[20px]" />
                    </div>
                    <span
                        className="mt-[25px] text-white underline cursor-pointer font-semibold flex items-center justify-center p-4 py-2  h-[54px] font-semibold text-[17px]"
                        onClick={handleInteractionModal}
                    >
                        Claim with Other Wallet
                    </span>
                </div>
            </div>
            <GenericErrorBoundary hideGoHome>
                <LoginFooter hideSelfCustodialLogin />
            </GenericErrorBoundary>
        </div>
    );
};
