import React, { useState } from 'react';

import { ProfilePicture } from 'learn-card-base';
import X from 'src/components/svgs/X';
import Pencil from 'src/components/svgs/Pencil';
import SkillProfileProgressBar, { useSkillProfileCompletion } from './SkillProfileProgressBar';
import SkillProfileStep1 from './SkillProfileStep1';
import SkillProfileStep2 from './SkillProfileStep2';
import SkillProfileStep3 from './SkillProfileStep3';
import SkillProfileStep4 from './SkillProfileStep4';
import SkillProfileStep5 from './SkillProfileStep5';

type MySkillProfileProps = {};

const MySkillProfile: React.FC<MySkillProfileProps> = ({}) => {
    const [isExpanded, setIsExpanded] = useState(true); // init = true the first time you land on the page, TODO false otherwise
    const [currentStep, setCurrentStep] = useState(1);
    const { percentage, lastEditedDate } = useSkillProfileCompletion();

    const formattedEditDate = lastEditedDate
        ? new Date(lastEditedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : undefined;

    const handleNext = () => {
        setCurrentStep(currentStep + 1);
    };

    const handleFinish = () => {
        setIsExpanded(false);
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const steps: Record<number, React.ReactNode> = {
        1: <SkillProfileStep1 handleNext={handleNext} />,
        2: <SkillProfileStep2 handleNext={handleNext} handleBack={handleBack} />,
        3: <SkillProfileStep3 handleNext={handleNext} handleBack={handleBack} />,
        4: <SkillProfileStep4 handleNext={handleNext} handleBack={handleBack} />,
        5: <SkillProfileStep5 handleNext={handleFinish} handleBack={handleBack} />,
    };

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center px-4">
            <div className="w-full max-w-[600px] bg-white items-center justify-center flex flex-col shadow-bottom-2-4 px-[15px] py-[18px] rounded-[15px]">
                <div className="flex flex-col w-full gap-[10px]">
                    <div className="flex gap-[10px] items-center justify-start w-full">
                        <ProfilePicture customContainerClass="w-[30px] h-[30px]" />
                        <h2 className="text-[16px] font-poppins text-grayscale-900 font-bold leading-[20px]">
                            My Skill Profile
                        </h2>
                        {isExpanded && (
                            <button onClick={() => setIsExpanded(false)} className="ml-auto">
                                <X className="h-[25px] w-[25px] text-grayscale-500" />
                            </button>
                        )}
                        {!isExpanded && (
                            <button onClick={() => setIsExpanded(true)} className="ml-auto">
                                <Pencil className="h-[25px] w-[25px] text-grayscale-500" />
                            </button>
                        )}
                    </div>

                    <SkillProfileProgressBar
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        isExpanded={isExpanded}
                    />

                    {isExpanded && (
                        <div className="flex items-center w-full">
                            <span className="text-grayscale-600 font-poppins font-[500] text-[14px] leading-[18px]">
                                {currentStep} of 5
                            </span>
                            <button
                                onClick={() => setCurrentStep(prev => (prev < 5 ? prev + 1 : prev))}
                                className="ml-auto text-grayscale-600 font-poppins font-[700] text-[14px] leading-[18px]"
                            >
                                Skip
                            </button>
                        </div>
                    )}

                    {!isExpanded && (
                        <div className="flex items-center w-full">
                            <span className="text-grayscale-600 font-poppins font-[500] text-[14px] leading-[18px]">
                                {percentage}% optimized
                                {formattedEditDate && ` • Edited on ${formattedEditDate}`}
                            </span>
                        </div>
                    )}
                </div>

                {isExpanded && (
                    <div className="pt-[20px] border-t border-grayscale-200 w-full mt-[10px]">
                        {steps[currentStep] ?? <div>Step {currentStep} content...</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MySkillProfile;
