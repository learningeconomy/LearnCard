import React from 'react';

import LeftArrow from '../svgs/LeftArrow';
import PigeonMail from '../../assets/images/pigeon-mail.png';
import HandshakeIcon from '../svgs/HandshakeIcon';

import { useModal, useWallet } from 'learn-card-base';
import { openExternalLink } from '../../helpers/externalLinkHelpers';

import useTheme from '../../theme/hooks/useTheme';

export const CHAPI_ABOUT_LINK = 'https://chapi.io/';

export const ChapiPrompt: React.FC = () => {
    const { installChapi } = useWallet();
    const { closeModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <section className="text-black pt-[36px] pb-[16px] max-w-[400px]">
            <div className="w-full px-4">
                <button
                    className="text-grayscale-900 flex items-center justify-center p-0 mr-[1px] z-50"
                    onClick={closeModal}
                >
                    <LeftArrow className="w-7 h-auto text-grayscale-900" /> Back
                </button>
            </div>

            <div className="w-full flex flex-col items-center justify-center">
                <img src={PigeonMail} alt="chapi logo" />

                <h4 className="w-full text-center p-0 m-0 text-emerald-800 text-2xl mt-2 mb-2">
                    About Chapi
                </h4>
            </div>

            <div className="w-full flex flex-col items-center justify-center text-left px-4">
                <p>
                    The Credential Handler API (CHAPI) is an open-source solution for communicating
                    Verifiable Credentials on the Web.
                </p>
                <br />
                <p>
                    Think, trusted and confidential carrier pigeon, but for Verifiable Credentials.
                </p>
                <br />
                <p>
                    It allows your digital wallet to send or receive Verifiable Credentials from an
                    independent third-party verifier or issuer in a way that establishes trust and
                    preserves privacy.
                </p>
            </div>

            <div className="w-full flex items-center justify-center mt-2 mb-2">
                <button
                    onClick={() => openExternalLink(CHAPI_ABOUT_LINK)}
                    className={`text-${primaryColor}`}
                >
                    Read More
                </button>
            </div>

            <div className="w-full flex items-center justify-between px-6">
                <button
                    onClick={installChapi}
                    className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 font-poppins text-xl w-full shadow-lg normal"
                >
                    <HandshakeIcon className="mr-2" /> Connect Handler
                </button>
            </div>
        </section>
    );
};

export default ChapiPrompt;
