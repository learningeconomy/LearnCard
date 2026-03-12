import React from 'react';
import X from 'src/components/svgs/X';

type SkillProfileStep1Props = {
    handleNext: () => void;
};

const SkillProfileStep1: React.FC<SkillProfileStep1Props> = ({ handleNext }) => {
    return (
        <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[20px] font-bold text-grayscale-900 font-poppins leading-[24px] tracking-[0.24px]">
                    Grow your skills and explore opportunities
                </h3>
                <p className="text-[16px] text-grayscale-700 font-poppins leading-[130%]">
                    Your profile is used to create personalized opportunities.{' '}
                    <strong className="font-bold">All your answers are confidential.</strong>
                </p>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    Goals
                </span>

                <span>input...</span>

                <div className="flex flex-wrap gap-[5px]">
                    <span className="flex items-center gap-[8px] border-solid border-[2px] border-sky-200 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]">
                        Goal 1
                        <button>
                            <X className="w-[15px] h-[15px]" />
                        </button>
                    </span>
                    <span className="flex items-center gap-[8px] border-solid border-[2px] border-sky-200 bg-sky-50 pl-[15px] pr-[10px] py-[7px] rounded-full text-sky-600 font-poppins text-[13px] font-bold leading-[18px]">
                        Goal 2
                        <button>
                            <X className="w-[15px] h-[15px]" />
                        </button>
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    Professional title
                </span>

                <span>input...</span>
            </div>

            <div className="flex flex-col gap-[10px]">
                <span className="text-grayscale-900 font-poppins text-[14px] font-bold leading-[130%]">
                    Lifetime experience in this role
                </span>

                <span>years + months inputs...</span>
            </div>

            <button
                className="bg-emerald-500 text-white rounded-full px-[15px] py-[7px] text-[17px] font-bold leading-[24px] tracking-[0.25px] h-[44px]"
                onClick={handleNext}
            >
                Next
            </button>
        </div>
    );
};

export default SkillProfileStep1;
