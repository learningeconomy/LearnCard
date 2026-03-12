import React from 'react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import { SetState } from '@learncard/helpers';

type SkillProfileProgressBarProps = { currentStep: number; setCurrentStep: SetState<number> };

const SkillProfileProgressBar: React.FC<SkillProfileProgressBarProps> = ({
    currentStep,
    setCurrentStep,
}) => {
    const bars: { step: number; isCompleted: boolean }[] = [
        { step: 1, isCompleted: false },
        { step: 2, isCompleted: true },
        { step: 3, isCompleted: false },
        { step: 4, isCompleted: false },
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
