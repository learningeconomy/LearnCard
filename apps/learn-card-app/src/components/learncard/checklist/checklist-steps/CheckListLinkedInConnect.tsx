import React, { useState } from 'react';

import RefreshIcon from 'learn-card-base/svgs/RefreshIcon';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import LinkedInLogo from '../../../../assets/images/linkedIn-logo.png';
import LinkChain from '../../../svgs/LinkChain';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';

import { useTheme } from '../../../../theme/hooks/useTheme';

export const CheckListLinkedInConnect: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    // TODO
    // - Add LinkedIn connection functionality
    // - export data from LinkedIn to LearnCard
    // - parse over data with Ai

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const handleConnectLinkedIn = () => {
        setIsConnected(true);
    };
    const handleLinkedInOptions = () => {};

    const buttonText = isConnected ? 'Reconnect' : 'Connect';
    const buttonIcon = isConnected ? (
        <RefreshIcon className={`w-[25px] h-[26px] text-${primaryColor} mr-2`} />
    ) : (
        <LinkChain className="w-[25px] h-auto text-white mr-2" />
    );

    return (
        <>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-button-bottom px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                <div className="flex flex-col items-start justify-center py-2 w-full">
                    <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                        LinkedIn
                    </h4>
                    <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                        Connect your professional network to autofill work history and skills.
                    </p>

                    <button
                        onClick={handleConnectLinkedIn}
                        className={`w-full flex rounded-[30px] items-center justify-center  py-2 font-semibold text-[17px] ${
                            isConnected
                                ? `bg-grayscale-100 text-${primaryColor}`
                                : `bg-${primaryColor} text-white`
                        }`}
                    >
                        {buttonIcon}
                        {buttonText}
                    </button>
                </div>

                {isConnected && (
                    <div className="flex items-center justify-between w-full mt-4 relative pb-4">
                        <div className="flex items-center justify-start">
                            <div className="w-[50px] h-[50px] flex items-center justify-center mr-2">
                                <img src={LinkedInLogo} alt="linkedin logo" />
                            </div>
                            <div className="flex items-start justify-center text-left flex-col pr-4">
                                <p className="w-full text-xs text-grayscale-600">Connected to</p>
                                <p className="text-grayscale-800 text-sm font-semibold text-left line-clamp-2">
                                    email@example.com
                                </p>
                            </div>
                        </div>

                        <button onClick={handleLinkedInOptions}>
                            <ThreeDots className="w-[25px] h-[26px] text-grayscale-500 mr-2" />
                        </button>
                    </div>
                )}
            </div>
            <CheckListManagerFooter />
        </>
    );
};

export default CheckListLinkedInConnect;
