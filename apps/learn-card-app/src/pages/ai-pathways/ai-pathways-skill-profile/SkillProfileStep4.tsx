import React, { useState, useEffect, useRef } from 'react';
import { m } from '../../../paraglide/messages.js';

import { CredentialCategoryEnum, RadioGroup, useVerifiableData } from 'learn-card-base';
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

    const {
        data: workLifeBalanceData,
        isLoading: workLifeBalanceLoading,
        saveIfChanged: saveWorkLifeBalance,
        isSaving: workLifeBalanceSaving,
    } = useVerifiableData<SkillProfileWorkLifeBalanceData>(SKILL_PROFILE_WORK_LIFE_BALANCE_KEY, {
        name: 'Work Life Balance',
        description: 'Your preferred work-life balance',
        category: CredentialCategoryEnum.workLifeBalance,
    });

    const {
        data: jobStabilityData,
        isLoading: jobStabilityLoading,
        saveIfChanged: saveJobStability,
        isSaving: jobStabilitySaving,
    } = useVerifiableData<SkillProfileJobStabilityData>(SKILL_PROFILE_JOB_STABILITY_KEY, {
        name: 'Job Stability',
        description: 'How stable you want your work to feel',
        category: CredentialCategoryEnum.jobStability,
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
                {m['aiPathways.workLifeBalance']()}
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
                {m['aiPathways.jobStability']()}
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
                    {m['common.back']()}
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
