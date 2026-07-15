import React from 'react';

import ModalLayout from '../../layout/ModalLayout';
import * as m from '../../paraglide/messages.js';
import LeftArrow from '../svgs/LeftArrow';
import PigeonMail from '../../assets/images/pigeon-mail.png';
import HandshakeIcon from '../svgs/HandshakeIcon';

import { useWallet } from 'learn-card-base';
import { openExternalLink } from '../../helpers/externalLinkHelpers';

export const CHAPI_ABOUT_LINK = 'https://chapi.io/';

export const ChapiPrompt: React.FC<{ handleCloseModal: () => void }> = ({ handleCloseModal }) => {
    const { installChapi } = useWallet();

    return (
        <ModalLayout allowScroll handleOnClick={handleCloseModal}>
            <div className="w-full px-4">
                <button
                    className="text-grayscale-900 flex items-center justify-center p-0 mr-[1px] z-50"
                    onClick={handleCloseModal}
                >
                    <LeftArrow className="w-7 h-auto text-grayscale-900" /> {m['common.back']()}
                </button>
            </div>

            <div className="w-full flex flex-col items-center justify-center">
                <img src={PigeonMail} alt="chapi logo" />

                <h4 className="w-full text-center p-0 m-0 text-emerald-800 text-2xl mt-2 mb-2">
                    {m['credsBundle.aboutChapi']()}
                </h4>
            </div>

            <div className="w-full flex flex-col items-center justify-center text-left px-4">
                <p>
                    {m['credsBundle.chapiDesc1']()}
                </p>
                <br />
                <p>
                    {m['credsBundle.chapiDesc2']()}
                </p>
                <br />
                <p>
                    {m['credsBundle.chapiDesc3']()}
                </p>
            </div>

            <div className="w-full flex items-center justify-center mt-2 mb-2">
                <button
                    onClick={() => openExternalLink(CHAPI_ABOUT_LINK)}
                    className="text-indigo-600"
                >
                    {m['common.learnMore']()}
                </button>
            </div>

            <div className="w-full flex items-center justify-between px-6">
                <button
                    onClick={installChapi}
                    className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-grayscale-900 text-2xl w-full shadow-lg"
                >
                    <HandshakeIcon className="mr-2" /> {m['credsBundle.connectHandler']()}
                </button>
            </div>
        </ModalLayout>
    );
};

export default ChapiPrompt;
