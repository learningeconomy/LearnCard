import React from 'react';
import { IonRow } from '@ionic/react';

import useSocialLogins, { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';

import { LoginTypesEnum } from 'learn-card-base/helpers/loginHelpers';
import { BrandingEnum } from 'learn-card-base';

export const SocialLogins: React.FC<{
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
}> = ({
    activeLoginType,
    setActiveLoginType,
    branding = BrandingEnum.scoutPass,
    extraSocialLogins = [],
}) => {
    const socialLogins = useSocialLogins(branding);

    const _socialLogins = [...socialLogins, ...extraSocialLogins];

    return (
        <IonRow className="w-full flex items-center justify-center social-logins-container">
            <div className="w-[80%] pl-[12px] pr-[12px] flex items-center justify-center max-w-[600px]">
                <p className="border-b-[2px] border-solid border-[#EFF0F5] leading-[0.1em] mb-[20px] mt-[24px] w-full text-center">
                    <span className="bg-white py-0 px-[10px]">OR</span>
                </p>
            </div>

            <div className="w-full flex flex-col items-center justify-center max-w-[500px] ion-padding-horizontal">
                <div className="w-full text-left">
                    <p className="font-medium text-sm text-grayscale-600 uppercase mb-4">
                        Login With
                    </p>
                </div>

                <div className="flex w-full items-center justify-start">
                    {_socialLogins.map(socialLogin => {
                        const iconStyles =
                            socialLogin.type === SocialLoginTypes.apple
                                ? 'w-full h-full'
                                : 'w-[35px] h-[35px]';

                        const buttonStyles =
                            socialLogin.type === SocialLoginTypes.apple
                                ? 'p-0'
                                : 'p-2 border-solid border-2 border-gray-100';

                        return (
                            <button
                                className={`flex items-center justify-center rounded-full overflow-hidden mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] ${buttonStyles}`}
                                onClick={socialLogin.onClick}
                                key={socialLogin.id}
                            >
                                <img
                                    src={socialLogin.src}
                                    key={socialLogin.id}
                                    alt={socialLogin.alt}
                                    className={`rounded-full ${iconStyles}`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </IonRow>
    );
};

export default SocialLogins;
