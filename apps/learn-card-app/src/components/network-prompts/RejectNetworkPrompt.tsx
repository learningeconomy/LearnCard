import React from 'react';

import { JoinNetworkModalWrapper } from './hooks/useJoinLCNetworkModal';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import { ModalTypes, useModal } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';

export const RejectNetworkPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const brandingConfig = useBrandingConfig();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    return (
        <section className="w-full px-6 pt-6 pb-4">
            <div className="flex flex-col pb-4 pt-2 w-full">
                <div className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">
                        {brandingConfig?.name || 'LEARNCARD'}
                    </h6>
                </div>
                <div className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black font-poppins text-xl">No Problem!</h6>
                </div>
                <div className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black font-poppins text-xl">
                        You can still use LearnCard.
                    </h6>
                </div>
            </div>
            <div className="flex items-center justify-center w-full">
                <div className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        You can still receive and share credentials with “school connect” and your{' '}
                        <span className={`text-${primaryColor} font-bold`}>LearnCard number</span>.
                    </p>
                </div>
            </div>
            <div className="w-full flex items-center justify-center mt-6">
                <div className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                    <button
                        onClick={() => handleCloseModal()}
                        type="submit"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-poppins text-xl w-full shadow-lg normal max-w-[320px]"
                    >
                        Continue
                    </button>

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                                setTimeout(() => {
                                    newModal(
                                        <JoinNetworkModalWrapper
                                            handleCloseModal={closeModal}
                                            showNotificationsModal={false}
                                        />,
                                        { hideButton: true, sectionClassName: '!max-w-[400px]' },
                                        {
                                            desktop: ModalTypes.Cancel,
                                            mobile: ModalTypes.Cancel,
                                        }
                                    );
                                }, 0);
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            Join LearnCard Network
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center mt-4 w-full">
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                        You own your own data.
                        <br />
                        All connections are encrypted.
                    </p>
                    <button className={`text-${primaryColor} font-bold`}>Learn More</button>
                </div>
            </div>
            <div className="flex items-center justify-center w-full">
                <div className="flex items-center justify-center">
                    <button onClick={openPP} className={`text-${primaryColor} font-bold text-sm`}>
                        Privacy Policy
                    </button>
                    <span className={`text-${primaryColor} font-bold text-sm`}>•</span>
                    <button onClick={openToS} className={`text-${primaryColor} font-bold text-sm`}>
                        Terms of Service
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RejectNetworkPrompt;
