import React, { useState } from 'react';

import { useIonModal } from '@ionic/react';
import CaretDown from '../../../svgs/CaretDown';
import FamilyCMSMemberTitlesOptionsList from './FamilyCMSMemberTitlesOptionsList';

import { FamilyCMSState, MemberTitleTypes } from '../../familyCMSState';
import { FamilyTitleModesEnum, familyTitleOptions, TitleOption } from './familyTitles.helpers';
import { ModalTypes, useModal } from 'learn-card-base';

export type FamilyMemberTitles = {
    singular: string;
    plural: string;
};

export const FamilyCMSMemberTitlesToggle: React.FC<{
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
}> = ({ state, setState }) => {
    const { newModal, closeModal } = useModal();
    const [memberTitles, setMemberTitles] = useState<{
        guardians: MemberTitleTypes;
        dependents: MemberTitleTypes;
    }>(
        state?.basicInfo?.memberTitles ?? {
            guardians: {
                singular: 'Guardian',
                plural: 'Guardians',
            },
            dependents: { singular: 'Child', plural: 'Children' },
        }
    );

    const handleSetState = (topLevelKey: string, titleOption: TitleOption) => {
        setState(prevState => {
            return {
                ...prevState,
                basicInfo: {
                    ...prevState?.basicInfo,
                    memberTitles: {
                        ...prevState?.basicInfo?.memberTitles,
                        [topLevelKey]: {
                            ...prevState?.basicInfo?.memberTitles?.[topLevelKey],
                            ...titleOption,
                        },
                    },
                },
            };
        });

        setMemberTitles(prevState => {
            return {
                ...prevState,
                [topLevelKey]: {
                    ...prevState?.[topLevelKey],
                    ...titleOption,
                },
            };
        });
    };

    const presentGuardianTitlesModal = () => {
        newModal(
            <FamilyCMSMemberTitlesOptionsList
                handleCloseModal={() => closeModal()}
                state={state}
                setState={setState}
                handleSetState={handleSetState}
                familyTitleMode={FamilyTitleModesEnum.guardians}
                titleOptions={familyTitleOptions.guardians}
            />,
            {},
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    const presentDependentTitlesModal = () => {
        newModal(
            <FamilyCMSMemberTitlesOptionsList
                handleCloseModal={() => closeModal()}
                state={state}
                setState={setState}
                handleSetState={handleSetState}
                familyTitleMode={FamilyTitleModesEnum.dependents}
                titleOptions={familyTitleOptions.dependents}
            />,
            {},
            { mobile: ModalTypes.Cancel, desktop: ModalTypes.Cancel }
        );
    };

    const guardianTitles = memberTitles?.guardians;
    const dependentTitles = memberTitles?.dependents;

    return (
        <section className="bg-white ion-padding rounded-[20px] shadow-soft-bottom mt-[20px]">
            <div className="w-full flex items-start justify-center flex-col mb-4">
                <h2 className="font-poppins text-[22px] font-normal text-grayscale-800">
                    Member Titles
                </h2>
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[17px] mb-2">
                    Admins
                </h3>
                <button
                    onClick={() => presentGuardianTitlesModal()}
                    className={`flex items-center justify-between bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full`}
                >
                    <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900">
                        {guardianTitles.plural}
                    </p>
                    <CaretDown />
                </button>
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[17px] mb-2">
                    Kids
                </h3>
                <button
                    onClick={() => presentDependentTitlesModal()}
                    className={`flex items-center justify-between bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full`}
                >
                    <p className="m-0 p-0 text-lg font-notoSans text-grayscale-900">
                        {dependentTitles?.plural}
                    </p>
                    <CaretDown />
                </button>
            </div>
        </section>
    );
};

export default FamilyCMSMemberTitlesToggle;
