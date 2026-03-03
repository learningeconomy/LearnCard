import React from 'react';

import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { SkillsChipItem } from '../skills/SkillsChipList';
import {
    SKILLS,
    SUBSKILLS,
} from '../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

interface AiInsightsTopSkillsProps {
    topSkills: {
        name: string;
        count: number;
        type: string;
    }[];
    showSkillsIcon?: boolean;
}

const AiInsightsTopSkills: React.FC<AiInsightsTopSkillsProps> = ({
    topSkills,
    showSkillsIcon = true,
}) => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] mt-2 rounded-[15px]">
            <div className="w-full flex items-center justify-start">
                {showSkillsIcon && <SkillsIconWithShape className="w-[40px] h-[40px]" />}
                <h2 className="text-xl text-grayscale-800 font-notoSans">Top Skills</h2>
            </div>

            <div className="w-full flex flex-col items-start justify-start mt-4">
                {topSkills.map((skill, index) => {
                    let skillName = skill.name;
                    let description = '';
                    if (skill.type === 'skill') {
                        skillName = SKILLS.find(s => s.type === skill.name)?.title ?? skillName;
                        description = SKILLS.find(s => s.type === skill.name)?.description ?? '';
                    } else {
                        skillName = SUBSKILLS?.find(s => s.type === skill.name)?.title ?? skillName;
                        description =
                            SUBSKILLS?.find(s => s.type === skill.name)?.description ?? '';
                    }

                    return (
                        <div key={index} className="flex flex-col items-start justify-start">
                            <SkillsChipItem
                                title={skillName}
                                count={skill.count}
                                containerClassName="!bg-grayscale-100 !text-grayscale-900 !rounded-[10px]"
                                countClassName="!text-grayscale-900 !rounded-[10px] !px-2"
                                iconClassName="!mr-[2px]"
                                iconFill="#353E64"
                            />
                            <p className="w-full text-left text-grayscale-700 font-notoSans text-sm mt-2 mx-2 mb-4">
                                {description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AiInsightsTopSkills;
