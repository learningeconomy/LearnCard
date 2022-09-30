import React from 'react';

import Barcode from 'react-barcode';

import { SchoolIDCardProps } from './types';

export const SchoolIDCard: React.FC<SchoolIDCardProps> = ({
    userImage,
    userName,
    text = null,
    extraText,
    backgroundImage,
    className,
    containerClassName,
}) => {
    let textEl: React.ReactNode | null = null;
    if (typeof text === 'string') {
        textEl = <h3 className="text-xs font-bold uppercase text-black">{text}</h3>;
    } else {
        textEl = text;
    }

    return (
        <div
            style={{ backgroundImage: `url(${backgroundImage})` }}
            className={`h-[200px] w-[320px] rounded-[20px] overflow-hidden ${className}`}
        >
            <div
                className={`h-full w-full flex items-center justify-start relative ${containerClassName}`}
            >
                <div className="w-full flex justify-start items-center pl-3 mt-10">
                    <div
                        className="h-[100px] w-[80px] rounded-full overflow-hidden bg-no-repeat bg-cover bg-center border-solid border-[2px] border-white mr-2"
                        style={{ backgroundImage: `url(${userImage})` }}
                    />
                    <div className="h-full flex items-start justify-center flex-col mt-7">
                        {userName && <p className="text-sm text-black font-light">{userName}</p>}
                        {textEl && textEl}
                    </div>
                </div>

                <div className="barcode-container">
                    <div className="barcode-wrap">
                        <Barcode value="barcode-example" height="22px" width="1px" fontSize={0} />
                    </div>
                </div>

                {extraText && (
                    <div>
                        <p className="absolute bottom-3 left-0 w-full flex items-center justify-center text-white text-xs font-semibold">
                            {extraText}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolIDCard;
