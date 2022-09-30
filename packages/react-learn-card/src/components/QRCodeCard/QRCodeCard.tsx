import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { QRCodeCardProps } from './types';

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
    userHandle,
    qrCodeValue,
    className,
    text = null,
}) => {
    let textEl: React.ReactNode | null = null;
    if (typeof text === 'string') {
        textEl = (
            <p className="flex items-center justify-center w-full text-xl text-black font-bold tracking-[9px]">
                {text}
            </p>
        );
    } else {
        textEl = text;
    }

    return (
        <div
            className={`flex flex-col justify-center items-start pt-9 rounded-[20px] shadow-3xl max-w-[400px] bg-white relative pb-8 overflow-hidden ${className}`}
        >
            {qrCodeValue && (
                <div className="flex justify-center items-center w-full relative px-8 mb-5">
                    <div className="max-w-[90%] w-full h-auto relative">
                        <QRCodeSVG
                            className="h-full w-full"
                            value={qrCodeValue}
                            data-testid="qrcode-card"
                            bgColor="transparent"
                        />
                    </div>
                </div>
            )}

            {userHandle && (
                <p
                    className="flex items-center justify-center text-center w-full mb-3 font-semibold text-lg text-gray-500"
                    data-testid="qrcode-card-user-handle"
                >
                    {userHandle}
                </p>
            )}

            {textEl}
        </div>
    );
};

export default QRCodeCard;
