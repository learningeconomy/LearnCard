import React, { useState, useEffect, useRef } from 'react';
import { RadioGroup, useVerifiableData } from 'learn-card-base';
import { useTrackProfileDataAdded } from './useTrackProfileDataAdded';
import { useSkillProfileStepFunnel } from './useSkillProfileStepFunnel';

export type SkillProfileJobSatisfactionData = {
    workLifeBalance: string | null;
    jobStability: string | null;
};

export type SkillProfileWorkLifeBalanceData = {
    workLifeBalance: string | null;
};

export type SkillProfileJobStabilityData = {
    jobStability: string | null;
};

export const SKILL_PROFILE_WORK_LIFE_BALANCE_KEY = 'skill-profile-work-life-balance';
export const SKILL_PROFILE_JOB_STABILITY_KEY = 'skill-profile-job-stability';
export const SKILL_PROFILE_JOB_SATISFACTION_KEY = 'skill-profile-job-satisfaction';

type SkillProfileStep4Props = {
    handleNext: () => void;
    handleBack: () => void;
};

const WORK_LIFE_BALANCE_OPTIONS = [
    { value: 'terrible', label: 'Terrible, Unfair' },
    { value: 'not_adequate', label: 'Not Adequate' },
    { value: 'average', label: 'Average' },
    { value: 'good_enough', label: 'Good Enough' },
    { value: 'satisfied', label: 'Satisfied & Happy' },
    { value: 'paradise', label: "It's Paradise" },
];

const JOB_STABILITY_OPTIONS = [
    { value: 'very_uncertain', label: 'Very Uncertain' },
    { value: 'poor', label: 'Poor' },
    { value: 'average', label: 'Average' },
    { value: 'okay', label: "It's Okay" },
    { value: 'great', label: 'Great' },
    { value: 'confident', label: 'Confident' },
];

const SkillProfileStep4: React.FC<SkillProfileStep4Props> = ({ handleNext, handleBack }) => {
    const { trackProfileDataAdded } = useTrackProfileDataAdded();
    const { markStepCompleted } = useSkillProfileStepFunnel(4, () => {
        const fields: string[] = [];
        if (workLifeBalance) fields.push('workLifeBalance');
        if (jobStability) fields.push('jobStability');
        return fields;
    });
    const [workLifeBalance, setWorkLifeBalance] = useState<string | null>(null);
    const [jobStability, setJobStability] = useState<string | null>(null);

    const {
        data: workLifeBalanceData,
        isLoading: workLifeBalanceLoading,
        saveIfChanged: saveWorkLifeBalance,
        isSaving: workLifeBalanceSaving,
    } = useVerifiableData<SkillProfileWorkLifeBalanceData>(SKILL_PROFILE_WORK_LIFE_BALANCE_KEY, {
        name: 'Work Life Balance',
        description: 'Your preferred work-life balance',
        category: 'Work Life Balance',
    });

    const {
        data: jobStabilityData,
        isLoading: jobStabilityLoading,
        saveIfChanged: saveJobStability,
        isSaving: jobStabilitySaving,
    } = useVerifiableData<SkillProfileJobStabilityData>(SKILL_PROFILE_JOB_STABILITY_KEY, {
        name: 'Job Stability',
        description: 'How stable you want your work to feel',
        category: 'Job Stability',
    });

    const isLoading = workLifeBalanceLoading || jobStabilityLoading;
    const isSaving = workLifeBalanceSaving || jobStabilitySaving;

    // Pre-populate form from existing verifiable data
    useEffect(() => {
        if (workLifeBalanceData) {
            setWorkLifeBalance(workLifeBalanceData.workLifeBalance ?? null);
        }
    }, [workLifeBalanceData]);

    useEffect(() => {
        if (jobStabilityData) {
            setJobStability(jobStabilityData.jobStability ?? null);
        }
    }, [jobStabilityData]);

    const handleSaveAndNext = async () => {
        await Promise.all([
            saveWorkLifeBalance({ workLifeBalance }),
            saveJobStability({ jobStability }),
        ]);
        trackProfileDataAdded();
        markStepCompleted();
        handleNext();
    };

    return (
        <div className="flex flex-col gap-[20px]">
            <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                How would you rate your work-life balance?
            </h3>

            <RadioGroup
                value={workLifeBalance}
                onChange={setWorkLifeBalance}
                options={WORK_LIFE_BALANCE_OPTIONS}
                name="work_life_balance"
                columns={2}
                allowDeselect
                className="pb-[30px] border-b-[1px] border-solid border-grayscale-200"
            />

            <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                And how would you rate your job stability?
            </h3>

            <RadioGroup
                value={jobStability}
                onChange={setJobStability}
                options={JOB_STABILITY_OPTIONS}
                name="job_stability"
                columns={2}
                allowDeselect
            />

            <div className="flex gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 text-grayscale-800 rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 border-[1px] border-solid border-grayscale-200 h-[44px]"
                    onClick={handleBack}
                    disabled={isSaving}
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px] disabled:opacity-50"
                    onClick={handleSaveAndNext}
                    disabled={isSaving || isLoading}
                >
                    {isSaving ? 'Saving...' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep4;
