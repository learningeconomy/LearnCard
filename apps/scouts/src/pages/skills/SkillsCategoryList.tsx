import React from 'react';

import SkillsChipList from './SkillsChipList';
import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';

import useBoostGroupedBySkillsModal from './BoostGroupedBySkillsModal/useBoostGroupedBySkillsModal';

import {
    boostCMSSKillCategories,
    BoostCMSSKillsCategoryEnum,
} from '../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

import { VC } from '@learncard/types';
import { VC_WITH_URI } from 'learn-card-base';
import { AggregatedEntry } from './skills.helpers';

const SkillsCategoryList: React.FC<{
    allResolvedCreds: VC[] | VC_WITH_URI[];
    categorizedSkills: [
        string,
        AggregatedEntry[] & {
            totalSkills: number;
            totalSubskills: number;
        }
    ][];
    isLoading: boolean;
}> = ({ allResolvedCreds, categorizedSkills, isLoading }) => {
    const { handlePresentBoostModal } = useBoostGroupedBySkillsModal(allResolvedCreds);

    return (
        <div className="w-full flex gap-[10px] items-center justify-start flex-wrap text-center">
            {!isLoading &&
                categorizedSkills?.map(([category, skills]) => {
                    const _category = boostCMSSKillCategories?.find(c => c.type === category);

                    const totalSubskills = skills?.totalSubskills ?? 0;
                    const totalSkills = skills?.totalSkills ?? 0;

                    if (_category) {
                        const { IconComponent } = _category;

                        const totalSubskillsCount = totalSubskills + totalSkills;

                        return (
                            <div
                                key={category}
                                role="button"
                                className="bg-white flex items-center justify-center rounded-[20px] shadow-soft-bottom relative skills-page-skills-container overflow-hidden"
                                onClick={() => {
                                    handlePresentBoostModal(
                                        category as BoostCMSSKillsCategoryEnum,
                                        totalSubskillsCount
                                    );
                                }}
                            >
                                <div className="w-full flex items-center justify-start pt-4 px-2">
                                    <div className="rounded-full w-[50px] h-[50px] ml-2 mr-4">
                                        <img
                                            src={IconComponent}
                                            alt="category icon"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex flex-col items-start justify-center">
                                        <h2 className="text-grayscale-900 text-[20px] font-poppins">
                                            {_category?.title}
                                        </h2>
                                        <p className="text-grayscale-700 text-sm my-1">
                                            {_category?.description}
                                        </p>
                                        {totalSubskillsCount > 0 && (
                                            <span className="flex items-center text-lg font-poppins text-violet-800 font-semibold">
                                                <SkillsIcon
                                                    className="h-[30px] w-[30px] mr-1"
                                                    fill="#6D28D9"
                                                />

                                                {totalSubskillsCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <SkillsChipList skills={skills} category={category} />
                                <button className="absolute top-[10px] right-[10px]">
                                    <SlimCaretRight className="h-[30px] w-[30px] text-grayscale-300" />
                                </button>
                            </div>
                        );
                    }
                })}
        </div>
    );
};

export default SkillsCategoryList;
