import React from 'react';

import {
    boostCMSSKillCategories,
    type BoostCMSCategorySkillEnum,
    type BoostCMSSKillsCategoryEnum,
    type BoostCMSSubSkillEnum,
} from '../../constants/skills';

const Subskill: React.FC<{
    skill: {
        id: number;
        title: string;
        IconComponent: React.ReactNode | string;
        iconClassName: string;
        iconCircleClass: string;
        category: BoostCMSSKillsCategoryEnum | string;
        type: BoostCMSCategorySkillEnum | string;
    };
    subSkill: {
        id: number;
        title: string;
        type: BoostCMSSubSkillEnum | string;
    };
    subskillSelected: boolean;
}> = ({ subskillSelected: _subskillSelected, skill, subSkill }) => {
    const { title: _title, IconComponent, type: _type, category } = skill;

    const _category = boostCMSSKillCategories.find(c => c.type === category);

    return (
        <div className="flex items-center justify-between w-full mb-4  bg-violet-100 rounded-[20px]">
            <div className="flex items-center justify-start w-[90%] px-[6px] py-[10px] overflow-hidden">
                <div className="rounded-full h-[50px] w-[50px]">
                    <img src={IconComponent as string} alt="skill icon" className="w-full h-full" />
                </div>
                <div className="flex flex-col items-start justify-center ml-2">
                    <p className="font-poppins text-left text-violet-800 font-semibold text-xs">
                        {_category?.title} / {skill?.title}
                    </p>
                    <p className="text-black font-poppins text-left text-base font-normal">
                        {subSkill?.title}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Subskill;
