import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import * as m from '../../../paraglide/messages.js';
import { TransP } from '../../../i18n/TransP';

import X from 'src/components/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import {
    CredentialCategoryEnum,
    TextInput,
    SelectInput,
    useSyncAllCredentialsToContractsMutation,
    useWallet,
    queueAiInsightCredentialRefresh,
    useVerifiableData,
    getLogger,
} from 'learn-card-base';
import { useTrackProfileDataAdded } from './useTrackProfileDataAdded';
import { useSkillProfileStepFunnel } from './useSkillProfileStepFunnel';

export type SkillProfileGoalsData = {
    goals: string[];
};

export type SkillProfileProfessionalTitleData = {
    professionalTitle: string;
};

export type SkillProfileRoleExperienceData = {
    lifetimeExperience: {
        years: number | null;
        months: number | null;
    };
};

export type SkillProfileProfileData = SkillProfileProfessionalTitleData;

export const SKILL_PROFILE_GOALS_KEY = 'skill-profile-goals';
export const SKILL_PROFILE_PROFESSIONAL_TITLE_KEY = 'skill-profile-professional-title';
export const SKILL_PROFILE_ROLE_EXPERIENCE_KEY = 'skill-profile-role-experience';
export const SKILL_PROFILE_PROFILE_KEY = SKILL_PROFILE_PROFESSIONAL_TITLE_KEY;

const log = getLogger('ai-pathways-skill-profile.step1');

type SkillProfileStep1Props = {
    handleNext: () => void;
};

const YEARS_OPTIONS = [
    { value: 0, displayText: '0 years' },
    { value: 1, displayText: '1 year' },
    { value: 2, displayText: '2 years' },
    { value: 3, displayText: '3 years' },
    { value: 4, displayText: '4 years' },
    { value: 5, displayText: '5 years' },
    { value: 6, displayText: '6 years' },
    { value: 7, displayText: '7 years' },
    { value: 8, displayText: '8 years' },
    { value: 9, displayText: '9 years' },
    { value: 10, displayText: '10+ years' },
];

const MONTHS_OPTIONS = [
    { value: 0, displayText: '0 months' },
    { value: 1, displayText: '1 month' },
    { value: 2, displayText: '2 months' },
    { value: 3, displayText: '3 months' },
    { value: 4, displayText: '4 months' },
    { value: 5, displayText: '5 months' },
    { value: 6, displayText: '6 months' },
    { value: 7, displayText: '7 months' },
    { value: 8, displayText: '8 months' },
    { value: 9, displayText: '9 months' },
    { value: 10, displayText: '10 months' },
    { value: 11, displayText: '11 months' },
];

const SkillProfileStep1: React.FC<SkillProfileStep1Props> = ({ handleNext }) => {
    const { trackProfileDataAdded } = useTrackProfileDataAdded();
    const syncAllCredentialsToContracts = useSyncAllCredentialsToContractsMutation();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { markStepCompleted } = useSkillProfileStepFunnel(1, () => {
        const fields: string[] = [];
        if (goals.length > 0) fields.push('goals');
        if (professionalTitle) fields.push('professionalTitle');
        if (years !== null || months !== null) fields.push('lifetimeExperience');
        return fields;
    });
    const [goalInput, setGoalInput] = useState('');
    const [goals, setGoals] = useState<string[]>([]);
    const [professionalTitle, setProfessionalTitle] = useState('');
    const [years, setYears] = useState<number | null>(null);
    const [months, setMonths] = useState<number | null>(null);

    const {
        data: goalsData,
        isLoading: goalsLoading,
        saveIfChanged: saveGoals,
        isSaving: goalsSaving,
    } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY, {
        name: 'Career Goals',
        description: 'Self-reported career goals and aspirations',
        category: CredentialCategoryEnum.goals,
    });

    const {
        data: professionalTitleData,
        isLoading: professionalTitleLoading,
        saveIfChanged: saveProfessionalTitle,
        isSaving: professionalTitleSaving,
    } = useVerifiableData<SkillProfileProfessionalTitleData>(SKILL_PROFILE_PROFESSIONAL_TITLE_KEY, {
        name: 'Professional Title',
        description: 'Your current professional title',
        category: CredentialCategoryEnum.professionalTitle,
    });

    const {
        data: roleExperienceData,
        isLoading: roleExperienceLoading,
        saveIfChanged: saveRoleExperience,
        isSaving: roleExperienceSaving,
    } = useVerifiableData<SkillProfileRoleExperienceData>(SKILL_PROFILE_ROLE_EXPERIENCE_KEY, {
        name: 'Role Experience',
        description: 'Years and months of experience in your current role',
        category: CredentialCategoryEnum.roleExperience,
    });

    const isLoading = goalsLoading || professionalTitleLoading || roleExperienceLoading;
    const isSaving = goalsSaving || professionalTitleSaving || roleExperienceSaving;

    // Pre-populate form from existing verifiable data
    useEffect(() => {
        if (goalsData) {
            setGoals(goalsData.goals ?? []);
        }
    }, [goalsData]);

    useEffect(() => {
        if (professionalTitleData) {
            setProfessionalTitle(professionalTitleData.professionalTitle ?? '');
        }
    }, [professionalTitleData]);

    useEffect(() => {
        if (roleExperienceData) {
            setYears(roleExperienceData.lifetimeExperience?.years ?? null);
            setMonths(roleExperienceData.lifetimeExperience?.months ?? null);
        }
    }, [roleExperienceData]);

    const commitGoalInput = () => {
        const nextGoal = goalInput.trim();

        if (!nextGoal) {
            return goals;
        }

        const updatedGoals = [...goals, nextGoal.slice(0, 35)];

        setGoals(updatedGoals);
        setGoalInput('');

        return updatedGoals;
    };

    const handleAddGoal = () => {
        commitGoalInput();
    };

    const handleRemoveGoal = (index: number) => {
        setGoals(goals.filter((_, i) => i !== index));
    };

    const handleSaveAndNext = async () => {
        const goalsToSave = commitGoalInput();

        const saveResults = await Promise.all([
            saveGoals({ goals: goalsToSave }),
            saveProfessionalTitle({ professionalTitle }),
            saveRoleExperience({ lifetimeExperience: { years, months } }),
        ]);

        if (saveResults.some(Boolean)) {
            void (async () => {
                await syncAllCredentialsToContracts.mutateAsync();

                try {
                    const wallet = await initWallet();
                    await queueAiInsightCredentialRefresh({
                        wallet,
                        queryClient,
                    });
                } catch (error) {
                    log.warn(
                        'Failed to refresh AI insights after saving skill profile data:',
                        error
                    );
                }
            })();
        }

        trackProfileDataAdded();
        markStepCompleted();
        handleNext();
    };

    return (
        <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    {m['skillProfile.step1.title']()}
                </h3>
                <p className="text-[16px] text-grayscale-700 font-poppins leading-[130%]">
                    <TransP
                        m={m['skillProfile.step1.subtitle']}
                        components={[<strong className="font-bold" />]}
                    />
                </p>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    {m['skillProfile.step1.goals']()}
                </span>

                <TextInput
                    value={goalInput}
                    onChange={value => setGoalInput(value ?? '')}
                    placeholder={m['aiPathways.iWantTo']()}
                    maxLength={35}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddGoal();
                        }
                    }}
                    endButton={
                        <button
                            type="button"
                            onClick={handleAddGoal}
                            className="text-grayscale-600 hover:text-grayscale-700 rounded-[7px] p-[6px] bg-grayscale-200"
                        >
                            <Plus className="w-[24px] h-[24px]" />
                        </button>
                    }
                />

                {goals.length > 0 && (
                    <div className="flex flex-wrap gap-[5px]">
                        {goals.map((goal, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-[8px] border-solid border-[2px] border-sky-600 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]"
                            >
                                {goal}
                                <button type="button" onClick={() => handleRemoveGoal(index)}>
                                    <X className="w-[15px] h-[15px]" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    {m['skillProfile.step1.professionalTitle']()}
                </span>

                <TextInput
                    value={professionalTitle}
                    onChange={value => setProfessionalTitle(value ?? '')}
                    placeholder={m['aiPathways.professionalTitle']()}
                />
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    {m['skillProfile.step1.lifetimeExperience']()}
                </span>

                <div className="flex gap-[10px]">
                    <SelectInput
                        value={years}
                        onChange={value => setYears(value as number | null)}
                        options={YEARS_OPTIONS}
                        placeholder={m['skillProfile.step1.years']()}
                        allowDeselect
                        className="flex-1"
                    />
                    <SelectInput
                        value={months}
                        onChange={value => setMonths(value as number | null)}
                        options={MONTHS_OPTIONS}
                        placeholder={m['skillProfile.step1.months']()}
                        allowDeselect
                        className="flex-1"
                    />
                </div>
            </div>

            <button
                className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] h-[44px] disabled:opacity-50"
                onClick={handleSaveAndNext}
                disabled={isSaving || isLoading}
            >
                {isSaving ? m['boost.saving']() : m['common.next']()}
            </button>
        </div>
    );
};

export default SkillProfileStep1;
