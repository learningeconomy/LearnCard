import React from 'react';

import BadgeDisplayTypeIcon from 'learn-card-base/assets/images/badge-display-type.svg';
import CertificateDisplayTypeIcon from 'learn-card-base/assets/images/cert-display-type.svg';
import AwardDisplayTypeIcon from 'learn-card-base/assets/images/award-display-type.svg';
// import CoursesDisplayTypeIcon from 'learn-card-base/assets/images/course-display-type.svg';
// import IDDisplayTypeIcon from 'learn-card-base/assets/images/id-display-type.svg';
import MediaDisplayTypeIcon from 'learn-card-base/assets/images/media-display-type.svg';

import { BoostCMSAppearanceDisplayTypeEnum, BoostCMSState } from '../../../boost';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { useModal } from 'learn-card-base';

type BoostCMSDisplayTypeSelectorModalProps = {
    state: BoostCMSState;
    handleDisplayTypeChange: (newDisplayType: BoostCMSAppearanceDisplayTypeEnum) => void;
};

export const BoostCMSDisplayTypeSelectorModal: React.FC<BoostCMSDisplayTypeSelectorModalProps> = ({
    state,
    handleDisplayTypeChange,
}) => {
    const { closeModal } = useModal();

    const handleSetDisplayType = (displayType: BoostCMSAppearanceDisplayTypeEnum) => {
        handleDisplayTypeChange(displayType);
        closeModal();
    };

    const displayTypeOptions = [
        {
            title: 'Badge',
            icon: BadgeDisplayTypeIcon,
            onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.Badge),
            type: BoostCMSAppearanceDisplayTypeEnum.Badge,
        },
        {
            title: 'Award',
            icon: AwardDisplayTypeIcon,
            onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.Award),
            type: BoostCMSAppearanceDisplayTypeEnum.Award,
        },
        {
            title: 'Certificate',
            icon: CertificateDisplayTypeIcon,
            onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.Certificate),
            type: BoostCMSAppearanceDisplayTypeEnum.Certificate,
        },
        {
            title: 'Media',
            icon: MediaDisplayTypeIcon,
            onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.Media),
            type: BoostCMSAppearanceDisplayTypeEnum.Media,
        },
        // commented out for now
        // since the display type selector is only visible to badge & cert types
        // courses & IDs cannot change their display type
        // {
        //     title: 'ID',
        //     icon: IDDisplayTypeIcon,
        //     onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.ID),
        // },
        // {
        //     title: 'Course',
        //     icon: CoursesDisplayTypeIcon,
        //     onClick: () => handleSetDisplayType(BoostCMSAppearanceDisplayTypeEnum.Course),
        // },
    ];

    return (
        <div className="w-full flex flex-col items-center justify-center text-black pt-[36px] pb-[16px]">
            {displayTypeOptions.map(({ title, icon, onClick, type }, index) => {
                const isSelected = type === state?.appearance?.displayType;

                return (
                    <div
                        key={index}
                        className="w-[90%] flex items-center justify-center mb-2 last:mb-0 border-b-[2px] border-b-grayscale-100 border-solid last:border-b-0"
                    >
                        <button
                            onClick={onClick}
                            className="w-full flex items-center justify-between pb-2 text-[17px]"
                        >
                            <div className="flex items-center">
                                <img
                                    src={icon}
                                    className="w-[35px] h-auto mr-2"
                                    alt="display type"
                                />{' '}
                                Display as {title}
                            </div>

                            {isSelected && (
                                <div className="flex items-center justify-center rounded-full bg-emerald-700 p-1">
                                    <Checkmark className="text-white h-[25px] w-[25px]" />
                                </div>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default BoostCMSDisplayTypeSelectorModal;
