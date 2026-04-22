import React, { useEffect } from 'react';
import { useIonModal } from '@ionic/react';
import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';
import { redirectStore } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import ClaimLoginPage from '../login/ClaimLoginPage';
import DoubleTrapezoid from 'learn-card-base/svgs/DoubeTrapezoid';
import { IonRow } from '@ionic/react';
import { useModal, ModalTypes } from 'learn-card-base';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useTheme } from '../../theme/hooks/useTheme';
import GenericErrorBoundary from 'learn-card-base/components/generic/GenericErrorBoundary';
import LoginFooter from '../login/LoginFooter';
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
    const brandingConfig = useBrandingConfig();
    const { appIcon } = useTenantBrandingAssets();
    const { newModal, closeModal } = useModal();
    const handleInteractionModal = () => {
        newModal(
            <InteractWithWallet vc_request_url={vc_request_url} />,
            { className: 'shrink-1' },
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <DoubleTrapezoid
                    className="w-full h-full max-w-[650px] max-h-[650px] opacity-[0.12]"
                    fill="#ffffff"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[500px] px-[50px] text-center">
                <div className="flex w-full justify-center items-center mb-[24px]">
                    <img
                        src={appIcon}
                        alt={`${brandingConfig?.name ?? ''} app icon`}
                        className="w-[120px] h-[120px] rounded-[24px] object-cover shadow-2xl"
                    />
                </div>

                <h1 className="text-white text-[30px] font-semibold mb-3 leading-snug drop-shadow-sm">
                    Someone sent you a credential
                </h1>
                <p className="text-white/85 text-[17px] font-medium leading-relaxed max-w-[380px]">
                    Sign into {brandingConfig?.name} to view and claim,
                    <br />
                    <span onClick={handleInteractionModal}>
                        or{' '}
                        <span className="underline cursor-pointer text-white hover:text-white/90">
                            claim with another wallet.
                        </span>
                    </span>
                </p>
            </div>
        </div>
    );
};

export const SomeoneSentYouACredentialRequestMobile: React.FC<{
    onClick?: () => void;
    vc_request_url?: string | (string | null)[] | null;
}> = ({ onClick, vc_request_url }) => {
    const { textLogo, brandMark, appIcon } = useTenantBrandingAssets();
    const brandingConfig = useBrandingConfig();
    const { newModal, closeModal } = useModal();
    const handleInteractionModal = () => {
        newModal(
            <InteractWithWallet vc_request_url={vc_request_url} />,
            { className: 'shrink-1' },
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    return (
        <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <DoubleTrapezoid
                    className="w-full h-full max-w-[650px] max-h-[650px] opacity-[0.12]"
                    fill="#ffffff"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full px-[20px] max-w-[500px]">
                <div className="flex w-full justify-center items-center mb-[20px]">
                    <img
                        src={appIcon}
                        alt={`${brandingConfig?.name ?? ''} app icon`}
                        className="w-[120px] h-[120px] rounded-[24px] object-cover shadow-2xl"
                    />
                </div>

                <IonRow className="p-0 m-0 w-full flex items-center justify-center relative pb-[20px]">
                    <div className="flex flex-col items-center justify-center w-full">
                        <img src={textLogo} alt="Logo" className="object-contain" />
                    </div>
                </IonRow>

                <h1 className="text-white text-[24px] font-semibold text-center mb-4 max-w-[300px] drop-shadow-sm">
                    Someone sent you a credential
                </h1>
                <button
                    className="bg-white text-grayscale-800 font-semibold flex items-center justify-center p-4 py-2 rounded-[15px] h-[54px] text-[17px] shadow-soft-bottom"
                    onClick={onClick}
                >
                    <img src={brandMark} alt="Brand mark" className="rounded-full h-[40px] w-[40px] mr-[10px]" />
                    Sign In to View and Claim
                </button>
                <div className="flex w-full items-center justify-center text-white/90 font-semibold text-[14px] mt-[40px]">
                    <hr className="w-[25%] mr-[20px] border-white/30" />
                    OR
                    <hr className="w-[25%] ml-[20px] border-white/30" />
                </div>
                <span
                    className="mt-[25px] text-white underline cursor-pointer font-semibold flex items-center justify-center p-4 py-2 h-[54px] text-[17px]"
                    onClick={handleInteractionModal}
                >
                    Claim with Other Wallet
                </span>
            </div>

            <GenericErrorBoundary hideGoHome>
                <LoginFooter hideSelfCustodialLogin />
            </GenericErrorBoundary>
        </div>
    );
};
