import React from 'react';
import { Capacitor } from '@capacitor/core';
import { useDeviceTypeByWidth } from 'learn-card-base';

export type OnboardingSlideProps = {
    icon: string;
    iconBgColor: string;
    bgColor: string;
    boldText: string;
    regularText: string;
    image: string;
    imageAlt: string;
    roleTitle?: string;
    handlePrevSlide: () => void;
    handleNextSlide: () => void;
    isLastSlide?: boolean;
};

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
    icon,
    iconBgColor,
    bgColor,
    boldText,
    regularText,
    image,
    imageAlt,
    roleTitle,
    handleNextSlide,
    isLastSlide,
}) => {
    const isNativePlatform = Capacitor?.isNativePlatform();
    const { isMobile } = useDeviceTypeByWidth();
    return (
        <div
            className={`relative h-full w-full ${bgColor} flex flex-col items-center justify-center`}
        >
            <span
                className="flex shrink-0 items-center justify-center h-[30px] w-[30px] rounded-full my-[10px]"
                style={{ backgroundColor: iconBgColor }}
            >
                <img
                    src={icon}
                    alt={`${roleTitle ?? 'Role'} icon`}
                    className="object-contain"
                    style={{
                        height: '22px',
                        width: '22px',
                        flexShrink: 0,
                    }}
                />
            </span>
            <p className="font-poppins text-[17px] text-grayscale-900 mb-[10px]">
                <span className="font-semibold">{boldText}</span> {regularText}
            </p>
            <img className="mb-[20px]" src={image} alt={imageAlt} />
            {!isNativePlatform && !isMobile && (
                <button
                    className="mt-[20px] border-[1px] border-grayscale-800 border-solid bg-white w-[335px] py-[10px] rounded-[40px] text-grayscale-800 font-poppins font-semibold text-[17px]"
                    onClick={handleNextSlide}
                >
                    {isLastSlide ? 'Get Started' : 'Next'}
                </button>
            )}
            {isNativePlatform && (
                <section className="absolute bottom-[50px]">
                    <p className={`font-montserrat px-[15px] py-[8px] text-grayscale-900`}>
                        Swipe to continue
                    </p>
                </section>
            )}
        </div>
    );
};

export default OnboardingSlide;
