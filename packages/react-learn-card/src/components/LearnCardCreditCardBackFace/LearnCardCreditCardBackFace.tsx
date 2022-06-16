import React from 'react';

import ContactlessSymbol from '../../assets/images/contactless-symbol.svg';

import { LearnCardCreditCardBackFaceProps } from './types';

export const LearnCardCreditCardBackFace: React.FC<LearnCardCreditCardBackFaceProps> = ({
    className,
}) => {
    return (
        <div
            className={`flex flex-col justify-start items-start max-w-xs max-h-[200px] min-h-[200px] rounded-[20px] shadow-3xl bg-grayscale-900 relative overflow-hidden ${className}`}
        >
            <div className="flex justify-between items-center w-full px-3 pt-4 text-white">
                <p className="text-[6px]">
                    Please visit LearnCard app or learncard.com for assistance
                </p>
                <p className="text-[6px]">854-000-000-24</p>
            </div>

            <div className="w-full h-8 bg-white mt-1" />

            <div className="flex justify-end items-center w-full px-3 mt-1 text-white">
                <p className="text-[6px]">IDEMIA 0 00000 00000 0/00</p>
            </div>

            <div className="flex flex-row justify-between items-center px-3 pt-2 w-full text-white">
                <div className="">
                    <p className="text-[10px] font-medium">@userhandle_longuserhandle_990990</p>
                    <p className="text-sm tracking-wider">USER FULL NAME</p>
                    <p className="text-[10px] tracking-wider">MEMBER SINCE 2022</p>
                </div>
                <div>
                    <img src={ContactlessSymbol} alt="contactless icon" />
                </div>
            </div>

            <div className="flex flex-row justify-between items-center px-3 pt-2 w-full text-white">
                <div className="flex flex-col">
                    <p className="text-sm tracking-wider">0000 0000 0000 0000</p>
                    <div className="flex flex-row justify-between items-center">
                        <p className="text-[10px] tracking-wider">EXP 00/00</p>
                        <p className="text-[10px] tracking-wider">SEC CODE 123</p>
                    </div>
                </div>
                <div>
                    <div className="h-[33px] w-[55px] rounded-[60px] bg-white" />
                </div>
            </div>

            <div className="flex justify-start items-center w-full px-3 py-2 text-white">
                <p className="text-[6px]">
                    Issued by the bank of Tennessee pursuant to license by Mastercard International
                </p>
            </div>
        </div>
    );
};

export default LearnCardCreditCardBackFace;
