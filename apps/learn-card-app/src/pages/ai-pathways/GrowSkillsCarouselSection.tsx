import React, { ReactNode, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';

import { useScreenWidth } from 'learn-card-base';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';

import 'swiper/css';

type GrowSkillsCarouselSectionProps<T> = {
    title: ReactNode;
    items?: T[];
    renderItem: (item: T, index: number) => ReactNode;
    getItemKey?: (item: T, index: number) => React.Key;
    onViewAll?: () => void;
    viewAllLabel?: string;
    className?: string;
    slideClassName?: string;
};

const GrowSkillsCarouselSection = <T,>({
    title,
    items,
    renderItem,
    getItemKey,
    onViewAll,
    viewAllLabel = 'View All',
    className = '',
    slideClassName = 'flex !h-auto overflow-visible',
}: GrowSkillsCarouselSectionProps<T>) => {
    const carouselItems = items ?? [];

    const width = useScreenWidth(true);
    const swiperRef = useRef<SwiperInstance | null>(null);
    const [atBeginning, setAtBeginning] = useState<boolean>(true);
    const [atEnd, setAtEnd] = useState<boolean>(false);

    const showNavigation = width > 991;

    const handleSwiperUpdate = (swiper: SwiperInstance) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    const handleSwiperInit = (swiper: SwiperInstance) => {
        swiperRef.current = swiper;
        // 'auto'-width slides aren't measured yet on first render, so isEnd can be
        // wrong here — recompute after layout settles.
        requestAnimationFrame(() => {
            swiper.update();
            handleSwiperUpdate(swiper);
        });
    };

    if (carouselItems.length === 0) return null;

    return (
        <div className={`flex flex-col items-center gap-[10px] ${className}`.trim()}>
            <div className="flex gap-[5px] w-full">
                <span className="text-[14px] font-poppins text-grayscale-800 font-bold leading-[130%]">
                    {title}
                </span>
                {onViewAll && (
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="text-[14px] font-poppins text-indigo-500 font-bold leading-[130%] ml-auto transition-colors hover:text-grayscale-900"
                    >
                        {viewAllLabel}
                    </button>
                )}
            </div>

            <div className="relative w-full overflow-visible">
                <Swiper
                    onSwiper={handleSwiperInit}
                    onResize={handleSwiperUpdate}
                    onSlideChange={handleSwiperUpdate}
                    onReachBeginning={() => setAtBeginning(true)}
                    onReachEnd={() => setAtEnd(true)}
                    onFromEdge={() => {
                        if (swiperRef.current) {
                            setAtBeginning(swiperRef.current.isBeginning);
                            setAtEnd(swiperRef.current.isEnd);
                        }
                    }}
                    spaceBetween={12}
                    slidesPerView={'auto'}
                    grabCursor={true}
                    preventClicks={true}
                    preventClicksPropagation={true}
                    slidesPerGroupAuto
                    style={{ overflow: 'visible' }}
                >
                    {carouselItems.map((item, index) => (
                        <SwiperSlide
                            key={getItemKey?.(item, index) ?? index}
                            className={slideClassName}
                            style={{ width: '350px' }}
                        >
                            {renderItem(item, index)}
                        </SwiperSlide>
                    ))}
                </Swiper>

                {showNavigation && !atBeginning && (
                    <button
                        type="button"
                        aria-label="Previous"
                        className="absolute top-1/2 left-0 -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-[1101] shadow-md hover:bg-grayscale-100 transition-all duration-200"
                        style={{ opacity: 0.85 }}
                        onClick={() => swiperRef.current?.slidePrev()}
                    >
                        <SlimCaretLeft className="w-5 h-auto" />
                    </button>
                )}

                {showNavigation && !atEnd && (
                    <button
                        type="button"
                        aria-label="Next"
                        className="absolute top-1/2 right-0 -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-[1101] shadow-md hover:bg-grayscale-100 transition-all duration-200"
                        style={{ opacity: 0.85 }}
                        onClick={() => swiperRef.current?.slideNext()}
                    >
                        <SlimCaretRight className="w-5 h-auto" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GrowSkillsCarouselSection;
