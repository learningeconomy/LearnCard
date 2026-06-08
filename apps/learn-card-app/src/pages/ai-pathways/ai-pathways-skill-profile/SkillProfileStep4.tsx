import React, { useState, useEffect, useRef } from 'react';

import { m } from '../../../paraglide/messages.js';

import { RadioGroup, useVerifiableData } from 'learn-card-base';
import { useTrackProfileDataAdded } from './useTrackProfileDataAdded';
import { useSkillProfileStepFunnel } from './useSkillProfileStepFunnel';

export type SkillProfileJobSatisfactionData = {
    workLifeBalance: string | null;
    jobStability: string | null;
};

export const SKILL_PROFILE_JOB_SATISFACTION_KEY = 'skill-profile-job-satisfaction';

type SkillProfileStep4Props = {
    handleNext: () => void;
    handleBack: () => void;
};

const getWorkLifeBalanceOptions = () => [
    { value: 'terrible', label: m['aiPathways.workLife.terrible']() },
    { value: 'not_adequate', label: m['aiPathways.workLife.notAdequate']() },
    { value: 'average', label: m['aiPathways.workLife.average']() },
    { value: 'good_enough', label: m['aiPathways.workLife.goodEnough']() },
    { value: 'satisfied', label: m['aiPathways.workLife.satisfied']() },
    { value: 'paradise', label: m['aiPathways.workLife.paradise']() },
];

const getJobStabilityOptions = () => [
    { value: 'very_uncertain', label: m['aiPathways.jobStability.veryUncertain']() },
    { value: 'poor', label: m['aiPathways.jobStability.poor']() },
    { value: 'average', label: m['aiPathways.jobStability.average']() },
    { value: 'okay', label: m['aiPathways.jobStability.okay']() },
    { value: 'great', label: m['aiPathways.jobStability.great']() },
    { value: 'confident', label: m['aiPathways.jobStability.confident']() },
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

    const { data, isLoading, saveIfChanged, isSaving } =
        useVerifiableData<SkillProfileJobSatisfactionData>(SKILL_PROFILE_JOB_SATISFACTION_KEY, {
            name: 'Job Satisfaction',
            description: 'Work-life balance and job stability preferences',
        });

    // Pre-populate form from existing verifiable data
    useEffect(() => {
        if (data) {
            setWorkLifeBalance(data.workLifeBalance ?? null);
            setJobStability(data.jobStability ?? null);
        }
    }, [data]);

    const handleSaveAndNext = async () => {
        await saveIfChanged({
            workLifeBalance,
            jobStability,
        });
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
                options={getWorkLifeBalanceOptions()}
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
                options={getJobStabilityOptions()}
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
