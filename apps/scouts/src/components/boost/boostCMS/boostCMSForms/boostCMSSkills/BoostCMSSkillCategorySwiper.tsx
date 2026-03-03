import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';

import { useScreenWidth } from 'learn-card-base';

import SkinnyArrowLeft from 'learn-card-base/svgs/SkinnyArrowLeft';
import SkinnyArrowRight from 'learn-card-base/svgs/SkinnyArrowRight';

import { boostCMSSKillCategories, BoostCMSSKillsCategoryEnum } from './boostSkills';

import 'swiper/css/navigation';

const BoostCMSSkillCategoryTypeSwiper: React.FC<{
    activeCategoryType: BoostCMSSKillsCategoryEnum;
    setActiveCategoryType: React.Dispatch<React.SetStateAction<BoostCMSSKillsCategoryEnum>>;
}> = ({ activeCategoryType, setActiveCategoryType }) => {
    const width = useScreenWidth(true);
    const swiperRef = useRef();

    const initialSlideIndex = boostCMSSKillCategories.findIndex(
        category => category.type === BoostCMSSKillsCategoryEnum.Durable
    );

    const [prevEl] = useState<HTMLElement | null>(null);
    const [nextEl] = useState<HTMLElement | null>(null);
    const [activeIndex, setActiveIndex] = useState<any>(null);

    const [hidePrevButton, setHidePrevButton] = useState<boolean>(initialSlideIndex === 0);
    const [hideNextButton, setHideNextButton] = useState<boolean>(false);

    const showNavigation = width > 991;

    return (
        <Swiper
            slidesPerView="auto"
            modules={[Navigation]}
            navigation={{ prevEl, nextEl }}
            spaceBetween={10}
            slidesPerGroupAuto
            className="boost-cms-category-slider"
            onSwiper={swiper => {
                swiperRef.current = swiper;
            }}
            onRealIndexChange={e => {
                setActiveIndex(e.activeIndex);

                if (e.activeIndex > 0) {
                    setHidePrevButton(false);
                } else if (e.activeIndex === 0) {
                    setHidePrevButton(true);
                }

                if (e.isEnd) {
                    setHideNextButton(true);
                } else {
                    setHideNextButton(false);
                }
            }}
            initialSlide={initialSlideIndex}
        >
            {!hidePrevButton && showNavigation && (
                <button
                    className="bg-grayscale-100 py-4 absolute left-0 top-[20%] z-50 px-4 rounded-br-[100px] rounded-tr-[100px] shadow-lg"
                    onClick={() => {
                        swiperRef?.current?.slidePrev();
                    }}
                >
                    <SkinnyArrowLeft className="text-black w-5" />
                </button>
            )}

            {!hideNextButton && showNavigation && (
                <button
                    className="bg-grayscale-100 py-4 absolute right-0 top-[20%] z-50 px-4 rounded-bl-[100px] rounded-tl-[100px] shadow-lg"
                    onClick={() => {
                        swiperRef?.current?.slideNext();
                    }}
                >
                    <SkinnyArrowRight className="text-black w-5" />
                </button>
            )}

            {boostCMSSKillCategories?.map(
                ({ title, IconComponent, type, iconCircleClass }, index) => {
                    const bgColor = type === activeCategoryType ? 'bg-[#9b51e026]' : 'bg-white';

                    return (
                        <SwiperSlide key={index}>
                            <button
                                onClick={() => setActiveCategoryType(type)}
                                className="flex py-2 pt-4"
                            >
                                <div
                                    className={`relative text-black rounded-full pl-[48px] pr-[40px] py-[6px] shadow-3xl text-[20px] border-white border-2 font-notoSans ${bgColor}`}
                                >
                                    <div
                                        className={`flex z-50 items-center justify-center absolute h-[30px] w-[30px] left-[5px] top-[6px] rounded-full ${iconCircleClass}`}
                                    >
                                        <img
                                            src={IconComponent}
                                            className={`h-[25px] text-white`}
                                        />
                                    </div>
                                    {title}
                                </div>
                            </button>
                        </SwiperSlide>
                    );
                }
            )}
        </Swiper>
    );
};

export default BoostCMSSkillCategoryTypeSwiper;
