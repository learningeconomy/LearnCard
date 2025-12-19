import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

import { IonGrid, IonCol } from '@ionic/react';
import { SkillsChipItem } from '../SkillsChipList';
import SlimCaretLeft from '../../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';
import BoostEarnedIDCard from '../../../components/boost/boost-earned-card/BoostEarnedIDCard';

import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import {
    CredentialsGroupedByCategory,
    CredentialsGroupedByCategorySkills,
    CredentialsGroupedByCategorySubskill,
} from '../../../pages/skills/skills.helpers';
// Import Swiper styles
import 'swiper/css';
import {
    SKILLS,
    SUBSKILLS,
} from '../../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

type BoostGroupedBySkillsModalProps = {
    groupedCredentials?: CredentialsGroupedByCategory;
    groupedCredentialsBySkill?: CredentialsGroupedByCategorySkills;
    groupedCredentialsBySubskill?: CredentialsGroupedByCategorySubskill;
    displayType: GroupedSkillsDisplayType;
};

export enum GroupedSkillsDisplayType {
    category,
    skill,
    subskill,
}

const GroupedCredentialsBySkillsList: React.FC<BoostGroupedBySkillsModalProps> = ({
    groupedCredentials,
    groupedCredentialsBySkill,
    groupedCredentialsBySubskill,
    displayType,
}) => {
    const credentials =
        groupedCredentials?.credentials ??
        groupedCredentialsBySkill?.credentials ??
        groupedCredentialsBySubskill?.credentials ??
        [];

    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const sortedCredentials = credentials?.sort((a, b) => {
        const lastCategories = [BoostCategoryOptionsEnum.id, BoostCategoryOptionsEnum.membership];

        const categoryA = getDefaultCategoryForCredential(a);
        const categoryB = getDefaultCategoryForCredential(b);

        if (lastCategories.includes(categoryA) && !lastCategories.includes(categoryB)) {
            return 1;
        }
        if (!lastCategories.includes(categoryA) && lastCategories.includes(categoryB)) {
            return -1;
        }
        return 0;
    });

    let skillLabel = '';
    let skillDescription = '';
    if (displayType === GroupedSkillsDisplayType.skill) {
        skillLabel =
            SKILLS.find(skill => skill.type === groupedCredentialsBySkill?.skill)?.title ?? '';
        skillDescription =
            SKILLS.find(skill => skill.type === groupedCredentialsBySkill?.skill)?.description ??
            '';
    } else if (displayType === GroupedSkillsDisplayType.subskill) {
        skillLabel =
            SUBSKILLS.find(skill => skill.type === groupedCredentialsBySubskill?.subSkill)?.title ??
            '';
        skillDescription =
            SUBSKILLS.find(skill => skill.type === groupedCredentialsBySubskill?.subSkill)
                ?.description ?? '';
    }

    const showNavigation = sortedCredentials.length > 1;

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    return (
        <IonCol className="my-4">
            <IonGrid className="w-full rounded-[16px] bg-white shadow-soft-bottom py-4 relative">
                <div className="w-full px-2 mb-4">
                    <SkillsChipItem
                        title={skillLabel}
                        count={sortedCredentials?.length ?? 0}
                        containerClassName="flex items-center justify-between"
                    />
                    <div className="flex items-center justify-between px-1 my-2">
                        <p className="text-grayscale-700 text-sm">{skillDescription}</p>
                    </div>
                    <div className="w-full mx-auto border-b-solid border-b-[1px] border-grayscale-100 mt-4" />
                </div>

                {sortedCredentials?.length > 0 && (
                    <div className="relative">
                        <Swiper
                            onSwiper={swiper => {
                                swiperRef.current = swiper;
                                handleSwiperUpdate(swiper);
                            }}
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
                            {sortedCredentials.map((boost, index) => {
                                const boostCategory = getDefaultCategoryForCredential(boost);
                                const isID = boostCategory === BoostCategoryOptionsEnum.id;
                                const isMembership =
                                    boostCategory === BoostCategoryOptionsEnum.membership;

                                return (
                                    <SwiperSlide key={index} style={{ width: 'auto' }}>
                                        {isID || isMembership ? (
                                            <div className="mt-6">
                                                <BoostEarnedIDCard
                                                    credential={boost}
                                                    categoryType={boostCategory}
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
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>

                        {showNavigation && !atBeginning && (
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

                        {showNavigation && !atEnd && (
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
                )}
            </IonGrid>
        </IonCol>
    );
};

export default GroupedCredentialsBySkillsList;
