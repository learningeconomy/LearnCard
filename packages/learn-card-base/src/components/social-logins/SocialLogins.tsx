import React, { useState } from 'react';
import { IonCol, IonRow } from '@ionic/react';

import useSocialLogins from 'learn-card-base/hooks/useSocialLogins';

import PhoneIcon from 'learn-card-base/assets/images/Phone.svg';
import EmailIcon from 'learn-card-base/assets/images/email-circle-icon.svg';
import RightArrow from 'learn-card-base/svgs/RightArrow';
import DownArrow from 'learn-card-base/svgs/DownArrow';

import { LoginTypesEnum } from 'learn-card-base/helpers/loginHelpers';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';

export const SocialLogins: React.FC<{
    branding: BrandingEnum;
    activeLoginType: LoginTypesEnum;
    setActiveLoginType: React.Dispatch<React.SetStateAction<LoginTypesEnum>>;
    extraSocialLogins: {
        id: number;
        src: string;
        alt: string;
        onClick: () => void;
    }[];
}> = ({
    activeLoginType,
    setActiveLoginType,
    branding = BrandingEnum.learncard,
    extraSocialLogins = [],
}) => {
    const socialLogins = useSocialLogins(branding);

    const [showMore, setShowMore] = useState<boolean>(false);

    const handleActiveLoginType = () => {
        if (activeLoginType === LoginTypesEnum.scoutsSSO) {
            setActiveLoginType(LoginTypesEnum.phone);
        }

        if (activeLoginType === LoginTypesEnum.phone) {
            setActiveLoginType(LoginTypesEnum.email);
        } else if (activeLoginType === LoginTypesEnum.email) {
            setActiveLoginType(LoginTypesEnum.phone);
        }
    };

    const activeLoginTypeIcon = activeLoginType === LoginTypesEnum.phone ? EmailIcon : PhoneIcon;

    const _socialLogins = [...socialLogins, ...extraSocialLogins];

    return (
        <IonRow className="w-full flex items-center justify-center social-logins-container">
            <div className="w-full flex items-center justify-center max-w-[740px]">
                <IonCol
                    size="12"
                    className="flex w-full items-center justify-between flex-wrap max-w-[600px] social-logins-btns-container"
                >
                    {_socialLogins.slice(0, 3).map(socialLogin => (
                        <button
                            className="flex items-center justify-center border-solid border-2 border-gray-300 rounded-full px-4 py-2 min-w-[232px] min-h-[54px] overflow-hidden"
                            onClick={socialLogin.onClick}
                            key={socialLogin.id}
                        >
                            <img
                                src={socialLogin.src}
                                key={socialLogin.id}
                                alt={socialLogin.alt}
                                className="w-[22px] h-[22px] rounded-full"
                            />
                            <p className="ml-2">
                                Sign in with{' '}
                                {socialLogin.alt.charAt(0).toUpperCase() + socialLogin.alt.slice(1)}
                            </p>
                        </button>
                    ))}
                    <button
                        className="flex items-center justify-center border-solid border-2 border-gray-300 rounded-full px-4 py-2 min-w-[232px] min-h-[54px]"
                        onClick={handleActiveLoginType}
                    >
                        <img
                            src={activeLoginTypeIcon}
                            alt={`${
                                activeLoginType === LoginTypesEnum.phone ? 'email' : 'phone'
                            } icon`}
                            className="w-[24px] h-[24px]"
                        />
                        <p className="ml-2">
                            Sign in with{' '}
                            {activeLoginType === LoginTypesEnum.phone ? 'Email' : 'SMS'}
                        </p>
                    </button>
                    {_socialLogins.length > 3 && (
                        <div className="w-[75px] h-[50px]">
                            <button
                                className="w-[50px] h-[50px] rounded-full flex items-center justify-center bg-grayscale-100 social-logins-more-btn"
                                onClick={() => setShowMore(!showMore)}
                            >
                                {showMore ? (
                                    <DownArrow className="text-black h-6" />
                                ) : (
                                    <RightArrow className="text-black h-6" />
                                )}
                            </button>
                        </div>
                    )}
                </IonCol>
            </div>
            {showMore && (
                <IonCol size="12" className="flex items-center justify-center">
                    <div className="w-full max-w-[375px] flex items-start justify-start">
                        {_socialLogins.slice(3, 8).map(socialLogin => (
                            <button onClick={socialLogin.onClick} key={socialLogin.id}>
                                <img
                                    src={socialLogin.src}
                                    key={socialLogin.id}
                                    alt={socialLogin.alt}
                                    className="mr-[25px] w-[50px] min-w-[50px] social-logins-btn-icon"
                                />
                            </button>
                        ))}
                    </div>
                </IonCol>
            )}
            <div className="w-[80%] pl-[12px] pr-[12px] flex items-center justify-center flex max-w-[600px]">
                <p className="border-b-[2px] border-solid border-[#EFF0F5] leading-[0.1em] mb-[20px] mt-[24px] w-full text-center">
                    <span className="bg-white py-0 px-[10px]">OR</span>
                </p>
            </div>
        </IonRow>
    );
};

export default SocialLogins;
