import React from 'react';
import { IonRow } from '@ionic/react';

import useSocialLogins, { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';

import { LoginTypesEnum } from 'learn-card-base/helpers/loginHelpers';
import { BrandingEnum } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

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
        <IonRow className="w-full max-w-[600px] px-6 flex items-center justify-center social-logins-container">
            <div className="relative w-full flex items-center justify-center">
                <div className="h-[1px] bg-[#EFF0F5] absolute top-1/2 left-0 right-0" />
                <span className="bg-white py-0 px-[10px] z-10">{m['socialLogins.or']()}</span>
            </div>

            <div className="w-full flex flex-col items-center justify-center max-w-[500px] ion-padding-horizontal">
                <div className="w-full text-left">
                    <p className="font-medium text-sm text-grayscale-600 uppercase mb-4">
                        {m['socialLogins.loginWith']()}
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
