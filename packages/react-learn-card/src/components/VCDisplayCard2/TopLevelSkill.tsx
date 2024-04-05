import React from 'react';

import {
    BoostCMSCategorySkillEnum,
    boostCMSSKillCategories,
    BoostCMSSKillsCategoryEnum,
    BoostCMSSubSkillEnum,
} from '../../constants/skills';

const TopLevelSkill: React.FC<{
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

    handleExpandSubSkills?: () => void;
}> = ({ skillSelected, skill, handleExpandSubSkills }) => {
    const { title, IconComponent, type, category } = skill;

    const _category = boostCMSSKillCategories.find(c => c.type === category);

    const subSkills = skillSelected.subskills ?? [];
    const subSkillsCount = skillSelected.subskills.length ?? 0;

    return (
        <div
            className={`flex items-center justify-between w-full mb-4 bg-violet-100 rounded-[20px]`}
        >
            <div className="flex items-center justify-start w-[80%] px-[6px] py-[10px] overflow-hidden">
                <div className="rounded-full h-[50px] w-[50px]">
                    <img src={IconComponent as string} alt="skill icon" className="w-full h-full" />
                </div>
                <div className="flex flex-col items-start justify-center ml-2">
                    <p className="font-poppins text-left text-violet-800 font-semibold text-xs">
                        {_category?.title}
                    </p>
                    <p className="text-black font-poppins text-left text-base font-normal">
                        {title}
                    </p>
                </div>
            </div>
            {subSkills?.length > 0 && (
                <div className="flex items-center justify-center rounded-full bg-white mr-4 h-[40px] w-[40px]">
                    <button
                        onClick={() => {
                            handleExpandSubSkills?.();
                        }}
                        className="text-black font-bold flex items-center justify-center text-center font-poppins"
                    >
                        +{subSkillsCount}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TopLevelSkill;
