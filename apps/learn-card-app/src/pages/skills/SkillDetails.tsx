import React, { useRef, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import {
    BoostCategoryOptionsEnum,
    ModalTypes,
    useGetSkillFrameworkById,
    useGetSkill,
    useModal,
} from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import FrameworkImage from '../SkillFrameworks/FrameworkImage';
import BoostEarnedCard from '../../components/boost/boost-earned-card/BoostEarnedCard';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import BoostEarnedIDCard from '../../components/boost/boost-earned-card/BoostEarnedIDCard';
import SkillBreadcrumbText from '../SkillFrameworks/SkillBreadcrumbText';
import BrowseFrameworkPage from '../SkillFrameworks/BrowseFrameworkPage';
import FrameworkSkillsCount from '../SkillFrameworks/FrameworkSkillsCount';

import { VC } from '@learncard/types';
import {
    SELF_ASSIGNED_SKILLS_ACHIEVEMENT_TYPE,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SelfAssignedSkillCard from './SelfAssignedSkillCard';

type SkillDetailsProps = {
    frameworkId: string;
    skillId: string;
    credentials: VC[];
};

const SkillDetails: React.FC<SkillDetailsProps> = ({ frameworkId, skillId, credentials }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { data: frameworkData } = useGetSkillFrameworkById(frameworkId);

    const { data: skillData } = useGetSkill(frameworkId, skillId);

    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    const openBrowseFrameworkModal = () => {
        newModal(
            <BrowseFrameworkPage
                frameworkInfo={frameworkData?.framework ?? {}}
                handleClose={closeModal}
                isViewOnly
            />
        );
    };

    return (
        <section className="flex flex-col gap-[20px] h-full w-full max-w-[600px] pt-[40px]">
            {/* <div className="px-[14px] py-[7px] bg-white rounded-[5px] font-poppins text-[14px] font-[500] text-grayscale-900 w-fit">
                Details
            </div> */}

            <div className="flex flex-col gap-[5px]">
                <div className="flex gap-[10px] items-center">
                    <p className="font-poppins text-[17px]  text-grayscale-900">Issuances</p>

                    <div className="flex gap-[2px] items-center py-[2px] px-[5px] bg-grayscale-50 rounded-[5px] ml-auto border-[1px] border-grayscale-200 border-solid">
                        <PuzzlePiece
                            version="filled"
                            className="w-[20px] h-[20px] text-grayscale-700"
                        />
                        <p className="font-poppins text-[14px] font-[600] text-grayscale-700">
                            {credentials?.length}
                        </p>
                    </div>
                </div>

                <p className="font-poppins text-[14px] text-grayscale-900">
                    You earned this skill from these credentials.
                </p>

                <div className="flex gap-[10px] pt-[10px]">
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
                                            <SelfAssignedSkillCard
                                                skillId={skillId}
                                                frameworkId={frameworkId}
                                            />
                                        )}
                                        {!isSelfAssignedSkill && (
                                            <>
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

            {frameworkData && (
                <div className="flex flex-col gap-[20px] p-[15px] bg-white rounded-[15px] shadow-bottom-2-4">
                    <p className="font-poppins text-[17px] text-grayscale-900">Framework</p>

                    <div className="flex items-center gap-[10px]">
                        <FrameworkImage
                            image={frameworkData?.framework.image}
                            sizeClassName="w-[65px] h-[65px]"
                            iconSizeClassName="w-[36px] h-[36px]"
                        />
                        <h5 className="text-[16px] text-grayscale-900 font-poppins line-clamp-2">
                            {frameworkData?.framework.name}
                        </h5>
                    </div>

                    {frameworkData?.framework.description && (
                        <p className="text-grayscale-700 font-poppins text-[14px]">
                            {frameworkData?.framework.description.length > 333
                                ? isDescriptionExpanded
                                    ? frameworkData?.framework.description
                                    : `${frameworkData?.framework.description.slice(0, 330)}...`
                                : frameworkData?.framework.description}
                            {frameworkData?.framework.description.length > 333 && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="text-grayscale-700 font-poppins text-[14px] font-[600] ml-1"
                                >
                                    {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                                </button>
                            )}
                        </p>
                    )}

                    <div className="flex flex-col gap-[5px]">
                        <span className="uppercase font-poppins text-[14px] text-grayscale-700">
                            Location in Framework
                        </span>

                        <SkillBreadcrumbText
                            frameworkId={frameworkId}
                            skillId={skillId}
                            includeSkill
                        />
                    </div>

                    <div className="pt-[20px] pb-[10px] border-t-[1px] border-grayscale-200 border-solid">
                        <button
                            onClick={openBrowseFrameworkModal}
                            className="text-grayscale-900 font-poppins text-[17px] leading-[130%] flex items-center gap-[5px] w-full"
                        >
                            Browse
                            <div className="flex items-center ml-auto text-[14px]">
                                <FrameworkSkillsCount
                                    frameworkId={frameworkId}
                                    className="!text-grayscale-700"
                                    includeSkillWord
                                />
                                <SlimCaretRight className="text-grayscale-700" />
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SkillDetails;
