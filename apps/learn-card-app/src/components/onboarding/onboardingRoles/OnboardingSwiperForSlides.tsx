import React, { useState } from 'react';
import { IonicSlides } from '@ionic/react';
import { LearnCardRolesEnum, LearnCardRoleType } from '../onboarding.helpers';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, Pagination, Scrollbar, Swiper as SwiperInterface } from 'swiper';
import OnboardingSlide from './OnboardingSlide';
import { getSlideContent, roleSlideContent } from './onboardingSlideContent';

import { useModal, ModalTypes } from 'learn-card-base';
import LaunchPadActionModal from 'apps/learn-card-app/src/pages/launchPad/LaunchPadHeader/LaunchPadActionModal';

import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import '@ionic/react/css/ionic-swiper.css';
import '../../../assets/sass/learncard-page.scss';

type OnboardingSwiperForSlidesProps = {
    roleItem?: LearnCardRoleType | null;
    dob?: string | null;
};

const OnboardingSwiperForSlides: React.FC<OnboardingSwiperForSlidesProps> = ({ roleItem, dob }) => {
    const [slidesRef, setSlidesRef] = useState<SwiperInterface>();
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Freeform,
        mobile: ModalTypes.Freeform,
    });

    const roleType = roleItem?.type ?? LearnCardRolesEnum.learner;
    const slideConfig = roleSlideContent[roleType] ?? roleSlideContent[LearnCardRolesEnum.learner]!;
    const totalSlides = slideConfig.slides.length;

    const pagination = {
        el: '.swiper-pagination',
        clickable: true,
    };

    const handleSlideChange = (swiper: any) => {
        setActiveSlideIndex(swiper.activeIndex);
    };

    const handleNextSlide = () => {
        slidesRef?.slideNext();
    };

    const handleGetStarted = () => {
        closeAllModals();
        setTimeout(() => {
            newModal(<LaunchPadActionModal />, {
                className:
                    'w-full flex items-center justify-center bg-white/70 backdrop-blur-[5px]',
                sectionClassName: '!max-w-[500px] disable-scrollbars',
            });
        }, 500);
    };

    const isLastSlide = activeSlideIndex === totalSlides - 1;
    const currentBgColor = getSlideContent(roleType, activeSlideIndex).bgColor;

    return (
        <div className="relative h-full w-full flex flex-col">
            <div className="flex-1 overflow-hidden">
                <Swiper
                    modules={[Keyboard, Pagination, Scrollbar, IonicSlides, Navigation]}
                    keyboard={true}
                    pagination={pagination}
                    grabCursor={true}
                    scrollbar={true}
                    className={'h-full'}
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
                                    over13Text={content.over13Text}
                                    image={content.image}
                                    imageAlt={content.imageAlt}
                                    roleTitle={roleItem?.title}
                                    dob={dob}
                                />
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            <div className={`w-full flex flex-col items-center p-[10px] ${currentBgColor}`}>
                <button
                    className="border-[1px] border-grayscale-800 border-solid bg-white max-w-[335px] w-full py-[10px] rounded-[40px] text-grayscale-800 font-poppins font-semibold text-[17px] mb-[10px]"
                    onClick={isLastSlide ? handleGetStarted : handleNextSlide}
                >
                    {isLastSlide ? 'Get Started' : 'Next'}
                </button>
                <div className="swiper-pagination onboarding-swiper-pagination"></div>
            </div>
        </div>
    );
};

export default OnboardingSwiperForSlides;
