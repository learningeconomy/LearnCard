import React from 'react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { SetState } from '@learncard/helpers';
import {
    useVerifiableData,
    useGetSelfAssignedSkillsBoost,
    useGetBoostSkills,
} from 'learn-card-base';

import {
    SkillProfileGoalsData,
    SkillProfileProfileData,
    SKILL_PROFILE_GOALS_KEY,
    SKILL_PROFILE_PROFILE_KEY,
} from './SkillProfileStep1';
import { SkillProfileWorkHistoryData, SKILL_PROFILE_WORK_HISTORY_KEY } from './SkillProfileStep2';
import { SkillProfileSalaryData, SKILL_PROFILE_SALARY_KEY } from './SkillProfileStep3';
import {
    SkillProfileJobSatisfactionData,
    SKILL_PROFILE_JOB_SATISFACTION_KEY,
} from './SkillProfileStep4';

const TOTAL_METRICS = 8;

type SkillProfileProgressBarProps = {
    currentStep: number;
    setCurrentStep: SetState<number>;
    isExpanded?: boolean;
};

export const useSkillProfileCompletion = () => {
    // Step 1: Goals + Profile
    const { data: goalsData } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY);
    const { data: profileData } =
        useVerifiableData<SkillProfileProfileData>(SKILL_PROFILE_PROFILE_KEY);

    // Step 2: Work History
    const { data: workHistoryData } = useVerifiableData<SkillProfileWorkHistoryData>(
        SKILL_PROFILE_WORK_HISTORY_KEY
    );

    // Step 3: Salary
    const { data: salaryData } =
        useVerifiableData<SkillProfileSalaryData>(SKILL_PROFILE_SALARY_KEY);

    // Step 4: Job Satisfaction
    const { data: jobSatisfactionData } = useVerifiableData<SkillProfileJobSatisfactionData>(
        SKILL_PROFILE_JOB_SATISFACTION_KEY
    );

    // Step 5: Self-assigned skills
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    // Individual metric completions (8 total)
    const hasGoals = Boolean(goalsData?.goals?.length);
    const hasTitle = Boolean(profileData?.professionalTitle);
    const hasExperience = Boolean(
        profileData?.lifetimeExperience?.years || profileData?.lifetimeExperience?.months
    );
    const hasWorkHistory = Boolean(workHistoryData?.selectedCredentialUris?.length);
    const hasSalary = Boolean(salaryData?.salary);
    const hasWorkLifeBalance = Boolean(jobSatisfactionData?.workLifeBalance);
    const hasJobStability = Boolean(jobSatisfactionData?.jobStability);
    const hasSelfAssignedSkills = Boolean(sasBoostSkills?.length);

    // Count completed metrics
    const completedCount = [
        hasGoals,
        hasTitle,
        hasExperience,
        hasWorkHistory,
        hasSalary,
        hasWorkLifeBalance,
        hasJobStability,
        hasSelfAssignedSkills,
    ].filter(Boolean).length;

    const percentage = Math.round((completedCount / TOTAL_METRICS) * 100);

    // Step completion for expanded view
    const step1Complete = hasGoals && hasTitle && hasExperience;
    const step2Complete = hasWorkHistory;
    const step3Complete = hasSalary;
    const step4Complete = hasWorkLifeBalance && hasJobStability;
    const step5Complete = hasSelfAssignedSkills;

    return {
        percentage,
        completedCount,
        totalMetrics: TOTAL_METRICS,
        stepCompletion: [step1Complete, step2Complete, step3Complete, step4Complete, step5Complete],
    };
};

const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-cyan-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
};

const SkillProfileProgressBar: React.FC<SkillProfileProgressBarProps> = ({
    currentStep,
    setCurrentStep,
    isExpanded = true,
}) => {
    const { percentage, stepCompletion } = useSkillProfileCompletion();

    const bars: { step: number; isCompleted: boolean }[] = [
        { step: 1, isCompleted: stepCompletion[0] },
        { step: 2, isCompleted: stepCompletion[1] },
        { step: 3, isCompleted: stepCompletion[2] },
        { step: 4, isCompleted: stepCompletion[3] },
        { step: 5, isCompleted: stepCompletion[4] },
    ];

    // Collapsed view: single bar with percentage fill
    if (!isExpanded) {
        const colorClass = getProgressBarColor(percentage);
        return (
            <div className="relative w-full h-[8px] bg-grayscale-200 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClass} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    }

    // Expanded view: 5 bars with checkmarks
    return (
        <div className="relative w-full h-[20px]">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center gap-[2px] rounded-full overflow-hidden w-full h-[8px]">
                {bars.map(bar => (
                    <button
                        key={bar.step}
                        className={`flex-1 h-full ${
                            currentStep === bar.step ? 'bg-emerald-500' : 'bg-grayscale-200'
                        }`}
                        onClick={() => setCurrentStep(bar.step)}
                    />
                ))}
            </div>

            <div className="absolute inset-0 flex items-center gap-[2px] w-full pointer-events-none">
                {bars.map(bar => (
                    <div key={bar.step} className="flex-1 flex items-center justify-center">
                        {bar.isCompleted && (
                            <div
                                className={`items-center justify-center w-[20px] h-[20px] rounded-full p-[3px] ${
                                    bar.step === currentStep
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-grayscale-200 text-grayscale-500'
                                }`}
                            >
                                <Checkmark strokeWidth="3" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillProfileProgressBar;
