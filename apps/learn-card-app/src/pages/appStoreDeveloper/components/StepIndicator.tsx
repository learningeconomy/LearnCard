import React from 'react';
import { Check } from 'lucide-react';

interface Step {
    id: number;
    title: string;
    description: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center justify-center gap-2">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                                    isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isCurrent
                                          ? 'bg-cyan-500 text-white'
                                          : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>

                            <div className="hidden sm:block">
                                <p
                                    className={`text-sm font-medium ${
                                        isCurrent ? 'text-gray-700' : 'text-gray-400'
                                    }`}
                                >
                                    {step.title}
                                </p>
                            </div>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={`w-12 h-0.5 transition-colors duration-300 ${
                                    currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
