import React from 'react';
import moment from 'moment';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper';

import StaticStarRating from '../helpers/StaticStarRating';

import { AppStoreAppReview, truncateWithEllipsis } from 'learn-card-base';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

export const AppReviewSlider: React.FC<{ reviews: AppStoreAppReview[] }> = ({ reviews }) => {
    return (
        <div className="w-full relative">
            <Swiper
                modules={[Navigation]}
                spaceBetween={10}
                slidesPerView={1.2} // Shows a full slide and part of the next one
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                // Optionally adjust the slider behavior for larger screens
                breakpoints={{
                    768: {
                        slidesPerView: 1.5,
                    },
                }}
            >
                {reviews?.map((review, index) => {
                    const title = review?.title?.label;
                    const content = review?.content?.label;
                    const date = review?.updated?.label;
                    const formattedDate = moment(date).format('MMM D, YYYY');
                    const authorName = truncateWithEllipsis(review?.author?.name?.label, 10);
                    const authorRating = Number(review?.['im:rating']?.label);

                    return (
                        <SwiperSlide key={index}>
                            <div className="ion-padding border-[1px] border-solid rounded-[20px]">
                                <h2 className="text-grayscale-900 font-semibold font-notoSans text-base line-clamp-1 text-left">
                                    {title}
                                </h2>
                                <div className="mt-1 flex items-center text-left">
                                    <StaticStarRating
                                        rating={authorRating}
                                        color="grayscale-700"
                                        fontSize="16px"
                                    />
                                    <p className="text-xs font-notoSans text-grayscale-600 ml-2">
                                        {formattedDate}, {authorName}
                                    </p>
                                </div>
                                <p className="text-xs font-notoSans text-grayscale-600 mt-2 line-clamp-6 text-left">
                                    {content}
                                </p>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>

            {/* Navigation buttons, hidden on mobile */}
            <div className="hidden md:block">
                <div className="swiper-button-prev absolute top-1/2 left-0 transform -translate-y-1/2 z-10 cursor-pointer" />
                <div className="swiper-button-next absolute top-1/2 right-0 transform -translate-y-1/2 z-10 cursor-pointer" />
            </div>
        </div>
    );
};

export default AppReviewSlider;
