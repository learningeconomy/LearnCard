import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';
import AnimatedPlusToXIcon from '../../../ai-passport/helpers/AnimatedPlusToXIcon';
import CheckListManagerFooter from '../CheckListManager/CheckListManagerFooter';

export const CheckListSelfAttestedSkills: React.FC = () => {
    // TODO
    // - Add Self Attested Skills functionality

    const selfAttestedSkills = [
        'Effective Communication',
        'Time Management',
        'Problem Solving',
        'Adaptability',
        'Collaboration',
        'Critical Thinking',
        'Attention to Detail',
        'Creativity',
        'Leadership',
        'Conflict Resolution',
    ];

    return (
        <>
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl px-6 pt-2 pb-4 mt-4 rounded-[15px]">
                <div className="flex flex-col items-start justify-center py-2 w-full">
                    <h4 className="text-lg text-grayscale-900 font-notoSans text-left mb-2">
                        Self-Attested Skills
                    </h4>
                    <p className="text-sm text-grayscale-600 font-notoSans text-left mb-4">
                        Select from suggested skills based on your profile or add your own.
                    </p>

                    <button
                        className={`w-full flex rounded-[30px] items-center justify-center py-2 font-semibold text-[17px] border-[2px] border-solid border-grayscale-200 text-grayscale-500`}
                    >
                        Add a skill <Plus className="w-[20px] h-auto text-grayscale-500 ml-2" />
                    </button>

                    <div className="flex flex-wrap items-center justify-start w-full mt-4">
                        {selfAttestedSkills.map(skill => (
                            <button
                                key={skill}
                                className={`text-left flex items-center justify-between rounded-full py-[5px] px-[16px] font-semibold text-[17px] font-notoSans mt-2 mr-2 bg-cyan-50 text-grayscale-900`}
                            >
                                {skill}
                                <AnimatedPlusToXIcon
                                    isPlus={false}
                                    className="text-grayscale-500 h-[24px] w-auto ml-[10px]"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <CheckListManagerFooter />
        </>
    );
};

export default CheckListSelfAttestedSkills;
