import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
    currentStep: number;
    totalSteps: number;
    steps: { id: string; title: string }[];
    completedSteps: string[];
    onStepClick?: (index: number) => void;
}

export const StepProgress: React.FC<StepProgressProps> = ({
    currentStep,
    totalSteps,
    steps,
    completedSteps,
    onStepClick,
}) => {
    return (
        <div className="w-full">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                    Step {currentStep + 1} of {totalSteps}
                </span>

                <span className="text-sm text-gray-400">
                    {completedSteps.length} completed
                </span>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-1">
                {steps.map((step, index) => {
                    const isComplete = completedSteps.includes(step.id);
                    const isCurrent = index === currentStep;
                    const isPast = index < currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => onStepClick?.(index)}
                                disabled={!onStepClick}
                                className={`
                                    relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                                    ${isCurrent 
                                        ? 'bg-cyan-500 text-white ring-4 ring-cyan-100' 
                                        : isComplete 
                                            ? 'bg-emerald-500 text-white' 
                                            : isPast 
                                                ? 'bg-gray-300 text-gray-600'
                                                : 'bg-gray-100 text-gray-400'
                                    }
                                    ${onStepClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                                `}
                                title={step.title}
                            >
                                {isComplete ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    index + 1
                                )}
                            </button>

                            {index < steps.length - 1 && (
                                <div 
                                    className={`
                                        flex-1 h-1 rounded-full transition-colors
                                        ${index < currentStep || completedSteps.includes(steps[index + 1]?.id)
                                            ? 'bg-emerald-300'
                                            : 'bg-gray-200'
                                        }
                                    `}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Current step title */}
            <div className="mt-3 text-center">
                <span className="text-sm font-medium text-gray-700">
                    {steps[currentStep]?.title}
                </span>
            </div>
        </div>
    );
};

export default StepProgress;
