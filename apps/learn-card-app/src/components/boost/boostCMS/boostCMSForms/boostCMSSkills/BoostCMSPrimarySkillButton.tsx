import React from 'react';

import Checkmark from 'learn-card-base/svgs/Checkmark';

import { BoostCMSSkill, BoostCMSSkillsEnum } from '../../../boost';
import {
    BoostCMSCategorySkillEnum,
    boostCMSSKillCategories,
    BoostCMSSKillsCategoryEnum,
} from './boostSkills';
import TrashBin from '../../../../svgs/TrashBin';

const BoostCMSPrimarySkillButton: React.FC<{
    skill: {
        id: number;
        title: string;
        IconComponent: React.ReactNode;
        iconClassName: string;
        iconCircleClass: string;
        category: BoostCMSSKillsCategoryEnum;
        type: BoostCMSCategorySkillEnum;
    };
    skillSelected: BoostCMSSkill | undefined;
    handleAddSkill?: (skill: {
        category: BoostCMSSKillsCategoryEnum | string;
        skill: BoostCMSSkillsEnum;
        subskills: string[];
    }) => void;
    handleRemoveSkill?: (skill: BoostCMSSkill | string) => void;
    handleExpandSubSkills?: () => void;
    inViewMode?: boolean;
}> = ({
    skillSelected,
    skill,
    handleAddSkill,
    handleRemoveSkill,
    handleExpandSubSkills,
    inViewMode = false,
}) => {
    const { title, IconComponent, type, category } = skill;

    const _category = boostCMSSKillCategories?.find(c => c.type === category);

    const subSkills = skillSelected?.subskills ?? [];
    const subSkillsCount = skillSelected?.subskills?.length ?? 0;

    return (
        <div
            className={`flex items-center justify-between w-full mb-4 ${
                skillSelected && !inViewMode ? 'border-emerald-600 border-solid border-2' : ''
            } ${inViewMode ? 'bg-violet-100 rounded-[20px]' : 'bg-white rounded-full'}`}
        >
            <div className="flex items-center justify-start w-[80%] px-[6px] py-[10px] overflow-hidden">
                <div className="rounded-full h-[50px] w-[50px]">
                    <img
                        src={IconComponent}
                        alt="skill icon"
                        className="w-full h-full object-contain"
                    />
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
            {skillSelected ? (
                <div
                    className={`flex items-center justify-center rounded-full mr-4 h-[40px] w-[40px] ${
                        inViewMode ? 'bg-white' : 'bg-emerald-600'
                    }`}
                >
                    {inViewMode && subSkills?.length > 0 ? (
                        <button
                            onClick={() => {
                                handleExpandSubSkills?.();
                            }}
                            className={`${
                                inViewMode
                                    ? 'bg-white text-black font-bold flex items-center justify-center text-center'
                                    : ''
                            }`}
                        >
                            +{subSkillsCount}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                handleRemoveSkill?.(type);
                            }}
                            className={`${inViewMode ? 'bg-white' : ''}`}
                        >
                            {inViewMode ? (
                                <TrashBin className="text-black h-[20px] w-[20px]" />
                            ) : (
                                <Checkmark className="text-white h-[30px] w-[30px]" />
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center rounded-full bg-grayscale-100 mr-4 h-[40px] w-[40px]">
                    <button
                        onClick={() => {
                            handleAddSkill?.({
                                category: category,
                                skill: type,
                                subskills: [],
                            });
                        }}
                        className="w-full h-full rounded-full"
                    ></button>
                </div>
            )}
        </div>
    );
};

export default BoostCMSPrimarySkillButton;
