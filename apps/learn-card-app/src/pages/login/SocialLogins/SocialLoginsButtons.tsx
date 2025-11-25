import React, { useState } from 'react';
import { IonCol, IonRow } from '@ionic/react';

import useSocialLogins from 'learn-card-base/hooks/useSocialLogins';

import PhoneIcon from 'learn-card-base/svgs/PhoneIcon';
import EmailIcon from 'learn-card-base/svgs/EmailIcon';

import { LoginTypesEnum } from 'learn-card-base/helpers/loginHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { SocialLoginTypes } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

export const SocialLoginsButtons: React.FC<{
    branding: BrandingEnum;
    activeLoginType: LoginTypesEnum;
    setActiveLoginType: React.Dispatch<React.SetStateAction<LoginTypesEnum>>;
    extraSocialLogins: {
        id: number;
        src: string;
        alt: string;
        onClick: () => void;
        type: SocialLoginTypes;
    }[];
    showSocialLogins: boolean;
}> = ({
    activeLoginType,
    setActiveLoginType,
    branding = BrandingEnum.learncard,
    extraSocialLogins = [],
    showSocialLogins,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const socialLogins = useSocialLogins(branding);

    const handleActiveLoginType = () => {
        if (activeLoginType === LoginTypesEnum.phone) {
            setActiveLoginType(LoginTypesEnum.email);
        } else if (activeLoginType === LoginTypesEnum.email) {
            setActiveLoginType(LoginTypesEnum.phone);
        }
    };

    const ActiveLoginIcon = activeLoginType === LoginTypesEnum.phone ? EmailIcon : PhoneIcon;
    const activeLoginTypeStyles =
        activeLoginType === LoginTypesEnum.phone ? `bg-${primaryColor}` : 'bg-yellow-500';

    const _socialLogins = [...socialLogins, ...extraSocialLogins];

    return (
        <IonRow className="w-full flex items-center justify-center social-logins-container">
            <div className="w-full flex items-center justify-center">
                <div className="w-full pl-[12px] pr-[12px] items-center justify-center flex flex-col max-w-[500px]">
                    <div className="w-full flex items-center justify-center gap-[20px]">
                        {_socialLogins.map(socialLogin => {
                            const socialLoginStyles =
                                socialLogin.type === SocialLoginTypes.apple
                                    ? 'px-[14px]'
                                    : 'px-[12px]';

                            return (
                                <button
                                    className={`${socialLoginStyles} flex items-center justify-center border-solid border-[1px] border-${primaryColor} bg-white rounded-full  py-1 min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px] overflow-hidden`}
                                    onClick={e => {
                                        socialLogin.onClick();
                                        e.stopPropagation();
                                    }}
                                    key={socialLogin.id}
                                >
                                    <img
                                        src={socialLogin.src}
                                        alt={socialLogin.alt}
                                        className="w-full h-full object-contain "
                                    />
                                </button>
                            );
                        })}
                        <button
                            className={`flex items-center justify-center border-solid border-[1px] border-emerald-800 ${activeLoginTypeStyles} rounded-full min-w-[60px] min-h-[60px] max-w-[60px] max-h-[60px] overflow-hidden`}
                            onClick={e => {
                                e.stopPropagation();
                                handleActiveLoginType();
                            }}
                        >
                            <ActiveLoginIcon className="w-[32px] h-[32px] object-contain" />
                        </button>
                    </div>
                    {showSocialLogins && (
                        <p className="border-b-[1px] border-solid border-[#EFF0F5] leading-[0.1em] w-full text-center my-[40px]">
                            <span className="bg-emerald-700 py-0 px-[10px] text-white">OR</span>
                        </p>
                    )}
                </div>
            </div>
        </IonRow>
    );
};

export default SocialLoginsButtons;
