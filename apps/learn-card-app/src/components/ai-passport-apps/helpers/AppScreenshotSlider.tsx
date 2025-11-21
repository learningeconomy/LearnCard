import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const AppScreenshotsSlider: React.FC<{ appScreenshots: string[] }> = ({ appScreenshots }) => {
    return (
        <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={10}
            // Setting slidesPerView > 1 makes the next slide partly visible
            slidesPerView={1.2}
            // Disable navigation by default (for mobile)
            navigation={false}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            loop={true}
            breakpoints={{
                // Enable navigation on screens 768px and wider
                768: {
                    navigation: true,
                },
            }}
        >
            {appScreenshots.map((url, index) => (
                <SwiperSlide key={index}>
                    <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-auto rounded-[20px] mr-2 border-[1px] border-solid"
                    />
                </SwiperSlide>
            ))}
        </Swiper>
    );
};

export default AppScreenshotsSlider;
