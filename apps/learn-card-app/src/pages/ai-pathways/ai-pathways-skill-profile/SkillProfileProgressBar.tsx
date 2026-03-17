import React from 'react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { SetState } from '@learncard/helpers';
import { useVerifiableData } from 'learn-card-base';

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

type SkillProfileProgressBarProps = { currentStep: number; setCurrentStep: SetState<number> };

const SkillProfileProgressBar: React.FC<SkillProfileProgressBarProps> = ({
    currentStep,
    setCurrentStep,
}) => {
    // Step 1: Goals + Profile (both must exist AND have non-empty data)
    const { data: goalsData } = useVerifiableData<SkillProfileGoalsData>(SKILL_PROFILE_GOALS_KEY);
    const { data: profileData } =
        useVerifiableData<SkillProfileProfileData>(SKILL_PROFILE_PROFILE_KEY);
    const goalsComplete = Boolean(goalsData?.goals?.length);
    const profileComplete = Boolean(profileData?.professionalTitle);
    const step1Complete = goalsComplete && profileComplete;

    // Step 2: Work History (selected URIs exist)
    const { data: workHistoryData } = useVerifiableData<SkillProfileWorkHistoryData>(
        SKILL_PROFILE_WORK_HISTORY_KEY
    );
    const step2Complete = Boolean(workHistoryData?.selectedCredentialUris?.length);

    // Step 3: Salary (amount must be non-empty)
    const { data: salaryData } =
        useVerifiableData<SkillProfileSalaryData>(SKILL_PROFILE_SALARY_KEY);
    const step3Complete = Boolean(salaryData?.salary);

    // Step 4: Job Satisfaction (at least one rating selected)
    const { data: jobSatisfactionData } = useVerifiableData<SkillProfileJobSatisfactionData>(
        SKILL_PROFILE_JOB_SATISFACTION_KEY
    );
    const step4Complete = Boolean(
        jobSatisfactionData?.workLifeBalance || jobSatisfactionData?.jobStability
    );

    const bars: { step: number; isCompleted: boolean }[] = [
        { step: 1, isCompleted: step1Complete },
        { step: 2, isCompleted: step2Complete },
        { step: 3, isCompleted: step3Complete },
        { step: 4, isCompleted: step4Complete },
        { step: 5, isCompleted: false },
    ];

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
