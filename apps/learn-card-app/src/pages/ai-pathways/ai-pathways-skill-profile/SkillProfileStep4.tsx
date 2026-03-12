import React from 'react';

type SkillProfileStep4Props = {
    handleNext: () => void;
    handleBack: () => void;
};

const SkillProfileStep4: React.FC<SkillProfileStep4Props> = ({ handleNext, handleBack }) => {
    return (
        <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    How would you rate your work-life balance?
                </h3>
            </div>

            <div className="flex gap-[10px] w-full">
                <button
                    className="bg-grayscale-50 text-grayscale-800 rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 border-[1px] border-solid border-grayscale-200 h-[44px]"
                    onClick={handleBack}
                >
                    Back
                </button>
                <button
                    className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] flex-1 h-[44px]"
                    onClick={handleNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SkillProfileStep4;
