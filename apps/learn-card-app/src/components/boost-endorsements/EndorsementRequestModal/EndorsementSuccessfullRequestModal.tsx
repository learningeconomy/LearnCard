import React from 'react';

import LearnCardIcon from '../../../assets/images/lca-icon-v2.png';
import DesktopLoginBG from '../../../assets/images/desktop-login-bg-alt.png';
import EndorsementBadge from '../../../assets/images/endorsement-badge.png';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

import LearnCardTextLogo from '../../svgs/LearnCardTextLogo';

import { useModal, useIsLoggedIn, useDeviceTypeByWidth } from 'learn-card-base';

export const EndorsementSuccessfullRequestModal: React.FC<{ showCloseButton: boolean }> = ({
    showCloseButton,
}) => {
    const { closeModal } = useModal();
    const isLoggedIn = useIsLoggedIn();
    const { isDesktop } = useDeviceTypeByWidth();

    const loggedOutBGStyles = isLoggedIn
        ? {}
        : {
              background: `url(${DesktopLoginBG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
          };

    return (
        <div
            className="flex h-full w-full flex-col items-center justify-center px-4"
            style={loggedOutBGStyles}
        >
            <LearnCardTextLogo className="w-[235px] h-[16px] mb-[80px]" />

            {/* content */}
            <div className="flex flex-col items-center justify-center bg-white  w-full max-w-[375px] rounded-[20px] pt-4 relative">
                {/* endorsement badge */}
                <img
                    src={EndorsementBadge}
                    alt="Endorsement Badge"
                    className="absolute top-[-50px] left-[50%] -translate-x-1/2"
                />

                <div className="w-full flex flex-col items-center justify-center gap-4 pt-[50px] pb-[25px] px-2">
                    <h4 className="text-center w-full text-grayscale-900 text-[22px] font-semibold">
                        Thanks!
                        <br /> Your endorsement is temporarily saved.
                    </h4>
                    <div className="w-full flex flex-col items-center justify-center pb-4 px-[12px]">
                        <p className="text-center w-full text-grayscale-900 text-base">
                            Sign in to send your <br /> endorsement.
                        </p>
                    </div>
                </div>
            </div>

            {!isLoggedIn && !isDesktop && (
                <button
                    onClick={() => {
                        closeModal();
                    }}
                    className={`py-[9px] px-2 items-center justify-between rounded-[16px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] mr-2 max-w-[375px] mt-4 bg-white font-semibold z-9999`}
                >
                    <div
                        className="flex items-center gap-2 rounded-full bg-grayscale-100 p-2 h-[40px] w-[40px] z-[9999999]"
                        style={{
                            backgroundImage: `url(${LearnCardIcon})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    Sign in to send
                    <EndorsmentThumbWithCircle
                        className={`w-[40px] h-[40px] text-grayscale-700`}
                        fill="#E2E3E9"
                    />
                </button>
            )}
            {isDesktop && showCloseButton && (
                <button
                    onClick={() => {
                        closeModal();
                    }}
                    className={`py-[9px] px-2 items-center justify-center rounded-[16px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] mr-2 max-w-[375px] mt-4 bg-white font-semibold z-9999`}
                >
                    Close
                </button>
            )}
        </div>
    );
};

export default EndorsementSuccessfullRequestModal;
