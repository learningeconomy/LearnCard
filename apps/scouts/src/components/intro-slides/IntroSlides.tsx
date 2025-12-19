import React, { useState } from 'react';
import { IonContent, IonPage, IonicSlides, IonSpinner } from '@ionic/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, Pagination, Scrollbar, Swiper as SwiperInterface } from 'swiper';
import { Capacitor } from '@capacitor/core';

import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import ScoutsPledge from 'learn-card-base/svgs/ScoutsPledge';
import ScoutsGlobe from 'learn-card-base/svgs/ScoutsGlobe';
import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';
import SlimCaretRight from '../svgs/SlimCaretRight';

import 'swiper/css';
import 'swiper/css/keyboard';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import '@ionic/react/css/ionic-swiper.css';

const IntroSlides: React.FC = () => {
    // ref storing swiper instance
    const [slidesRef, setSlidesRef] = useState<SwiperInterface>();

    const pagination = {
        clickable: true,
        renderBullet: function (index: number, className: string) {
            return '<span class="' + className + '"></span>';
        },
    };

    const slideReachEnd = () => {
        slidesRef?.disable();
        setTimeout(() => {
            firstStartupStore.set.introSlidesCompleted(true);
        }, 1500);
    };

    const handlePrevSlide = () => {
        slidesRef?.slidePrev();
    };

    const handleNextSlide = () => {
        slidesRef?.slideNext();
    };

    const isNativePlatform = Capacitor?.isNativePlatform();

    return (
        <IonPage>
            <IonContent fullscreen>
                <Swiper
                    modules={[Keyboard, Pagination, Scrollbar, IonicSlides, Navigation]}
                    keyboard={true}
                    pagination={pagination}
                    grabCursor={true}
                    scrollbar={true}
                    className={'h-full'}
                    onReachEnd={() => slideReachEnd()}
                    onSwiper={swiper => setSlidesRef(swiper)}
                >
                    <SwiperSlide className="bg-sp-purple-base">
                        <ScoutSlide1
                            handlePrevSlide={handlePrevSlide}
                            handleNextSlide={handleNextSlide}
                            showDesktopNav={!isNativePlatform}
                        />
                    </SwiperSlide>
                    <SwiperSlide className="bg-sp-blue-light">
                        <ScoutSlide2
                            handlePrevSlide={handlePrevSlide}
                            handleNextSlide={handleNextSlide}
                            showDesktopNav={!isNativePlatform}
                        />
                    </SwiperSlide>
                    <SwiperSlide className="bg-sp-green-base">
                        <ScoutSlide3
                            handlePrevSlide={handlePrevSlide}
                            handleNextSlide={handleNextSlide}
                            showDesktopNav={!isNativePlatform}
                        />
                    </SwiperSlide>
                    <SwiperSlide className="bg-sp-purple-base">
                        <ScoutSlide4
                            handlePrevSlide={handlePrevSlide}
                            handleNextSlide={handleNextSlide}
                            showDesktopNav={!isNativePlatform}
                        />
                    </SwiperSlide>
                </Swiper>
            </IonContent>
        </IonPage>
    );
};

export default IntroSlides;

type ScoutSlideProps = {
    handlePrevSlide: () => void;
    handleNextSlide: () => void;
    showDesktopNav?: boolean;
};

type ScoutSlideDesktopNavProps = {
    handlePrevSlide: () => void;
    handleNextSlide: () => void;
    disablePrev?: boolean;
    disableNext?: boolean;
};

const ScoutSlideDesktopNav: React.FC<ScoutSlideDesktopNavProps> = ({
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

const ScoutSlide1: React.FC<ScoutSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    return (
        <>
            <section className="base-gradient flex flex-col items-center justify-center">
                <img src={ScoutPassLogo} alt="ScoutPass logo" className="!w-[55px]" />
                <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <ScoutSlideDesktopNav
                        disablePrev
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p className="text-white  font-rubik px-[15px] py-[8px]">
                        Swipe right to Continue
                    </p>
                )}
            </section>
        </>
    );
};

const ScoutSlide2: React.FC<ScoutSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center blue-gradient">
                <ScoutsPledge className="ml-[5px] h-[70px] w-[70px] text-white" />
                <h1 className="text-2xl text-white font-normal font-rubik mt-[10px]">
                    Earn & Send Badges
                </h1>
                <p className="text-small text-white font-rubik mt-[15px] px-[20px]">
                    Badges help to recognize values, talents, participation and contributions.
                </p>
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <ScoutSlideDesktopNav
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p className="text-white  font-rubik px-[15px] py-[8px]">
                        Swipe right to Continue
                    </p>
                )}
            </section>
        </>
    );
};

const ScoutSlide3: React.FC<ScoutSlideProps> = ({
    handleNextSlide,
    handlePrevSlide,
    showDesktopNav,
}) => {
    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center green-gradient">
                <ScoutsGlobe className="ml-[5px] h-[70px] w-[70px] text-white" />
                <h1 className="text-2xl text-white font-normal font-rubik mt-[10px]">
                    Organize into Troops
                </h1>
                <p className="text-small text-white font-rubik mt-[15px] px-[20px]">
                    Soon local troops can self organize and issue official scout badges.
                </p>
            </section>
            <section className="absolute bottom-[50px]">
                {showDesktopNav && (
                    <ScoutSlideDesktopNav
                        handleNextSlide={handleNextSlide}
                        handlePrevSlide={handlePrevSlide}
                    />
                )}
                {!showDesktopNav && (
                    <p className="text-white  font-rubik px-[15px] py-[8px]">
                        Swipe right to Continue
                    </p>
                )}
            </section>
        </>
    );
};

const ScoutSlide4: React.FC<ScoutSlideProps> = ({ handleNextSlide, handlePrevSlide }) => {
    return (
        <>
            <section className="font-medium font-rubik flex flex-col items-center justify-center base-gradient">
                <img src={ScoutPassLogo} alt="ScoutPass logo" className="!w-[55px]" />
                <img src={ScoutPassTextLogo} alt="ScoutPass text logo" className="mt-4" />
                <IonSpinner name="crescent" color="light" className="scale-[1.75] mt-8" />
            </section>
        </>
    );
};
