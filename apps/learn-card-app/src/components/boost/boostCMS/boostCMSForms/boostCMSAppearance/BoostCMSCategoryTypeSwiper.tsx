import React, { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';

import { BoostCategoryOptionsEnum, useScreenWidth } from 'learn-card-base';

import SkinnyArrowLeft from 'learn-card-base/svgs/SkinnyArrowLeft';
import SkinnyArrowRight from 'learn-card-base/svgs/SkinnyArrowRight';

import { BoostUserTypeEnum, boostVCTypeOptions } from '../../../boost-options/boostOptions';

import { useTheme } from '../../../../../theme/hooks/useTheme';

import 'swiper/css/navigation';

const BoostVCTypeSwiper: React.FC<{
    boostUserType: BoostUserTypeEnum;
    activeCategoryType: string;
    setActiveCategoryType: React.Dispatch<React.SetStateAction<string>>;
}> = ({ boostUserType, activeCategoryType, setActiveCategoryType }) => {
    const [error, setError] = useState<string | null>(null);

    const { getThemedCategoryIcons } = useTheme();

    useEffect(() => {
        if (boostUserType === null) {
            setError('boostUserType is null');
        } else if (!boostVCTypeOptions || !boostVCTypeOptions[boostUserType]) {
            setError(`No options found for boostUserType: ${boostUserType}`);
        } else {
            setError(null);
        }
    }, [boostUserType]);

    const width = useScreenWidth(true);
    const swiperRef = useRef<any>();

    const [prevEl] = useState<HTMLElement | null>(null);
    const [nextEl] = useState<HTMLElement | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const [hidePrevButton, setHidePrevButton] = useState<boolean>(false);
    const [hideNextButton, setHideNextButton] = useState<boolean>(false);

    useEffect(() => {
        if (!boostVCTypeOptions || !boostVCTypeOptions[boostUserType]) {
            setError(`No options found for boostUserType: ${boostUserType}`);
        } else {
            setError(null);
        }
    }, [boostUserType]);

    const _boostVCTypeOptions = boostVCTypeOptions?.[boostUserType] || [];

    const initialSlideIndex = React.useMemo(() => {
        return Array.isArray(_boostVCTypeOptions)
            ? _boostVCTypeOptions.findIndex(vcOption => vcOption.type === activeCategoryType)
            : 0;
    }, [_boostVCTypeOptions, activeCategoryType]);

    useEffect(() => {
        setHidePrevButton(initialSlideIndex === 0);
    }, [initialSlideIndex]);

    const showNavigation = width > 991;

    if (error) {
        return <div>Error: {error}</div>;
    }

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

            {_boostVCTypeOptions &&
                _boostVCTypeOptions.map(
                    ({ title, IconComponent, type, iconCircleClass }, index) => {
                        let bgColor = type === activeCategoryType ? `bg-grayscale-100` : 'bg-white';

                        const { Icon, IconWithShape } = getThemedCategoryIcons?.(type);

                        // ! dont show the family category in the boost cms
                        if (
                            type === BoostCategoryOptionsEnum.family ||
                            type === BoostCategoryOptionsEnum.all
                        )
                            return <></>;

                        let icon = null;

                        if (IconWithShape) {
                            icon = <IconWithShape />;
                        } else {
                            icon = <Icon />;
                        }

                        return (
                            <SwiperSlide key={index}>
                                <button
                                    onClick={() => setActiveCategoryType(type)}
                                    className="flex py-2 pt-4 items-cente mb-2"
                                >
                                    <div
                                        className={`relative text-grayscale-900 rounded-full pl-[48px] pr-[40px] py-[6px] shadow-3xl ${bgColor} font-poppins text-xl font-medium border-white border-2`}
                                    >
                                        <div
                                            className={`flex z-50 items-center justify-center h-[30px] w-[30px] left-[5px] absolute rounded-full overflow-hidden`}
                                        >
                                            {icon}
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

export default BoostVCTypeSwiper;
