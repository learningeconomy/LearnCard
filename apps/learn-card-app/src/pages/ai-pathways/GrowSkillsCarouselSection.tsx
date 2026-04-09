import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';

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
    const swiperRef = useRef<any>(null);
    const [atBeginning, setAtBeginning] = useState(true);
    const [atEnd, setAtEnd] = useState(false);

    const handleSwiperUpdate = (swiper: any) => {
        setAtBeginning(swiper.isBeginning);
        setAtEnd(swiper.isEnd);
    };

    useEffect(() => {
        if (!swiperRef.current) return;

        swiperRef.current.update();
        handleSwiperUpdate(swiperRef.current);
    }, [carouselItems.length]);

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
                    preventClicks={false}
                    preventClicksPropagation={false}
                    style={{ overflow: 'visible' }}
                >
                    {carouselItems.map((item, index) => (
                        <SwiperSlide
                            key={getItemKey?.(item, index) ?? index}
                            className={slideClassName}
                        >
                            {renderItem(item, index)}
                        </SwiperSlide>
                    ))}
                </Swiper>

                {!atBeginning && (
                    <button
                        type="button"
                        onClick={() => swiperRef.current?.slidePrev()}
                        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-50 shadow-md hover:bg-grayscale-100 transition-all duration-200"
                        style={{ opacity: 0.8 }}
                    >
                        <SlimCaretLeft className="w-5 h-auto" />
                    </button>
                )}

                {!atEnd && (
                    <button
                        type="button"
                        onClick={() => swiperRef.current?.slideNext()}
                        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white text-grayscale-900 p-2 rounded-full z-50 shadow-md hover:bg-grayscale-100 transition-all duration-200"
                        style={{ opacity: 0.8 }}
                    >
                        <SlimCaretRight className="w-5 h-auto" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GrowSkillsCarouselSection;
