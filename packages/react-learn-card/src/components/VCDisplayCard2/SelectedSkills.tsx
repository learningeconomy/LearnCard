import React, { useState } from 'react';

import TopLevelSkill from './TopLevelSkill';
import Subskill from './Subskill';

import {
    boostCMSSKillCategories,
    BoostCMSSKillsCategoryEnum,
    BoostCMSCategorySkillEnum,
    BoostCMSSubSkillEnum,
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
} from '../../constants/skills';

export const SelectedSkills: React.FC<{
    skill: {
        id: number;
        title: string;
        IconComponent: React.ReactNode;
        iconClassName: string;
        iconCircleClass: string;
        category: BoostCMSSKillsCategoryEnum;
        type: BoostCMSCategorySkillEnum;
    };
    skillSelected:
        | {
              category: BoostCMSSKillsCategoryEnum;
              skill: BoostCMSCategorySkillEnum;
              subskills: BoostCMSSubSkillEnum[];
          }
        | undefined;
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
            {skillSelected && skillSelected?.subskills?.length > 0 && expandSubSkills && (
                <div className="w-full flex items-center justify-end">
                    <div className="w-[90%] flex items-center flex-col">
                        {skillSelected?.subskills.map((subSkill, i) => {
                            const subskillSelected = skillSelected?.subskills?.includes(subSkill);

                            const _subSkill = SKILLS_TO_SUBSKILLS?.[skill?.type]?.find(
                                ss => ss.type === subSkill
                            );

                            return (
                                <Subskill
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
