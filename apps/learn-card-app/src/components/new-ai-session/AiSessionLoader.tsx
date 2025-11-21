import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper';

import { IonSpinner } from '@ionic/react';
import Sparkles from '../../assets/images/purple-sparkles.gif';
import LearncardLogo from '../../assets/images/lca-icon-v2.png';

import {
    ChatBotQuestionsEnum,
    ChatBotQA,
} from '../new-ai-session/NewAiSessionChatBot/newAiSessionChatbot.helpers';
import {
    aiPassportApps,
    getAiPassportAppByContractUri,
} from '../ai-passport-apps/aiPassport-apps.helpers';
import { ProfilePicture } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { useModal } from 'learn-card-base';

import useTheme from '../../theme/hooks/useTheme';

// Import styles
import 'swiper/css';
import 'swiper/css/autoplay';

const AiSessionLoader: React.FC<{
    chatBotQA?: ChatBotQA;
    topicRecord?: LCR;
    contractUri?: string;
    overrideText?: string | string[];
    showUserImg?: boolean;
    isInline?: boolean;
    textOnly?: boolean;
    showActionButton?: boolean;
    actionButtonText?: string;
    actionButtonHandler?: () => void;
    containerClassName?: string;
    showCloseButton?: boolean;
    closeButtonHandler?: () => void;
}> = ({
    chatBotQA,
    topicRecord,
    contractUri,
    overrideText,
    showUserImg = false,
    isInline = false,
    textOnly = false,
    showActionButton = false,
    actionButtonText = '',
    actionButtonHandler = () => {},
    containerClassName = '',
    showCloseButton = false,
    closeButtonHandler = () => {},
}) => {
    const { closeModal } = useModal();
    const appSelection = chatBotQA?.find(qa => qa?.type === ChatBotQuestionsEnum.AppSelection);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    let app = null;
    if (appSelection?.answer) {
        app = aiPassportApps.find(app => app.id === Number(appSelection?.answer));
    } else {
        app = getAiPassportAppByContractUri(contractUri || topicRecord?.contractUri || '');
    }

    let text: string | string[] = 'Launching your session...';
    if (overrideText) text = overrideText;

    const containerStyles = isInline
        ? ''
        : 'h-[100vh] w-full flex items-center justify-center absolute top-0 left-0 z-9999 bg-black/50';

    const cardStyles = isInline ? '' : 'shadow-box-bottom';

    const showAnimatedText = Array.isArray(overrideText);

    if (textOnly) {
        return (
            <>
                {showAnimatedText ? (
                    <div className="w-full text-center">
                        <Swiper
                            modules={[Autoplay]}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            loop
                            allowTouchMove={false}
                            slidesPerView={1}
                            className="w-full"
                        >
                            {overrideText?.map((quote, index) => (
                                <SwiperSlide key={index}>
                                    <span className="block font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                                        {quote}
                                    </span>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : (
                    <span className="font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                        {text}
                    </span>
                )}
            </>
        );
    }

    return (
        <div className={`${containerStyles} ${containerClassName}`}>
            <div
                className={`w-full flex flex-col justify-center items-center gap-[60px] bg-white rounded-[24px] px-[30px] pt-[60px] pb-[40px] max-w-[340px] mx-auto min-h-[400px] ${cardStyles}`}
            >
                <div className="relative w-full flex items-center justify-center">
                    {showUserImg ? (
                        <ProfilePicture
                            customContainerClass="text-white h-[70px] w-[70px] min-h-[70px] min-w-[70px] max-h-[70px] max-w-[70px] mt-[0px] mb-0 z-50"
                            customImageClass="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={app?.img ?? LearncardLogo}
                            className="h-[70px] w-[70px] rounded-full object-cover z-50 bg-white border-white border-solid border-[6px] box-content"
                        />
                    )}

                    <img src={Sparkles} className="absolute h-[182px] w-[182px] z-20" />
                    <IonSpinner
                        name="crescent"
                        style={{
                            color: '#6366F1',
                            '--spinner-duration': '6s', // ... this does nothing. Was trying to slow it down
                        }}
                        className="z-[100] absolute h-[94px] w-[94px]"
                    />
                </div>

                {showAnimatedText ? (
                    <div className="w-full text-center">
                        <Swiper
                            modules={[Autoplay]}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            loop
                            allowTouchMove={false}
                            slidesPerView={1}
                            className="w-full"
                        >
                            {overrideText?.map((quote, index) => (
                                <SwiperSlide key={index}>
                                    <span className="block font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                                        {quote}
                                    </span>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ) : (
                    <span className="font-notoSans text-grayscale-900 text-[17px] font-[600] leading-[24px] tracking-[0.25px]">
                        {text}
                    </span>
                )}
            </div>

            {showActionButton && actionButtonHandler && actionButtonText && (
                <div className="flex items-center justify-center px-2 w-full flex-col gap-[12px] mt-2">
                    <button
                        onClick={() => actionButtonHandler()}
                        className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[325px] mr-2`}
                    >
                        {actionButtonText}
                    </button>
                    {showCloseButton && closeButtonHandler && (
                        <button
                            onClick={() => closeButtonHandler()}
                            className="bg-grayscale-100 text-xl text-grayscale-900 flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[325px] mr-2"
                        >
                            Close
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiSessionLoader;
