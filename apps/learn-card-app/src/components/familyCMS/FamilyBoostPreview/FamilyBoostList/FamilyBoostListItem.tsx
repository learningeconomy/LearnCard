import React from 'react';

import SlimCaretRight from '../../../svgs/SlimCaretRight';
import { BoostCategoryOptionsEnum } from '../../../boost/boost-options/boostOptions';

export const FamilyBoostListItem: React.FC<{
    title: string;
    icon: React.ReactNode;
    boostType: BoostCategoryOptionsEnum;
    onClick: () => void;
}> = ({ title, icon, boostType, onClick }) => {
    // query for child count here

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between w-full mb-2 border-solid border-b-[2px] pb-4 border-grayscale-100"
        >
            <p className="flex items-center text-grayscale-900 font-poppins text-xl">
                <span className="mr-2 min-h-[40px] min-w-[40px] flex items-center justify-center">
                    {icon}
                </span>{' '}
                Social Boosts
            </p>
            <div className="flex items-center justify-center text-grayscale-600 font-poppins text-sm">
                0
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </div>
    );
};

export default FamilyBoostListItem;
