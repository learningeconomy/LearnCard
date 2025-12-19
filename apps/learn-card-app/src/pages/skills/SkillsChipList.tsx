import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';

import {
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
    BoostCMSSKillsCategoryEnum,
    BoostCMSCategorySkillEnum,
} from '../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

import { SkillSummary, SkillItem } from './skills.helpers';

export const SkillsChipItem: React.FC<{
    title: string;
    count: number;
    containerClassName?: string;
    countClassName?: string;
    iconClassName?: string;
    iconFill?: string;
}> = ({
    title,
    count,
    containerClassName,
    countClassName,
    iconClassName,
    iconFill = '#6D28D9',
}) => {
    return (
        <div
            className={`text-violet-600 bg-violet-100 rounded-full pl-4 py-[2px] font-semibold text-sm whitespace-nowrap flex items-center ${containerClassName}`}
        >
            {title}
            <span
                className={`ml-2 mr-[1px] flex items-center font-bold bg-white rounded-full px-4 py-[6px] ${countClassName}`}
            >
                <SkillsIcon className={`h-[20px] w-[20px] mr-2 ${iconClassName}`} fill={iconFill} />
                {count}
            </span>
        </div>
    );
};

export const SkillsChipList: React.FC<{
    skills: SkillSummary;
    category: string;
}> = ({ skills, category }) => {
    return (
        <div className="w-full mt-4 pb-2 pl-2 border-t border-grayscale-100 pt-2">
            <Swiper spaceBetween={12} slidesPerView={'auto'} grabCursor={true}>
                {(skills ?? [])?.map((skill: SkillItem, idx) => {
                    const _skills = CATEGORY_TO_SKILLS?.[category as BoostCMSSKillsCategoryEnum];
                    const _skill = _skills?.find(s => s?.type === skill?.skill);

                    const mainSkillSlide = (
                        <SwiperSlide key={`skill-${idx}`} style={{ width: 'auto' }}>
                            <SkillsChipItem title={_skill?.title} count={skill?.count ?? 1} />
                        </SwiperSlide>
                    );

                    const subSkillSlides = Object.entries(skill?.subskills).map(
                        ([subskill, count], subIdx) => {
                            const subskills =
                                SKILLS_TO_SUBSKILLS?.[skill.skill as BoostCMSCategorySkillEnum];
                            const _subskill = subskills?.find(s => s.type === subskill);

                            return (
                                <SwiperSlide key={`sub-${idx}-${subIdx}`} style={{ width: 'auto' }}>
                                    <SkillsChipItem title={_subskill?.title} count={count} />
                                </SwiperSlide>
                            );
                        }
                    );

                    return [mainSkillSlide, ...subSkillSlides];
                })}
            </Swiper>
        </div>
    );
};

export default SkillsChipList;
