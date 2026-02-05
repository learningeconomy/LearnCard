import React, { useRef, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import {
    BoostCategoryOptionsEnum,
    conditionalPluralize,
    useGetSkill,
    useGetSkillChildren,
    useGetSkillPath,
} from 'learn-card-base';

import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import BoostEarnedIDCard from '../../components/boost/boost-earned-card/BoostEarnedIDCard';
import SkillCard from './SkillCard';

import { VC } from '@learncard/types';
import {
    SELF_ASSIGNED_SKILLS_ACHIEVEMENT_TYPE,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

type RelatedSkillsProps = {
    frameworkId: string;
    skillId: string;
};

const RelatedSkills: React.FC<RelatedSkillsProps> = ({ frameworkId, skillId }) => {
    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const { data: pathData } = useGetSkillPath(frameworkId, skillId);
    const path = pathData?.path;
    const parent = path?.[1];

    const { data: skillChildren } = useGetSkillChildren(frameworkId, skillId);
    const { data: skillSiblings } = useGetSkillChildren(frameworkId, parent?.id ?? '');

    const parentSkill = parent && parent.type === 'competency' ? parent : null;

    enum SkillType {
        PARENT = 'parent',
        SIBLING = 'sibling',
        CHILD = 'child',
    }

    const puzzlePieceText = {
        [SkillType.PARENT]: 'PARENT SKILL',
        [SkillType.SIBLING]: 'SIBLING SKILL',
        [SkillType.CHILD]: 'SUBSKILL',
    };

    const relatedSkills = [];
    if (parentSkill) {
        relatedSkills.push({
            id: parentSkill.id,
            type: SkillType.PARENT,
        });
    }
    if (skillSiblings) {
        relatedSkills.push(
            ...skillSiblings.records
                .filter(record => record.id !== skillId && record.type === 'competency')
                .map((record: any) => ({
                    id: record.id,
                    type: SkillType.SIBLING,
                }))
        );
    }
    if (skillChildren?.records) {
        relatedSkills.push(
            ...skillChildren.records.map((record: any) => ({
                id: record.id,
                type: SkillType.CHILD,
            }))
        );
    }

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    if (relatedSkills.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-[5px] w-full">
            <p className="font-poppins text-[17px]  text-grayscale-900">
                {conditionalPluralize(relatedSkills.length, 'Related Skill')}
            </p>

            <div className="flex gap-[10px]">
                <div className="relative w-full overflow-hidden">
                    <Swiper
                        onSwiper={swiper => {
                            swiperRef.current = swiper;
                            handleSwiperUpdate(swiper);
                        }}
                        onResize={handleSwiperUpdate}
                        onSlideChange={handleSwiperUpdate}
                        onReachBeginning={() => setAtBeginning(true)}
                        onFromEdge={() => {
                            if (swiperRef.current) {
                                setAtBeginning(swiperRef.current.isBeginning);
                                setAtEnd(swiperRef.current.isEnd);
                            }
                        }}
                        onReachEnd={() => setAtEnd(true)}
                        spaceBetween={12}
                        slidesPerView={'auto'}
                        grabCursor={true}
                    >
                        {relatedSkills.map((skill, index) => {
                            return (
                                <SwiperSlide key={index} style={{ width: 'auto' }}>
                                    <SkillCard
                                        skillId={skill?.id}
                                        frameworkId={frameworkId}
                                        skillTextOverride={puzzlePieceText[skill?.type]}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    {!atBeginning && (
                        <button
                            onClick={() => {
                                swiperRef.current?.slidePrev();
                            }}
                            className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                            style={{ opacity: 0.8 }}
                        >
                            <SlimCaretLeft className="w-5 h-auto" />
                        </button>
                    )}

                    {!atEnd && (
                        <button
                            onClick={() => {
                                swiperRef.current?.slideNext();
                            }}
                            className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-2 rounded-full z-50 shadow-md hover:bg-gray-200 transition-all duration-200"
                            style={{ opacity: 0.8 }}
                        >
                            <SlimCaretRight className="w-5 h-auto" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RelatedSkills;
