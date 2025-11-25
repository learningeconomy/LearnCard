import React from 'react';

import { IonPage } from '@ionic/react';
import ModalLayout from 'learn-card-base/components/modals/ionic-modals/CancelModalLayout';
import Checkmark from '../../../svgs/Checkmark';

import { FamilyCMSState } from '../../familyCMSState';
import { FamilyTitleModesEnum, TitleOption } from './familyTitles.helpers';

type FamilyCMSMemberTitlesOptionsList = {
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    titleOptions: {
        id?: number;
        plural: string;
        singular: string;
    }[];
    handleSetState: (topLevelKey: string, titleOption: TitleOption) => void;
    familyTitleMode: FamilyTitleModesEnum;
    handleCloseModal: () => void;
};

const FamilyCMSMemberTitlesOptionsList: React.FC<FamilyCMSMemberTitlesOptionsList> = ({
    state,
    setState,
    titleOptions,
    handleSetState,
    familyTitleMode,
    handleCloseModal,
}) => {
    return (
        <div className="px-[10px] py-4 flex flex-col items-center">
            {titleOptions?.map(option => {
                const isActive =
                    option?.plural === state?.basicInfo?.memberTitles?.[familyTitleMode]?.plural;

                return (
                    <button
                        key={option.id}
                        onClick={() => {
                            handleSetState(familyTitleMode, {
                                singular: option?.singular,
                                plural: option?.plural,
                            });
                            handleCloseModal();
                        }}
                        className="w-full flex items-center justify-between last-of-type:border-none border-b-[1px] border-solid border-grayscale-100 ion-padding first-of-type:pt-[4px]"
                    >
                        <div className="flex items-center justify-center">
                            <div className="flex flex-col items-cennter justify-center">
                                <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900">
                                    {option?.plural}
                                </p>
                            </div>
                        </div>

                        {isActive ? (
                            <span className="flex items-center justify-center bg-emerald-700 rounded-full shadow-3xl min-w-[40px] min-h-[40px]">
                                <Checkmark className="w-7 h-auto text-white" />
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
};

export default FamilyCMSMemberTitlesOptionsList;
