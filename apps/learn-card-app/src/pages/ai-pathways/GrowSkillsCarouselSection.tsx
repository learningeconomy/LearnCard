import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
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
                            style={{ width: '350px' }}
                        >
                            {renderItem(item, index)}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
};

export default GrowSkillsCarouselSection;
