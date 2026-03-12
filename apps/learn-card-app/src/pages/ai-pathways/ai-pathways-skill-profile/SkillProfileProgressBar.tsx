import React from 'react';
import { SetState } from '@learncard/helpers';

type SkillProfileProgressBarProps = { currentStep: number; setCurrentStep: SetState<number> };

const SkillProfileProgressBar: React.FC<SkillProfileProgressBarProps> = ({
    currentStep,
    setCurrentStep,
}) => {
    const bars: { step: number; isCompleted: boolean }[] = [
        { step: 1, isCompleted: false },
        { step: 2, isCompleted: false },
        { step: 3, isCompleted: false },
        { step: 4, isCompleted: false },
        { step: 5, isCompleted: false },
    ];

    return (
        <div className="flex items-center gap-[2px] rounded-full overflow-hidden w-full">
            {bars.map(bar => (
                <button
                    key={bar.step}
                    className={`flex-1 h-[8px] ${
                        currentStep === bar.step ? 'bg-emerald-500' : 'bg-grayscale-200'
                    }`}
                    onClick={() => setCurrentStep(bar.step)}
                />
            ))}
        </div>
    );
};

export default SkillProfileProgressBar;
