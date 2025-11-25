import React from 'react';

import { ProfilePicture } from 'learn-card-base';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';

export const ChatBotTypingIndicator: React.FC = () => (
    <div className="w-full bg-white flex items-center justify-start ion-padding">
        <div className="animate-chat-in flex">
            <div className="relative flex flex-col items-center justify-center rounded-3xl mr-2 w-[40px] h-[40px]">
                <SolidCircleIcon className="absolute top-0 w-[40px] h-[40px]" />
                <BlueMagicWand className="z-50 w-[45px] h-auto" />
            </div>
            <div className="bg-grayscale-100 rounded-[20px] px-[15px] py-[10px] flex items-center">
                <div className="flex space-x-2">
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out]" />
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out] animation-delay-200" />
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out] animation-delay-400" />
                </div>
            </div>
        </div>
    </div>
);

export const UserChatBotTypingIndicator: React.FC = () => (
    <div className="w-full bg-white flex items-center justify-end ion-padding">
        <div className="animate-chat-in flex">
            <div className="bg-cyan-50  rounded-[20px] px-[15px] py-[10px] flex items-center">
                <div className="flex space-x-2">
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out]" />
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out] animation-delay-200" />
                    <span className="w-2 h-2 bg-grayscale-400 rounded-full animate-[typing-dot_1.4s_infinite_ease-in-out] animation-delay-400" />
                </div>
            </div>
            <ProfilePicture
                customContainerClass="ml-2 text-grayscale-900 h-[40px] w-[40px] min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px] mt-[0px] mb-0"
                customImageClass="w-full h-full object-cover"
            />
        </div>
    </div>
);

export default ChatBotTypingIndicator;
