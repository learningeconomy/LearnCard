import React from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';

type BoostVCTypeOptionButtonProps = {
    id?: number;
    IconComponent: React.ReactNode;
    iconCircleClass?: string;
    iconClassName?: string;
    title: string;
    categoryType: BoostCategoryOptionsEnum;
    setSelectedCategoryType: SetState<string | null>;
    isActive?: boolean;
};

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
                className="relative flex items-center justify-center bg-white text-grayscale-900 rounded rounded-full px-[18px] py-[6px] text-2xl text-center w-full shadow-lg max-w-[90%] mb-4"
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
