import React, { useState } from 'react';

import TopLevelSkill from './TopLevelSkill';
import Subskill from './Subskill';

import {
    SKILLS_TO_SUBSKILLS,
    type BoostCMSSKillsCategoryEnum,
    type BoostCMSCategorySkillEnum,
    type BoostCMSSubSkillEnum
} from '../../constants/skills';

export const SelectedSkills: React.FC<{
    skill: {
        id: number;
        title: string;
        IconComponent: React.ReactNode | string;
        iconClassName: string;
        iconCircleClass: string;
        category: BoostCMSSKillsCategoryEnum | string;
        type: BoostCMSCategorySkillEnum | string;
    };
    skillSelected: {
        category: BoostCMSSKillsCategoryEnum | string;
        skill: BoostCMSCategorySkillEnum | string;
        subskills: BoostCMSSubSkillEnum[] | string[];
    };
}> = ({ skill, skillSelected }) => {
    const [expandSubSkills, setExandSubSkills] = useState<boolean>(false);

    const handleExpandSubSkills = () => setExandSubSkills(!expandSubSkills);

    return (
        <>
            <TopLevelSkill
                skill={skill}
                skillSelected={skillSelected}
                handleExpandSubSkills={handleExpandSubSkills}
            />
            {skillSelected && skillSelected.subskills.length > 0 && expandSubSkills && (
                <div className="w-full flex items-center justify-end">
                    <div className="w-[95%] flex items-center flex-col">
                        {skillSelected.subskills.map((subSkill, i) => {
                            const subskillSelected = skillSelected?.subskills?.includes(
                                subSkill as BoostCMSSubSkillEnum
                            );

                            const _subSkill: any = SKILLS_TO_SUBSKILLS[
                                skill.type as BoostCMSCategorySkillEnum
                            ]?.find((ss: any) => ss.type === subSkill);

                            return (
                                <Subskill
                                    key={i}
                                    skill={skill}
                                    subSkill={_subSkill}
                                    subskillSelected={subskillSelected}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default SelectedSkills;
