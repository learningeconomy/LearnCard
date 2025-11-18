import React from 'react';

import { IonCol, IonRow } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';

import { CredentialCategoryEnum } from 'learn-card-base/types/credentials';
import {
    BoostPageViewMode,
    BoostPageViewModeType,
} from '../EarnedAndManagedTabs/EarnedAndManagedTabs';

import useTheme from '../../theme/hooks/useTheme';

type NewBoostButtonProps = {
    credentialType: CredentialCategoryEnum;
    onClick: () => void;
    viewMode?: BoostPageViewModeType;
};

const NewBoostButton: React.FC<NewBoostButtonProps> = ({
    credentialType,
    onClick,
    viewMode = BoostPageViewMode.Card,
}) => {
    const { theme, getThemedCategoryColors } = useTheme();

    let { backgroundPrimaryColor, primaryColor, secondaryColor, headerTextColor } =
        getThemedCategoryColors(credentialType);
    let typeName: string = credentialType;

    const isId = credentialType === CredentialCategoryEnum.id;

    switch (credentialType) {
        case CredentialCategoryEnum.learningHistory:
            typeName = 'Study';
            break;
        case CredentialCategoryEnum.workHistory:
            typeName = 'Experience';
            break;
        case CredentialCategoryEnum.accommodation:
            typeName = 'Assistance';
            break;
        case CredentialCategoryEnum.accomplishment:
            typeName = 'Portfolio';
            break;
        case CredentialCategoryEnum.socialBadge:
            typeName = 'Boost';
            break;
    }

    if (viewMode === BoostPageViewMode.Card) {
        return (
            <IonCol
                size="6"
                size-sm={4}
                size-md={4}
                size-lg={4}
                className="flex justify-center items-center relative z-10 pt-[20px]"
            >
                <button
                    onClick={onClick}
                    className={`h-full pt-[15px] bg-opacity-30 rounded-[20px] flex flex-col items-center justify-center gap-[10px] w-[160px] min-h-[280px] ${backgroundPrimaryColor}`}
                >
                    <div className={`bg-white rounded-full p-[8px] w-fit h-fit shadow-soft-bottom`}>
                        <Plus className={`h-[20px] w-[20px]`} />
                    </div>
                    <div
                        className={`flex flex-col text-[17px] ${headerTextColor} font-notoSans font-[700] leading-[normal]`}
                    >
                        <span>New</span>
                        <span>{typeName}</span>
                    </div>
                </button>
            </IonCol>
        );
    }

    return (
        <IonRow
            className={`rounded-[15px] flex gap-[10px] items-center w-full z-[2] ${backgroundPrimaryColor} bg-opacity-30 ${
                isId ? 'px-[8px] py-[17px]' : 'p-[8px]'
            }`}
            onClick={onClick}
            role="button"
        >
            <div className={`bg-white rounded-full p-[10px] w-fit h-fit shadow-soft-bottom`}>
                <Plus className={`h-[20px] w-[20px]`} />
            </div>
            <span className={`text-[17px] ${headerTextColor}`}>New {typeName}</span>
        </IonRow>
    );
};

export default NewBoostButton;
