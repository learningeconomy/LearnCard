import React from 'react';
import BlueMagicWandWithCircle from './svgs/BlueMagicWandWithCircle';
import LearnCardIcon from './svgs/LearnCardIcon';
import Web3AuthLogo from './svgs/Web3AuthLogo';
import Notch from './svgs/Notch';
import Logo from './svgs/Logo';
import { BACKEND_URL, DOMAIN } from '../constants/env';

type LoginColumnProps = {};

const LoginColumn: React.FC<LoginColumnProps> = () => {
    const redirectUrl = new URL('/auth/login', BACKEND_URL);

    redirectUrl.searchParams.set('returnTo', new URL('/topics', DOMAIN).toString());

    return (
        <div className="flex flex-col items-center justify-between gap-[40px] grow-1">
            <div className="flex flex-col gap-[10px] items-center">
                <BlueMagicWandWithCircle className="shrink-0" />
                <div className="flex xl:hidden font-poppins text-[22px] font-[600] text-center">
                    <span className="text-indigo-500">AI Sessions</span>
                    <span className="text-grayscale-900">&nbsp;with ChatGPT</span>
                </div>
            </div>

            <div className="flex flex-col rounded-[30px] bg-white overflow-hidden min-w-[305px] max-w-[475px] min-h-fit shrink-0">
                <div className="relative h-[211px] sm:h-[229px]">
                    <div className="flex flex-col gap-[15px] items-center justify-center px-[20px] pt-[40px] pb-[20px] bg-grayscale-10 z-50 relative">
                        <h1 className="flex flex-col font-poppins text-[27px] sm:text-[33px] font-[600] text-center">
                            <span className="text-grayscale-900">Start an</span>
                            <span className="text-indigo-500">AI Learning Session</span>
                        </h1>
                    </div>

                    <div className="absolute flex left-0 bottom-[30px] z-40 w-full">
                        <div className="w-[40%] relative bottom-[5px] bg-grayscale-50-off-white filter-[drop-shadow(0px_1px_4px_rgba(0,_0,_0,_0.25))]" />
                        <div className="relative flex mx-[-5px] z-10">
                            <div className="w-[5px] h-full relative left-[5px] bottom-[5px] bg-grayscale-50-off-white" />
                            <Notch className="z-[-1] shrink-0" />
                            <div className="w-[5px] h-full relative right-[5px] bottom-[5px] bg-grayscale-50-off-white" />
                        </div>
                        <div className="w-[40%] relative bottom-[5px] bg-grayscale-50-off-white filter-[drop-shadow(0px_1px_4px_rgba(0,_0,_0,_0.25))]" />
                    </div>

                    <div className="absolute bottom-[0px] left-0 right-0 z-40">
                        <div className="w-fit mx-auto">
                            <Logo />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-[40px] px-[20px] sm:px-[50px] pb-[50px] pt-[30px]">
                    <span className="text-grayscale-900 text-[18px] font-[600] leading-[24px] tracking-[0.25px] text-center">
                        Earn credentials, track your progress, and continue your learning journey.
                    </span>
                    <a
                        href={redirectUrl.toString()}
                        className="flex items-center justify-center gap-[10px] py-[8px] sm:py-[10px] pl-[8px] sm:pl-[10px] pr-[25px] sm:pr-[30px] border-[1px] border-solid border-grayscale-200 rounded-[30px] hover:bg-grayscale-10 transition-colors"
                    >
                        <LearnCardIcon />
                        <span className="text-[14px] sm:text-[18px] text-grayscale-900 font-[600] leading-[24px] tracking-[0.25px]">
                            Continue with LearnCard
                        </span>
                    </a>
                    <div className="w-full flex flex-col gap-[5px] items-center justify-center">
                        <p className="flex gap-[5px] items-center text-grayscale-600 text-[14px]">
                            Self-custodial login by
                            <Web3AuthLogo />
                        </p>
                        <div className="text-grayscale-600 text-[14px] text-center">
                            Web3Auth does not store any data related to your social logins.
                            <a
                                href="https://web3auth.io/"
                                rel="noreferrer"
                                target="_blank"
                                className="text-indigo-500 font-[700] text-[14px] hover:underline"
                            >
                                {' '}
                                Learn more
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-[10px] items-center px-[30px] py-[20px]">
                <span className="text-grayscale-900 text-[17px] font-[600]">
                    LearnCard •{' '}
                    <a href="https://www.learncard.com/" target="_blank" rel="noreferrer">
                        About
                    </a>
                </span>
                <span className="text-grayscale-900 text-[14px] text-center">
                    <a
                        href="https://www.learncard.com/terms-of-service"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Terms of Service
                    </a>{' '}
                    |{' '}
                    <a
                        href="https://www.learncard.com/privacy-policy"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Privacy Policy
                    </a>{' '}
                    |{' '}
                    <a href="https://www.learncard.com/contact" target="_blank" rel="noreferrer">
                        Contact
                    </a>
                </span>
            </div>
        </div>
    );
};

export default LoginColumn;
