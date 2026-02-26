import React from 'react';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';

export type OnboardingSlideProps = {
    icon: string;
    iconBgColor: string;
    bgColor: string;
    boldText: string;
    regularText: string;
    over13Text?: string;
    image: string;
    imageAlt: string;
    roleTitle?: string;
    dob?: string | null;
};

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
    icon,
    iconBgColor,
    bgColor,
    boldText,
    regularText,
    over13Text,
    image,
    imageAlt,
    roleTitle,
    dob,
}) => {
    const age = dob ? calculateAge(dob) : Number.NaN;

    return (
        <div
            className={`relative h-full w-full ${bgColor} flex flex-col items-center justify-center`}
        >
            <span
                className="flex shrink-0 items-center justify-center h-[30px] w-[30px] rounded-full mb-[10px]"
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
            <p className="font-poppins text-[17px] text-grayscale-900 mb-[15px] mx-[5px] max-w-[310px] w-full">
                <span className="font-bold">{boldText}</span>{' '}
                {age >= 13 && over13Text ? over13Text : regularText}
            </p>
            <img className="!h-[400px] desktop:!h-[500px]" src={image} alt={imageAlt} />
        </div>
    );
};

export default OnboardingSlide;
