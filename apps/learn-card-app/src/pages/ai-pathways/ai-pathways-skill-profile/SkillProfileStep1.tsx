import React, { useState, useEffect } from 'react';
import X from 'src/components/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import { TextInput, SelectInput, useVerifiableData } from 'learn-card-base';

export type SkillProfileGoalsData = {
    goals: string[];
};

export type SkillProfileProfileData = {
    professionalTitle: string;
    lifetimeExperience: {
        years: number | null;
        months: number | null;
    };
};

export const SKILL_PROFILE_GOALS_KEY = 'skill-profile-goals';
export const SKILL_PROFILE_PROFILE_KEY = 'skill-profile-profile';

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
    } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY);

    const {
        data: profileData,
        isLoading: profileLoading,
        saveIfChanged: saveProfile,
        isSaving: profileSaving,
    } = useVerifiableData<SkillProfileProfileData>(SKILL_PROFILE_PROFILE_KEY);

    const isLoading = goalsLoading || profileLoading;
    const isSaving = goalsSaving || profileSaving;

    // Pre-populate form from existing verifiable data
    useEffect(() => {
        if (goalsData) {
            setGoals(goalsData.goals ?? []);
        }
    }, [goalsData]);

    useEffect(() => {
        if (profileData) {
            setProfessionalTitle(profileData.professionalTitle ?? '');
            setYears(profileData.lifetimeExperience?.years ?? null);
            setMonths(profileData.lifetimeExperience?.months ?? null);
        }
    }, [profileData]);

    const handleAddGoal = () => {
        if (goalInput.trim()) {
            setGoals([...goals, goalInput.trim().slice(0, 35)]);
            setGoalInput('');
        }
    };

    const handleRemoveGoal = (index: number) => {
        setGoals(goals.filter((_, i) => i !== index));
    };

    const handleSaveAndNext = async () => {
        await Promise.all([
            saveGoals({ goals }),
            saveProfile({
                professionalTitle,
                lifetimeExperience: { years, months },
            }),
        ]);
        handleNext();
    };

    return (
        <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    Grow your skills and explore opportunities
                </h3>
                <p className="text-[16px] text-grayscale-700 font-poppins leading-[130%]">
                    Your profile is used to create personalized opportunities.{' '}
                    <strong className="font-bold">All your answers are confidential.</strong>
                </p>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    Goals
                </span>

                <TextInput
                    value={goalInput}
                    onChange={value => setGoalInput(value ?? '')}
                    placeholder="I want to..."
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
                    Professional title
                </span>

                <TextInput
                    value={professionalTitle}
                    onChange={value => setProfessionalTitle(value ?? '')}
                    placeholder="Professional title..."
                />
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    Lifetime experience in this role
                </span>

                <div className="flex gap-[10px]">
                    <SelectInput
                        value={years}
                        onChange={value => setYears(value as number | null)}
                        options={YEARS_OPTIONS}
                        placeholder="years"
                        allowDeselect
                        className="flex-1"
                    />
                    <SelectInput
                        value={months}
                        onChange={value => setMonths(value as number | null)}
                        options={MONTHS_OPTIONS}
                        placeholder="months"
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
                {isSaving ? 'Saving...' : 'Next'}
            </button>
        </div>
    );
};

export default SkillProfileStep1;
