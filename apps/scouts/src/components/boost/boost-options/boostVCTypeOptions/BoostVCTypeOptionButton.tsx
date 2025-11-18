import React from 'react';

import { BoostVCTypeOptionButtonProps } from '../boostOptions';
import Checkmark from 'learn-card-base/svgs/Checkmark';

export const BoostVCTypeOptionButton: React.FC<BoostVCTypeOptionButtonProps> = ({
    IconComponent,
    iconCircleClass,
    iconClassName,
    title,
    categoryType,
    setSelectedCategoryType,
    isActive,
}) => {
    return (
        <>
            <button
                onClick={() => {
                    setSelectedCategoryType(categoryType);
                }}
                className="relative flex items-center justify-center bg-white text-black rounded-full px-[18px] py-[6px] font-mouse text-3xl text-center w-full shadow-lg uppercase tracking-wide max-w-[90%] mb-4"
            >
                <div
                    className={`flex items-center justify-center absolute h-[40px] w-[40px] left-1 rounded-full ${iconCircleClass}`}
                >
                    <IconComponent className={`h-[30px] ${iconClassName}`} />
                </div>
                {title}
                {isActive && (
                    <div
                        className={`flex items-center justify-center absolute h-[40px] w-[40px] right-1 rounded-full`}
                    >
                        <Checkmark
                            className={`h-[30px] w-[30px] text-emerald-600`}
                            strokeWidth="4"
                        />
                    </div>
                )}
            </button>
        </>
    );
};

export default BoostVCTypeOptionButton;
