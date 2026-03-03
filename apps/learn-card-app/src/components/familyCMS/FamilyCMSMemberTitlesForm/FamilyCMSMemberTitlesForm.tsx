import { IonInput } from '@ionic/react';
import React, { useState } from 'react';
import { FamilyCMSState, MemberTitleTypes } from '../familyCMSState';

export type FamilyMemberTitles = {
    singular: string;
    plural: string;
};

export const FamilyCMSMemberTitlesForm: React.FC<{
    state: FamilyCMSState;
    setState: React.Dispatch<React.SetStateAction<FamilyCMSState>>;
    errors: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    setErrors?: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}> = ({ state, setState, errors, setErrors }) => {
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

    const handleSetState = (topLevelKey: string, key: string, value: string) => {
        setState(prevState => {
            return {
                ...prevState,
                basicInfo: {
                    ...prevState?.basicInfo,
                    memberTitles: {
                        ...prevState?.basicInfo?.memberTitles,
                        [topLevelKey]: {
                            ...prevState?.basicInfo?.memberTitles?.[topLevelKey],
                            [key]: value,
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
                    [key]: value,
                },
            };
        });

        setErrors?.({});
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

            <div className="w-full flex items-start justify-center flex-col">
                <h2 className="font-poppins text-xl font-normal text-grayscale-800 mb-2">
                    Connected Users Titles
                </h2>
                <p className="text-grayscale-600 font-normal text-sm text-left">
                    Connected users are primary Learncard accounts that exist independent of
                    families.{' '}
                </p>
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Singular
                </h3>

                <IonInput
                    value={guardianTitles.singular}
                    onIonInput={e => handleSetState('guardians', 'singular', e.detail.value)}
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                        errors?.guardians?.singular ? 'border-red-300 border-2' : ''
                    }`}
                    placeholder="Singular"
                    clearInput
                    type="text"
                />

                {errors?.guardians?.singular && (
                    <p className="text-red-400 font-medium text-sm pl-1 mt-1">
                        {errors?.guardians?.singular}
                    </p>
                )}
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Plural
                </h3>

                <IonInput
                    value={guardianTitles.plural}
                    onIonInput={e => handleSetState('guardians', 'plural', e.detail.value)}
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                        errors?.guardians?.plural ? 'border-red-300 border-2' : ''
                    }`}
                    placeholder="Plural"
                    clearInput
                    type="text"
                />

                {errors?.guardians?.plural && (
                    <p className="text-red-400 font-medium text-sm pl-1 mt-1">
                        {errors?.guardians?.plural}
                    </p>
                )}
            </div>

            <div className="w-full flex items-start justify-center flex-col mt-6">
                <h2 className="font-poppins text-xl font-normal text-grayscale-800 mb-2">
                    Dependents Titles
                </h2>
                <p className="text-grayscale-600 font-normal text-sm text-left">
                    Dependent accounts exist only in the family that they are created in. They have
                    no personal login and limited permissions in LearnCard.
                </p>
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Singular
                </h3>

                <IonInput
                    value={dependentTitles.singular}
                    onIonInput={e => handleSetState('dependents', 'singular', e.detail.value)}
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                        errors?.dependents?.singular ? 'border-red-300 border-2' : ''
                    }`}
                    placeholder="Singular"
                    clearInput
                    type="text"
                />

                {errors?.dependents?.singular && (
                    <p className="text-red-400 font-medium text-sm pl-1 mt-1">
                        {errors?.dependents?.singular}
                    </p>
                )}
            </div>

            <div className="w-full mb-2 mt-4">
                <h3 className="text-grayscale-900 text-left w-full font-poppins text-[20px] mb-2">
                    Plural
                </h3>

                <IonInput
                    value={dependentTitles.plural}
                    onIonInput={e => handleSetState('dependents', 'plural', e.detail.value)}
                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-normal font-poppins text-[17px] w-full troops-cms-placeholder ${
                        errors?.dependents?.plural ? 'border-red-300 border-2' : ''
                    }`}
                    placeholder="Plural"
                    clearInput
                    type="text"
                />

                {errors?.dependents?.plural && (
                    <p className="text-red-400 font-medium text-sm pl-1 mt-1">
                        {errors?.dependents?.plural}
                    </p>
                )}
            </div>
        </section>
    );
};

export default FamilyCMSMemberTitlesForm;
