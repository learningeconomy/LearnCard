import React, { useState } from 'react';

import DownRightArrow from '../svgs/DownRightArrow';
import InfoIcon from '../svgs/InfoIcon';
import InfoBox from './InfoBox';

type SkillsBoxProps = {
    skillsObject: { [skill: string]: string[] };
};

const SkillsBox: React.FC<SkillsBoxProps> = ({ skillsObject }) => {
    const [showInfo, setShowInfo] = useState(false);

    const plusOne = (
        <span className="bg-white rounded-full ml-auto h-[20px] w-[20px] flex items-center justify-center">
            +1
        </span>
    );

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Skills</h3>
            <button
                className="absolute top-[17px] right-[17px]"
                onClick={() => setShowInfo(!showInfo)}
            >
                <InfoIcon color={showInfo ? '#6366F1' : undefined} />
            </button>
            {showInfo && (
                <InfoBox text="This is what skills are." handleClose={() => setShowInfo(false)} />
            )}
            {Object.keys(skillsObject).map((skill, index) => {
                const subskills = skillsObject[skill];
                return (
                    <div
                        key={index}
                        className="p-[10px] bg-[#9B51E0]/[.15] w-full rounded-[15px] text-grayscale-900 flex flex-col gap-[5px]"
                    >
                        <div className="flex items-center py-[5px]">
                            <span className="text-[20px] leading-[18px] tracking-[0.75px]">
                                {skill}
                            </span>
                            {plusOne}
                        </div>
                        {subskills.length > 0 &&
                            subskills.map((subskill: string, subskillIndex: number) => (
                                <div
                                    key={`subskill-${subskillIndex}`}
                                    className="flex items-center py-[5px]"
                                >
                                    <DownRightArrow className="bg-white rounded-full h-[20px] w-[20px] px-[2.5px] py-[4px] overflow-visible mr-[10px]" />
                                    <span className="text-[17px] leading-[18px] tracking-[0.75px]">
                                        {subskill}
                                    </span>
                                    {plusOne}
                                </div>
                            ))}
                    </div>
                );
            })}
        </div>
    );
};

export default SkillsBox;
