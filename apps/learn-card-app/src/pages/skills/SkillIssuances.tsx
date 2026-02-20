import React, { useRef, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import { BoostCategoryOptionsEnum, conditionalPluralize } from 'learn-card-base';

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

type SkillIssuancesProps = {
    frameworkId: string;
    skillId: string;
    credentials: VC[];
};

const SkillIssuances: React.FC<SkillIssuancesProps> = ({ frameworkId, skillId, credentials }) => {
    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    return (
        <div className="flex flex-col gap-[5px] w-full">
            <p className="font-poppins text-[17px]  text-grayscale-900">
                {conditionalPluralize(credentials?.length, 'Issuance')}
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
                        {credentials.map((boost, index) => {
                            const boostCategory = getDefaultCategoryForCredential(boost);
                            const isID = boostCategory === BoostCategoryOptionsEnum.id;
                            const isMembership =
                                boostCategory === BoostCategoryOptionsEnum.membership;

                            const isSelfAssignedSkill =
                                boost.boostCredential?.credentialSubject?.achievement
                                    ?.achievementType === SELF_ASSIGNED_SKILLS_ACHIEVEMENT_TYPE;

                            return (
                                <SwiperSlide key={index} style={{ width: 'auto' }}>
                                    {isSelfAssignedSkill && (
                                        <SkillCard
                                            skillId={skillId}
                                            frameworkId={frameworkId}
                                            isSelfAssigned
                                        />
                                    )}
                                    {!isSelfAssignedSkill && (
                                        <>
                                            {isID || isMembership ? (
                                                <div className="mt-6">
                                                    <BoostEarnedIDCard
                                                        credential={boost}
                                                        categoryType={boostCategory}
                                                        defaultImg=""
                                                    />
                                                </div>
                                            ) : (
                                                <BoostEarnedCard
                                                    credential={boost}
                                                    categoryType={boostCategory}
                                                    sizeLg={12}
                                                    sizeMd={12}
                                                    sizeSm={12}
                                                    isInSkillsModal={true}
                                                    className="!min-h-[310px]"
                                                />
                                            )}
                                        </>
                                    )}
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

export default SkillIssuances;
