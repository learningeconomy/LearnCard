import React from 'react';

import { BoostUserTypeEnum, BoostCategoryOptionsEnum, boostCategoryOptions } from '../boostOptions';
import { useModal } from 'learn-card-base';
import { useHistory } from 'react-router-dom';

type BoostSubCategoryButtonProps = {
    title: string;
    boostUserType: BoostUserTypeEnum;
    boostCategoryType: BoostCategoryOptionsEnum;
    subCategoryType: string;
    setSelectedCategoryType: React.Dispatch<React.SetStateAction<BoostCategoryOptionsEnum | null>>;
    otherUserProfileId?: string;
};

export const BoostSubCategoryButton: React.FC<BoostSubCategoryButtonProps> = ({
    title,
    boostUserType,
    boostCategoryType,
    subCategoryType,
    otherUserProfileId = '',
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const { IconComponent, color } = boostCategoryOptions[boostCategoryType];

    const baseLink = `/boost?boostUserType=${boostUserType}&boostCategoryType=${boostCategoryType}&boostSubCategoryType=${subCategoryType}`;

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
                className="relative flex items-center justify-center bg-white text-black rounded-full px-[18px] py-[6px] font-poppins font-medium text-lg text-center w-full shadow-lg max-w-[90%] mb-4"
            >
                <div
                    className={`flex items-center justify-center absolute h-[35px] w-[35px] left-1 rounded-full overflow-hidden bg-${color}`}
                >
                    <IconComponent className={`h-[30px] text-white`} />
                </div>
                {title}
            </button>
        </>
    );
};

export default BoostSubCategoryButton;
