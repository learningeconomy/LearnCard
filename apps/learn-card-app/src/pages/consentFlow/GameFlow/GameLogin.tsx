import React, { useState } from 'react';

import { ArrowLeft, Mail, Phone } from 'lucide-react';

import useFirebase from '../../../hooks/useFirebase';
import { LoginTypesEnum } from 'learn-card-base';

import EmailForm from '../../../pages/login/forms/EmailForm';
import PhoneForm from '../../../pages/login/forms/PhoneForm';
import AppleIcon from 'learn-card-base/assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';
import LearnCardAppIcon from '../../../assets/images/lca-icon-v2.png';

type GameLoginProps = {
    handleBackToGame: () => void;
};

export const GameLogin: React.FC<GameLoginProps> = ({ handleBackToGame }) => {
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(LoginTypesEnum.email);
    const { appleLogin, googleLogin } = useFirebase();

    const [showSocialLogins, setShowSocialLogins] = useState(true);

    // toggle between whether this is "login" or "sign up"
    //   no functional difference, we just change some text
    const [isLogin, setIsLogin] = useState(true);

    let LoginTypeForm: React.ReactNode | null = null;

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

    if (activeLoginType === LoginTypesEnum.email) {
        LoginTypeForm = (
            <EmailForm
                formTitleOverride="Email"
                buttonTitleOverride="Continue"
                formTitleClassNameOverride="text-grayscale-800 text-base text-center font-medium"
                buttonClassName="font-poppins !text-[16px] leading-[28px] tracking-[0.75px] !mt-0 !bg-emerald-700 hover:opacity-90 active:opacity-85 transition-opacity"
                emailInputClassName="bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-500 tracking-normal"
                verificationCodeInputClassName="gameflow"
                startOverClassNameOverride="text-grayscale-800 underline font-bold"
                resendCodeButtonClassNameOverride="text-grayscale-600 font-bold mt-4 border-b-grayscale-600 border-solid border-b-[1px]"
                suppressRedirect
                customRedirectUrl={window.location.href}
                resetRedirectPath={null}
                smallVerificationInput
                setShowSocialLogins={setShowSocialLogins}
                showSocialLogins={showSocialLogins}
            />
        );
    } else if (activeLoginType === LoginTypesEnum.phone) {
        LoginTypeForm = (
            <PhoneForm
                formTitleOverride="Phone"
                formTitleClassNameOverride="font-montserrat text-[14px] font-[500] leading-[24px] text-grayscale-600 uppercase"
                buttonClassName="font-poppins !text-[16px] leading-[28px] tracking-[0.75px] !bg-emerald-700 hover:opacity-90 active:opacity-85 transition-opacity"
                smallVerificationInput
                phoneInputClassNameOverride="gameflow"
                verificationCodeInputClassName="gameflow"
                startOverClassNameOverride="text-grayscale-800 underline font-bold"
                resendCodeButtonClassNameOverride="text-grayscale-600 font-bold mt-4 border-b-grayscale-600 border-solid border-b-[1px]"
                setShowSocialLogins={setShowSocialLogins}
                showSocialLogins={showSocialLogins}
            />
        );
    }

    const socialLogins = [
        {
            id: 1,
            src: AppleIcon,
            alt: 'apple',
            onClick: appleLogin,
        },
        {
            id: 2,
            src: GoogleIcon,
            alt: 'google',
            onClick: googleLogin,
        },
    ];

    const isPhone = activeLoginType === LoginTypesEnum.phone;

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="w-full flex flex-col gap-[20px] justify-center items-center bg-white rounded-[20px] pt-[40px] pb-[20px] px-[30px] shadow-soft-bottom">
                <img
                    src={LearnCardAppIcon}
                    alt="LearnCard App Icon"
                    className="object-fit h-[50px] w-[50px] rounded-[10px]"
                />

                <h6 className="tracking-[12px] text-xl font-[800] text-grayscale-900 font-notoSans">
                    LEARNCARD
                </h6>

                <p className="text-grayscale-500 font-montserrat text-[14px] font-[500] mr-auto">
                    Login to Learncard
                </p>

                <div className="w-full max-w-[500px]">
                    {showSocialLogins && (
                        <div className="w-full flex gap-[20px] border-grayscale-500  border-opacity-30 pb-[30px]">
                            <button
                                className="flex items-center justify-center bg-grayscale-900 border-solid border-grayscale-100 rounded-full w-[45px] h-[45px]"
                                onClick={handleActiveLoginType}
                                type="button"
                            >
                                {isPhone ? (
                                    <Mail className="w-[22px] h-[22px] text-white" />
                                ) : (
                                    <Phone className="w-[22px] h-[22px] text-white" />
                                )}
                            </button>
                            {socialLogins.map(socialLogin => {
                                const { id, src, onClick, alt } = socialLogin;
                                return (
                                    <button
                                        key={id}
                                        className="flex items-center justify-center border-solid border-[1px] border-grayscale-100 rounded-full w-[45px] h-[45px]"
                                        onClick={onClick}
                                        type="button"
                                    >
                                        <img src={src} alt={alt} className="w-[28px] h-[28px]" />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {LoginTypeForm}
                </div>

                <div className="py-[10px] w-full"></div>
            </div>

            <button
                type="button"
                onClick={handleBackToGame}
                className="w-full py-[12px] px-[20px] text-[16px] bg-white rounded-[30px] text-grayscale-800 shadow-box-bottom flex items-center justify-center gap-[10px]"
            >
                <ArrowLeft className="w-[18px] h-[18px]" />
                Back to Game
            </button>
        </div>
    );
};

export default GameLogin;
