import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import type { LearnCardCreditCardFrontFaceProps } from './types';

import CardChip from '../../assets/images/card-chip.svg';
import MasterCardLogo from '../../assets/images/master-card-logo.svg';

export const LearnCardCreditCardFrontFace: React.FC<LearnCardCreditCardFrontFaceProps> = ({
    userImage,
    userImageComponent = null,
    qrCodeValue,
    className,
    showActionButton = false,
    actionButtonText = 'Open Card',
    onClick = () => {},
    children,
}) => {
    let userImageEl: React.ReactNode | null = null;

    if (userImage) {
        userImageEl = (
            <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 bg-white w-1/2 pb-[50%] mt-2 ml-4">
                <img
                    className="w-full h-full absolute rounded-full object-cover border-solid border-2 border-white"
                    src={userImage}
                    alt="user image"
                    data-testid="credit-card-frontface-userImg"
                />
            </div>
        );
    } else if (!userImage && userImageComponent) {
        userImageEl = userImageComponent;
    }

    return (
        <div
            className={`flex justify-center items-center max-w-[375px] rounded-[20px] ${className}`}
        >
            <div
                className={`flex flex-row justify-center items-start pt-9 w-full min-h-[220px] rounded-[20px] shadow-3xl relative overflow-hidden credit-card-front-face`}
            >
                <div className="absolute top-[-40px] left-0 w-[55%] h-[140%] rounded-tr-[150px] rounded-br-[150px] bg-grayscale-900 credit-card-bubble" />
                {showActionButton && (
                    <button
                        className="absolute top-2 right-4 bg-grayscale-500 border-[2px] rounded-3xl border-solid border-color-grayscale-900 min-w-[110px] p-[2px] font-bold text-xs tracking-wide leading-snug text-center text-white"
                        onClick={onClick}
                        data-testid="credit-card-frontface-button"
                    >
                        {actionButtonText}
                    </button>
                )}
                <div className="flex flex-row justify-between items-start w-full h-full relative">
                    <div className="flex flex-1 flex-col">
                        <div className="pl-8">
                            <p className="w-full text-xs text-white font-bold tracking-[7px] mb-2 credit-card-front-face-title">
                                LEARNCARD
                            </p>
                            <img
                                src={CardChip ?? ''}
                                alt="card chip"
                                className="h-[30px] w-[42px]"
                            />
                        </div>

                        {userImageEl}
                    </div>

                    {qrCodeValue && (
                        <div className="flex flex-1 justify-center items-center relative pl-10 credit-card-qr-code-container">
                            <div className="h-auto relative qr-code-container">
                                {/* <div className="qr-code-upper-left-yellow" />
                            <div className="qr-code-upper-right-pink-square" />
                            <div className="qr-code-bottom-left-purple-square" />
                            <div className="qr-code-green-blob" />
                            <div className="qr-code-green-blob-2" />
                            <div className="qr-code-blue-blob" />
                            <div className="qr-code-orange-blob" /> */}
                                <QRCodeSVG
                                    className="h-full w-full"
                                    value={qrCodeValue}
                                    data-testid="credit-card-qr-code"
                                    bgColor="transparent"
                                    // fgColor="#999999"
                                />
                            </div>
                        </div>
                    )}

                    <img
                        src={MasterCardLogo ?? ''}
                        alt="mastercard icon"
                        className="absolute bottom-[-8px] right-4 learn-card-mastercard-logo"
                    />
                </div>
            </div>
            {children}
        </div>
    );
};

export default LearnCardCreditCardFrontFace;
