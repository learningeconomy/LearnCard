import React from 'react';

import { BoostUserTypeEnum, BoostCategoryOptionsEnum, boostCategoryOptions } from '../boostOptions';

export const BoostSubCategoryButton: React.FC<{
    closeAllModals: () => void;
    title: string;
    boostUserType: BoostUserTypeEnum;
    boostCategoryType: BoostCategoryOptionsEnum;
    subCategoryType: string;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<BoostCategoryOptionsEnum | null>>;
    otherUserProfileId?: string;
    history: any;
}> = ({
    title,
    boostUserType,
    boostCategoryType,
    subCategoryType,
    otherUserProfileId = '',
    history,
    closeAllModals,
}) => {
    const { IconComponent, color } = boostCategoryOptions[boostCategoryType];

    const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${boostCategoryType}&boostSubCategoryType=${subCategoryType}`

    let link = baseLink;

    if (otherUserProfileId) {
        link = `${baseLink}&otherUserProfileId=${otherUserProfileId}`;
    }

    return (
        <>
            <button
                onClick={() => {
                    history.push(link);
                    closeAllModals();
                }}
                className="relative flex items-center justify-center bg-white text-black rounded-full px-[18px] py-[6px]  text-2xl text-center w-full shadow-lg max-w-[90%] mb-4"
            >
                <div
                    className={`flex items-center justify-center absolute h-[40px] w-[40px] left-1 rounded-full bg-${color}`}
                >
                    <IconComponent className={`h-[30px] text-white`} />
                </div>
                {title}
            </button>
        </>
    );
};

export default BoostSubCategoryButton;
