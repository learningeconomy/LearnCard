import React from 'react';

import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';

import { BrandingEnum } from 'learn-card-base';

const OnboardingHeader: React.FC<{ text: string; hideTitle?: boolean }> = ({ text, hideTitle }) => {
    return (
        <div className="flex flex-col gap-[20px]">
            {!hideTitle && (
                <div className="flex w-full items-center justify-center">
                    <h6
                        className={`font-poppins select-none text-xl font-medium tracking-wider text-center text-black`}
                    >
                        <span className="font-poppins font-normal text-center text-grayscale-900 text-[24px] tracking-[0.75px]">
                            Welcome to
                        </span>
                        <br />
                        <HeaderBranding
                            branding={BrandingEnum.learncard}
                            className="!text-grayscale-900 !text-2xl"
                            disableClick
                        />
                    </h6>
                </div>
            )}
            <div
                className={`flex w-full items-center justify-center text-center mt-[-4px] ${
                    hideTitle ? 'mb-4' : ''
                }`}
            >
                <h1 className="text-center text-[18px] font-normal text-grayscale-600 font-poppins leading-[34px] tracking-[0.75px]">
                    {text}
                </h1>
            </div>
        </div>
    );
};

export default OnboardingHeader;
