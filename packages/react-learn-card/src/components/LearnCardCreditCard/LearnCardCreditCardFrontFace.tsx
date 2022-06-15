import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import CardChip from '../../assets/images/card-chip.svg';

export const LearnCardCreditCardFrontFace: React.FC<{ userImage: string }> = ({ userImage }) => {
    return (
        <div className="flex flex-row justify-center items-start pt-9 max-w-xs max-h-[200px] min-h-[200px] rounded-[20px] shadow-3xl bg-white relative overflow-hidden">
            <div className="absolute h-[400px] w-[400px] rounded-full bg-cyan-900 top-[-50%] left-[-68%]" />
            {/* <div className="absolute h-full w-[60%] rounded-br-[20px] rounded-tr-[20px] bg-cyan-200 top-0 left-0" /> */}
            <div className="flex flex-row justify-between items-start w-full h-full relative">
                <div className="flex flex-col">
                    <div className="pl-8">
                        <p className="text-xs text-white font-bold tracking-[7px] mb-2">
                            LEARNCARD
                        </p>
                        <img src={CardChip ?? ''} alt="card chip" />
                    </div>

                    <div className="inline-block relative overflow-hidden rounded-full shadow-3xl h-0 bg-white w-1/2 pb-[50%] mt-2 ml-2">
                        <img
                            className="w-full h-full absolute rounded-full object-cover border-solid border-2 border-white"
                            src={userImage}
                            alt="user image"
                        />
                    </div>
                </div>
                <div className="flex justify-center items-center pr-4">
                    <div className="max-w-[110px] h-auto">
                        <QRCodeSVG
                            className="h-full w-full"
                            value="https://www.npmjs.com/package/@learncard/react"
                        />
                    </div>

                    {/* <img src="" alt="mastercard icon" /> */}
                </div>
            </div>
        </div>
    );
};

export default LearnCardCreditCardFrontFace;
