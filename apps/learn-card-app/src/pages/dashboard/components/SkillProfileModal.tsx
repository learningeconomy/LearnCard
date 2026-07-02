import React, { useState } from 'react';

import { useBrandingConfig } from 'learn-card-base';

import X from 'src/components/svgs/X';

import * as m from '../../../paraglide/messages.js';

import SkillProfileStep1 from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';
import SkillProfileStep2 from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileStep2';
import SkillProfileStep3 from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileStep3';
import SkillProfileStep4 from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileStep4';
import SkillProfileStep5 from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileStep5';
import SkillProfileProgressBar from '../../ai-pathways/ai-pathways-skill-profile/SkillProfileProgressBar';

type SkillProfileModalProps = {
    onClose: () => void;
};

const TOTAL_STEPS = 5;

const SkillProfileModal: React.FC<SkillProfileModalProps> = ({ onClose }) => {
    const { name: brandName } = useBrandingConfig();
    const [currentStep, setCurrentStep] = useState(1);

    const handleNext = () => {
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleFinish = () => {
        onClose();
    };

    const steps: Record<number, React.ReactNode> = {
        1: <SkillProfileStep1 handleNext={handleNext} />,
        2: <SkillProfileStep2 handleNext={handleNext} handleBack={handleBack} />,
        3: <SkillProfileStep3 handleNext={handleNext} handleBack={handleBack} />,
        4: <SkillProfileStep4 handleNext={handleNext} handleBack={handleBack} />,
        5: <SkillProfileStep5 handleNext={handleFinish} handleBack={handleBack} />,
    };

    return (
        <div className="font-poppins flex flex-col bg-white min-h-full p-5 desktop:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <p className="text-[11px] font-medium tracking-[0.14em] text-grayscale-500 uppercase">
                        {m['dashboard.skillProfile.eyebrow']({ brand: brandName })}
                    </p>
                    <h2 className="mt-0.5 text-lg desktop:text-xl font-semibold text-grayscale-900 leading-tight">
                        {m['dashboard.skillProfile.title']()}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={m['common.close']()}
                    className="shrink-0 w-8 h-8 rounded-full hover:bg-grayscale-100 transition-colors flex items-center justify-center text-grayscale-500 hover:text-grayscale-700"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <SkillProfileProgressBar
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isExpanded
            />

            <div className="mt-3 flex items-center w-full mb-4">
                <span className="text-grayscale-600 font-poppins font-medium text-[14px] leading-[18px]">
                    {m['dashboard.skillProfile.stepOf']({
                        current: currentStep,
                        total: TOTAL_STEPS,
                    })}
                </span>
                {currentStep < TOTAL_STEPS && (
                    <button
                        type="button"
                        onClick={() => setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS))}
                        className="ml-auto text-grayscale-600 font-poppins font-bold text-[14px] leading-[18px] hover:text-grayscale-900 transition-colors"
                    >
                        {m['dashboard.skillProfile.skip']()}
                    </button>
                )}
            </div>

            <div className="pt-4 border-t border-grayscale-200 w-full">
                {steps[currentStep] ?? null}
            </div>
        </div>
    );
};

export default SkillProfileModal;
