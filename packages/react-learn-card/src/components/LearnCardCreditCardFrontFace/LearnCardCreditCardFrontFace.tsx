import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { LearnCardCreditCardFrontFaceProps } from './types';

import CardChip from '../../assets/images/card-chip.svg';
import MasterCardLogo from '../../assets/images/master-card-logo.svg';

export const LearnCardCreditCardFrontFace: React.FC<LearnCardCreditCardFrontFaceProps> = ({
    userImage,
    qrCodeValue,
    className,
    showActionButton = false,
    actionButtonText = 'Open Card',
    onClick = () => {},
}) => {
    return (
        <div
            className={`flex flex-row justify-center items-start pt-9 max-w-xs max-h-[200px] min-h-[200px] rounded-[20px] shadow-3xl bg-white relative overflow-hidden ${className}`}
        >
            <div className="absolute h-[400px] w-[400px] rounded-full bg-grayscale-900 top-[-50%] left-[-68%]" />
            {showActionButton && (
                <button
                    type="button"
                    className="absolute top-2 right-4 bg-grayscale-50 border-[2px] rounded-3xl border-solid border-color-grayscale-900 min-w-[110px] p-[2px] font-bold text-xs tracking-wide leading-snug text-center text-white"
                    onClick={onClick}
                    data-testid="credit-card-frontface-button"
                >
                    {actionButtonText}
                </button>
            )}
            {/* <div className="absolute h-full w-[60%] rounded-br-[20px] rounded-tr-[20px] bg-cyan-200 top-0 left-0" /> */}
            <div className="flex flex-row justify-between items-start w-full h-full relative">
                <div className="flex flex-col">
                    <div className="pl-8">
                        <p className="text-xs text-white font-bold tracking-[7px] mb-2">
                            LEARNCARD
                        </p>
                        <img src={CardChip ?? ''} alt="card chip" className="h-[30px] w-[42px]" />
                    </div>

                    {userImage && (
                        <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 bg-white w-1/2 pb-[50%] mt-2 ml-4">
                            <img
                                className="w-full h-full absolute rounded-full object-cover border-solid border-2 border-white"
                                src={userImage}
                                alt="user image"
                                data-testId="credit-card-frontface-userImg"
                            />
                        </div>
                    )}
                </div>

                {qrCodeValue && (
                    <div className="flex justify-center items-center pr-4 relative">
                        <div className="max-w-[110px] h-auto relative qr-code-container">
                            <QRCodeSVG
                                className="h-full w-full"
                                value={qrCodeValue}
                                data-testid="credit-card-qr-code"
                                bgColor="transparent"
                            />
                        </div>
                    </div>
                )}

                <img
                    src={MasterCardLogo ?? ''}
                    alt="mastercard icon"
                    className="absolute bottom-0 right-4"
                />
            </div>
        </div>
    );
};

export default LearnCardCreditCardFrontFace;
