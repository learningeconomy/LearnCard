import React, { useEffect } from 'react';

import { BoostCategoryOptionsEnum, ModalTypes, getBoostMetadata, useModal } from 'learn-card-base';
import { IonRow } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';
import BadgeDisplayTypeIcon from 'learn-card-base/assets/images/badge-display-type.svg';
import CertificateDisplayTypeIcon from 'learn-card-base/assets/images/cert-display-type.svg';
import CoursesDisplayTypeIcon from 'learn-card-base/assets/images/course-display-type.svg';
import IDDisplayTypeIcon from 'learn-card-base/assets/images/id-display-type.svg';
import AwardDisplayTypeIcon from 'learn-card-base/assets/images/award-display-type.svg';
import MediaDisplayTypeIcon from 'learn-card-base/assets/images/media-display-type.svg';

import { BoostCMSAppearanceDisplayTypeEnum, BoostCMSState } from '../../../boost';
import BoostCMSDisplayTypeSelectorModal from './BoostCMSDisplayTypeSelectorModal';

type BoostCMSDisplayTypeSelectorProps = {
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    setDisplayType?: React.Dispatch<React.SetStateAction<BoostCMSAppearanceDisplayTypeEnum>>;
    disabled?: boolean;
};

const BoostCMSDisplayTypeSelector: React.FC<BoostCMSDisplayTypeSelectorProps> = ({
    state,
    setState,
    setDisplayType,
    disabled = false,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    // Use useEffect to update the state if necessary
    useEffect(() => {
        if (!state.appearance?.displayType && setState) {
            setState(prevState => ({
                ...prevState,
                appearance: {
                    ...prevState.appearance,
                    displayType: BoostCMSAppearanceDisplayTypeEnum.Badge,
                },
            }));
        }
    }, [state.appearance?.displayType, setState]);

    // Default to 'certificate' if displayType is not set
    const displayType = state?.appearance?.displayType || BoostCMSAppearanceDisplayTypeEnum.Badge;

    const { color: _color } =
        getBoostMetadata(state?.basicInfo?.type as BoostCategoryOptionsEnum) || {};
    const displayTypeText = `${displayType} Display`;

    let displayTypeIcon = null;
    if (displayType === BoostCMSAppearanceDisplayTypeEnum.Badge) {
        displayTypeIcon = BadgeDisplayTypeIcon;
    } else if (displayType === BoostCMSAppearanceDisplayTypeEnum.Award) {
        displayTypeIcon = AwardDisplayTypeIcon;
    } else if (displayType === BoostCMSAppearanceDisplayTypeEnum.Certificate) {
        displayTypeIcon = CertificateDisplayTypeIcon;
    } else if (displayType === BoostCMSAppearanceDisplayTypeEnum.Course) {
        displayTypeIcon = CoursesDisplayTypeIcon;
    } else if (displayType === BoostCMSAppearanceDisplayTypeEnum.ID) {
        displayTypeIcon = IDDisplayTypeIcon;
    } else if (displayType === BoostCMSAppearanceDisplayTypeEnum.Media) {
        displayTypeIcon = MediaDisplayTypeIcon;
    }

    const handleDisplayTypeChange = (newDisplayType: BoostCMSAppearanceDisplayTypeEnum) => {
        setDisplayType?.(newDisplayType);
        setState(prevState => ({
            ...prevState,
            appearance: {
                ...prevState.appearance,
                displayType: newDisplayType,
            },
        }));
    };

    return (
        <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4">
            <button
                className="w-full bg-white ion-padding rounded-[20px] flex items-center justify-between"
                disabled={disabled}
                onClick={() => {
                    newModal(
                        <BoostCMSDisplayTypeSelectorModal
                            state={state}
                            handleDisplayTypeChange={handleDisplayTypeChange}
                        />,
                        { sectionClassName: '!max-w-[400px]' }
                    );
                }}
            >
                <div className="flex items-center justify-start font-poppins text-xl text-grayscale-900 capitalize">
                    <img
                        src={displayTypeIcon}
                        className="w-[30px] h-auto mr-2"
                        alt="display type"
                    />{' '}
                    {displayTypeText}
                </div>
                <CaretLeft className="rotate-180 text-grayscale-900" />
            </button>
        </IonRow>
    );
};

export default BoostCMSDisplayTypeSelector;
