import React, { useState } from 'react';
import { IonContent, IonPage, IonicSlides, IonSpinner } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, Pagination, Scrollbar, Swiper as SwiperInterface } from 'swiper';
import { Capacitor } from '@capacitor/core';

import { useTheme } from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors/index';

import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';

import SlimCaretRight from '../svgs/SlimCaretRight';
import './IntroSlides.scss';
import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import '@ionic/react/css/ionic-swiper.css';

const IntroSlides: React.FC = () => {
    const { getColorSet } = useTheme();
    const {
        firstSlideBackground,
        secondSlideBackground,
        thirdSlideBackground,
        pagination: paginationColors,
    } = getColorSet(ColorSetEnum.introSlides);

    // ref storing swiper instance
    const [slidesRef, setSlidesRef] = useState<SwiperInterface>();
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const paginationStyles = `
        .intro-slides-pagination .swiper-pagination-bullet {
            background-color: ${paginationColors.secondary};
            opacity: 0.5;
        }
        .intro-slides-pagination .swiper-pagination-bullet-active {
            background-color: ${
                activeSlideIndex === 0 || activeSlideIndex === 3
                    ? 'white'
                    : paginationColors.primary
            } !important;
            opacity: 1;
        }
        .intro-slides-pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
        }
    `;

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

    const isNativePlatform = Capacitor?.isNativePlatform();

    return (
        <>
            <style>{paginationStyles}</style>
            <IonPage>
                <IonContent fullscreen>
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
                            <SwiperSlide className={`bg-${firstSlideBackground}`}>
                                <LearnCardSlide1
                                    handlePrevSlide={handlePrevSlide}
                                    handleNextSlide={handleNextSlide}
                                    showDesktopNav={!isNativePlatform}
                                />
                            </SwiperSlide>
                            <SwiperSlide className={`bg-${secondSlideBackground}`}>
                                <LearnCardSlide2
                                    handlePrevSlide={handlePrevSlide}
                                    handleNextSlide={handleNextSlide}
                                    showDesktopNav={!isNativePlatform}
                                />
                            </SwiperSlide>
                            <SwiperSlide className={`bg-${thirdSlideBackground}`}>
                                <LearnCardSlide3
                                    handlePrevSlide={handlePrevSlide}
                                    handleNextSlide={handleNextSlide}
                                    showDesktopNav={!isNativePlatform}
                                />
                            </SwiperSlide>
                            <SwiperSlide className={`bg-${firstSlideBackground}`}>
                                <LearnCardSlide4
                                    handlePrevSlide={handlePrevSlide}
                                    handleNextSlide={handleNextSlide}
                                    showDesktopNav={!isNativePlatform}
                                />
                            </SwiperSlide>
                        </Swiper>
                    </div>
                    <div className="swiper-pagination intro-slides-pagination"></div>
                </IonContent>
            </IonPage>
        </>
    );
};

export default IntroSlides;

type LearnCardSlideProps = {
    handlePrevSlide: () => void;
    handleNextSlide: () => void;
    showDesktopNav?: boolean;
};

type LearnCardDesktopNavProps = {
    handlePrevSlide: () => void;
    handleNextSlide: () => void;
    disablePrev?: boolean;
    disableNext?: boolean;
};

const LearnCardSlideDesktopNav: React.FC<LearnCardDesktopNavProps> = ({
    handlePrevSlide,
    handleNextSlide,
    disablePrev,
    disableNext,
}) => {
    const prevButtonStateClass = disablePrev ? 'opacity-30' : 'opacity-100';
    const nextButtonStateClass = disableNext ? 'opacity-30' : 'opacity-100';

    return (
        <>
            <button
                className="bg-white rounded-l-full px-[10px] py-[5px]"
                onClick={() => handlePrevSlide()}
            >
                <SlimCaretRight className={`${prevButtonStateClass} rotate-180`} />
            </button>
            <button
                className="bg-white rounded-r-full px-[10px] py-[5px]"
                onClick={() => handleNextSlide()}
            >
                <SlimCaretRight className={nextButtonStateClass} />
            </button>
        </>
    );
};

const LearnCardSlide1: React.FC<LearnCardSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    const { getColorSet } = useTheme();
    const { textColors } = getColorSet(ColorSetEnum.introSlides);

    return (
        <>
            <section className="base-gradient flex flex-col items-center justify-center">
                <img src={LearnCardTextLogo} alt="LearnCard text logo" className="mt-4" />
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <LearnCardSlideDesktopNav
                        disablePrev
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p
                        className={`font-montserrat px-[15px] py-[8px] text-${textColors.secondary}`}
                    >
                        Swipe to continue
                    </p>
                )}
            </section>
        </>
    );
};

const LearnCardSlide2: React.FC<LearnCardSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    const { getColorSet } = useTheme();
    const { textColors } = getColorSet(ColorSetEnum.introSlides);

    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center blue-gradient">
                <h1
                    className={`text-3xl font-normal font-poppins mt-[10px] px-[10px] text-${textColors.primary}`}
                >
                    Earn & Send Boosts
                </h1>
                <p
                    className={`text-small font-montserrat mt-[15px] px-[20px] text-${textColors.primary}`}
                >
                    Boosts help to recognize skills, talents, participation and contributions.
                </p>
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <LearnCardSlideDesktopNav
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p className={`font-montserrat px-[15px] py-[8px] text-${textColors.primary}`}>
                        Swipe to continue
                    </p>
                )}
            </section>
        </>
    );
};

const LearnCardSlide3: React.FC<LearnCardSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    const { getColorSet } = useTheme();
    const { textColors } = getColorSet(ColorSetEnum.introSlides);

    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center green-gradient">
                <h1
                    className={`text-3xl font-normal font-poppins mt-[10px] text-${textColors.primary}`}
                >
                    You Own Your LearnCard
                </h1>
                <p
                    className={`text-small font-montserrat mt-[15px] px-[20px] text-${textColors.primary}`}
                >
                    LearnCard is your lifelong learning and work portfolio. You own your data and
                    decide how to share it.
                </p>
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <LearnCardSlideDesktopNav
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p className={`font-montserrat px-[15px] py-[8px] text-${textColors.primary}`}>
                        Swipe to continue
                    </p>
                )}
            </section>
        </>
    );
};

const LearnCardSlide4: React.FC<LearnCardSlideProps> = ({ handleNextSlide, handlePrevSlide }) => {
    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center base-gradient">
                <img src={LearnCardTextLogo} alt="LearnCard text logo" className="mt-4" />
                <IonSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
            </section>
        </>
    );
};
