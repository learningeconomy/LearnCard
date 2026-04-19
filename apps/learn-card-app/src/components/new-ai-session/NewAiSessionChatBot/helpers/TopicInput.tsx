import React, { useState } from 'react';

import { ArrowUp } from 'lucide-react';

import { isPlatformIOS, ProfilePicture, useDeviceTypeByWidth, useKeyboardHeight } from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';
import { ChatBotQuestionsEnum } from '../newAiSessionChatbot.helpers';

export const TopicInput: React.FC<{
    handleChatBotAnswer: (
        question: ChatBotQuestionsEnum,
        answer: string,
        currentIndex: number
    ) => void;
    index: number;
}> = ({ handleChatBotAnswer, index }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { isDesktop } = useDeviceTypeByWidth();
    const kbHeight = useKeyboardHeight(80);

    const [topic, setTopic] = useState<string>('');

    const isEmpty = topic.trim().length === 0;

    const styles = isPlatformIOS() ? {} : { marginBottom: kbHeight };

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                if (isEmpty) return;
                handleChatBotAnswer(ChatBotQuestionsEnum.TopicSelection, topic, index);
            }}
            style={styles}
            className={`w-full flex items-end gap-[10px] fade-enter px-[15px] py-[12px] pb-[calc(12px+env(safe-area-inset-bottom))] ${
                isDesktop ? 'bg-white rounded-[20px] shadow-box-bottom mt-4' : 'bg-grayscale-50'
            }`}
        >
            <div className="flex-shrink-0 pb-[6px]">
                <ProfilePicture
                    customContainerClass="h-[40px] w-[40px] min-h-[40px] min-w-[40px]"
                    customImageClass="w-full h-full object-cover rounded-full"
                />
            </div>
            <div className="flex-1 flex rounded-[15px] overflow-hidden items-center border-[1px] border-grayscale-200 border-solid bg-white">
                <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="flex-1 bg-white text-grayscale-900 placeholder-grayscale-600 text-[17px] font-poppins px-[15px] py-[12px] focus:outline-none"
                    placeholder="Something else..."
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={isEmpty}
                    className={`mr-[6px] p-[7px] sm:p-[10px] rounded-full disabled:opacity-50 disabled:hover:cursor-not-allowed hover:cursor-pointer ${
                        isEmpty ? 'bg-grayscale-400' : `bg-${primaryColor}`
                    }`}
                >
                    <ArrowUp className="text-white w-[20px] h-[20px]" />
                </button>
            </div>
        </form>
    );
};

export default TopicInput;
