import React, { useState } from 'react';

import useFirebase from '../../../hooks/useFirebase';
import { LoginTypesEnum } from 'learn-card-base';

import EmailForm from '../../../pages/login/forms/EmailForm';
import PhoneForm from '../../../pages/login/forms/PhoneForm';
import PhoneIcon from 'learn-card-base/assets/images/Phone.white.svg';
import AppleIcon from 'learn-card-base/assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';
import EmailIcon from 'learn-card-base/assets/images/email-circle-icon.svg';
import LearnCardAppIcon from '../../../assets/images/lca-icon-v2.png';

type GameLoginProps = {
    handleBackToGame: () => void;
};

export const GameLogin: React.FC<GameLoginProps> = ({ handleBackToGame }) => {
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(LoginTypesEnum.email);
    const { appleLogin, googleLogin } = useFirebase();

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
                formTitleClassNameOverride="font-montserrat text-[14px] font-[500] leading-[24px] text-grayscale-600 uppercase"
                buttonClassName="font-poppins !text-[16px] leading-[28px] tracking-[0.75px] !mt-0"
                suppressRedirect
                customRedirectUrl={window.location.href}
            />
        );
    } else if (activeLoginType === LoginTypesEnum.phone) {
        LoginTypeForm = (
            <PhoneForm
                formTitleOverride="Phone"
                formTitleClassNameOverride="font-montserrat text-[14px] font-[500] leading-[24px] text-grayscale-600 uppercase"
                buttonClassName="font-poppins !text-[16px] leading-[28px] tracking-[0.75px]"
                smallVerificationInput
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
    const notActiveLoginTypeIcon = isPhone ? EmailIcon : PhoneIcon;

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

                <p className="text-grayscale-800 uppercase font-montserrat text-[14px] font-[500] leading-[24px] mr-auto">
                    {isLogin ? 'Login' : 'Sign Up'}
                </p>

                <div className="w-full max-w-[500px]">
                    <div className="w-full flex gap-[20px] border-grayscale-500 border-solid border-b-[1px] border-opacity-30 pb-[30px]">
                        <button
                            className={`flex items-center justify-center bg-primary-default border-solid border-grayscale-100 rounded-full w-[45px] h-[45px] ${isPhone ? 'border-0' : 'border-[1px] '
                                }`}
                            onClick={handleActiveLoginType}
                        >
                            <img
                                src={notActiveLoginTypeIcon}
                                alt={`${isPhone ? 'email' : 'phone'} icon`}
                                className={isPhone ? 'w-full h-full' : 'w-[25px] h-[25px]'}
                            />
                        </button>
                        {socialLogins.map(socialLogin => {
                            const { id, src, onClick, alt } = socialLogin;
                            return (
                                <button
                                    key={id}
                                    className="flex items-center justify-center border-solid border-[1px] border-grayscale-100 rounded-full w-[45px] h-[45px]"
                                    onClick={onClick}
                                >
                                    <img src={src} alt={alt} className="w-[28px] h-[28px]" />
                                </button>
                            );
                        })}
                    </div>

                    {LoginTypeForm}
                </div>

                <div className="py-[10px] w-full">
                    <div className="h-[2px] w-full bg-grayscale-500 opacity-30" />
                </div>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="uppercase w-full font-montserrat text-grayscale-800 font-[500] text-[14px] leading-[24px]"
                >
                    {isLogin ? 'Signup' : 'Login'}
                </button>
            </div>

            <button
                type="button"
                onClick={handleBackToGame}
                className="w-full py-[10px] px-[20px] text-[20px] bg-white rounded-[30px] text-grayscale-800 shadow-box-bottom"
            >
                Back to Game
            </button>
        </div>
    );
};

export default GameLogin;
