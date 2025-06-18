import React from 'react';

import Barcode from 'react-barcode';

import type { SchoolIDCardProps } from './types';

export const SchoolIDCard: React.FC<SchoolIDCardProps> = ({
    userImage,
    userName,
    text = null,
    extraText,
    subjectInitials,
    subjectInitialsClass,
    showBarcode = true,
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

    let issueeImageEl: React.ReactNode | null = null;
    const initialsClass = `subject-initials h-[70px] w-[70px] rounded-full mr-[10px] flex flex-row items-center justify-center h-full w-full overflow-hidden bg-emerald-700 text-white font-medium text-3xl ${subjectInitialsClass}`;

    if (userImage && userImage?.trim() !== '') {
        issueeImageEl = (
            <div
                className="h-[80px] w-[80px] rounded-full overflow-hidden bg-no-repeat bg-cover bg-center border-solid border-[2px] border-white mr-2"
                style={{ backgroundImage: `url(${userImage})` }}
            />
        );
    } else if (subjectInitials && (!userImage || userImage?.trim() === '')) {
        issueeImageEl = <div className={initialsClass}>{subjectInitials}</div>;
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
                    {issueeImageEl}
                    <div className="h-full flex items-start justify-center flex-col mt-7">
                        {userName && <p className="text-sm text-black font-light">{userName}</p>}
                        {textEl}
                    </div>
                </div>

                {showBarcode && (
                    <div className="barcode-container">
                        <div className="barcode-wrap">
                            <Barcode
                                value="barcode-example"
                                height="22px"
                                width="1px"
                                fontSize={0}
                            />
                        </div>
                    </div>
                )}

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
