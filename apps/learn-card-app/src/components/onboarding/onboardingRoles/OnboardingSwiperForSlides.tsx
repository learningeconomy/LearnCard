import React, { useState } from 'react';
import { IonicSlides } from '@ionic/react';
import { LearnCardRolesEnum, LearnCardRoleType } from '../onboarding.helpers';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, Pagination, Scrollbar, Swiper as SwiperInterface } from 'swiper';
import OnboardingSlide from './OnboardingSlide';
import { getSlideContent, roleSlideContent } from './onboardingSlideContent';

import firstStartupStore from 'learn-card-base/stores/firstStartupStore';

import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import '@ionic/react/css/ionic-swiper.css';
import '../../../assets/sass/learncard-page.scss';

type OnboardingSwiperForSlidesProps = {
    roleItem?: LearnCardRoleType | null;
};

const OnboardingSwiperForSlides: React.FC<OnboardingSwiperForSlidesProps> = ({ roleItem }) => {
    const [slidesRef, setSlidesRef] = useState<SwiperInterface>();
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const roleType = roleItem?.type ?? LearnCardRolesEnum.learner;
    const slideConfig = roleSlideContent[roleType] ?? roleSlideContent[LearnCardRolesEnum.learner]!;
    const totalSlides = slideConfig.slides.length;

    const pagination = {
        el: '.swiper-pagination',
        clickable: true,
    };

    const slideReachEnd = () => {
        slidesRef?.disable();
        setTimeout(() => {
            firstStartupStore.set.introSlidesCompleted(true);
        }, 1500);
    };

    const handleSlideChange = (swiper: any) => {
        setActiveSlideIndex(swiper.activeIndex);
    };

    const handlePrevSlide = () => {
        slidesRef?.slidePrev();
    };

    const handleNextSlide = () => {
        slidesRef?.slideNext();
    };

    return (
        <>
            <div style={{ position: 'relative', height: '100%' }}>
                <Swiper
                    modules={[Keyboard, Pagination, Scrollbar, IonicSlides, Navigation]}
                    keyboard={true}
                    pagination={pagination}
                    grabCursor={true}
                    scrollbar={true}
                    className={'h-full'}
                    onReachEnd={() => slideReachEnd()}
                    onSwiper={swiper => setSlidesRef(swiper)}
                    onSlideChange={handleSlideChange}
                >
                    {slideConfig.slides.map((slide, index) => {
                        const content = getSlideContent(roleType, index);
                        return (
                            <SwiperSlide key={index}>
                                <OnboardingSlide
                                    icon={content.icon}
                                    iconBgColor={content.iconBgColor}
                                    bgColor={content.bgColor}
                                    boldText={content.boldText}
                                    regularText={content.regularText}
                                    image={content.image}
                                    imageAlt={content.imageAlt}
                                    roleTitle={roleItem?.title}
                                    handlePrevSlide={handlePrevSlide}
                                    handleNextSlide={handleNextSlide}
                                    isLastSlide={index === totalSlides - 1}
                                />
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>
            <div className="swiper-pagination onboarding-swiper-pagination"></div>
        </>
    );
};

export default OnboardingSwiperForSlides;
