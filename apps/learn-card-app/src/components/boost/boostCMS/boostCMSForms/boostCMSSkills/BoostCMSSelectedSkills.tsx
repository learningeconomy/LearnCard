import React, { useState } from 'react';

import { BoostCMSSkill, BoostCMSSkillsEnum, BoostCMSState } from '../../../boost';
import BoostCMSPrimarySkillButton from './BoostCMSPrimarySkillButton';
import BoostCMSSubSkillButton from './BoostCMSSubSkillButton';

import {
    boostCMSSKillCategories,
    BoostCMSSKillsCategoryEnum,
    BoostCMSSubSkillEnum,
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
} from './boostSkills';

export const BoostCMSSelectedSkills: React.FC<{
    state: BoostCMSState;
    setState: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    handleAddSkill: (skill: {
        category: BoostCMSSKillsCategoryEnum | string;
        skill: BoostCMSSkillsEnum;
        subskills: BoostCMSSubSkillEnum[];
    }) => void;
    handleRemoveSkill: (skill: BoostCMSSkill | string) => void;
    handleAddSubSkill: (skill: BoostCMSSkill | string, subskill: BoostCMSSubSkillEnum) => void;
    handleRemoveSubSkill: (skill: BoostCMSSkill | string, subskill: BoostCMSSubSkillEnum) => void;
}> = ({
    state,
    setState,

    category,
    skill,
    skillSelected,
    selectedSkills,
    subSkills,

    handleAddSkill,
    handleRemoveSkill,
    handleAddSubSkill,
    handleRemoveSubSkill,
}) => {
    const [expandSubSkills, setExandSubSkills] = useState<boolean>(false);

    const handleExpandSubSkills = () => setExandSubSkills(!expandSubSkills);

    return (
        <>
            <BoostCMSPrimarySkillButton
                key={skill}
                skill={skill}
                skillSelected={skillSelected}
                handleAddSkill={handleAddSkill}
                handleRemoveSkill={handleRemoveSkill}
                handleExpandSubSkills={handleExpandSubSkills}
                inViewMode
            />
            {skillSelected?.subskills?.length > 0 && expandSubSkills && (
                <div className="w-full flex items-center justify-end">
                    <div className="w-[90%] flex items-center flex-col">
                        {skillSelected?.subskills.map((subSkill, i) => {
                            const subskillSelected = skillSelected?.subskills?.includes(subSkill);

                            const _subSkill = SKILLS_TO_SUBSKILLS?.[skill?.type]?.find(
                                ss => ss.type === subSkill
                            );

                            return (
                                <BoostCMSSubSkillButton
                                    key={subSkill}
                                    handleRemoveSubSkill={handleRemoveSubSkill}
                                    handleAddSubSkill={handleAddSubSkill}
                                    skill={skill}
                                    subSkill={_subSkill}
                                    subskillSelected={subskillSelected}
                                    inViewMode
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default BoostCMSSelectedSkills;
