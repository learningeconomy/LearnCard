import React, { useState } from 'react';

import { IonInput } from '@ionic/react';
import PaperPlane from 'learn-card-base/svgs/PaperPlane';
import { ChatBotQuestionsEnum } from '../newAiSessionChatbot.helpers';

import { isPlatformIOS, useDeviceTypeByWidth, useKeyboardHeight } from 'learn-card-base';

import useTheme from '../../../../theme/hooks/useTheme';

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

    const [topic, setTopic] = useState<string | null | undefined>('');

    const isEmpty = (topic?.length ?? 0) === 0;

    const styles = isPlatformIOS() ? {} : { marginBottom: kbHeight };

    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                handleChatBotAnswer(ChatBotQuestionsEnum.TopicSelection, topic ?? '', index);
            }}
            style={styles}
            className={`w-full ion-padding flex fade-enter ${
                isDesktop ? 'bg-white rounded-[20px] shadow-box-bottom mt-4' : 'bg-cyan-50'
            }`}
        >
            <IonInput
                onIonInput={e => setTopic(e.detail.value)}
                className={`bg-white text-grayscale-800 flex-1 w-full rounded-[16px] !px-4 ${
                    isDesktop ? '' : 'border-solid border-[1px] border-grayscale-200'
                } `}
                placeholder="Topics or interests... "
            />
            <button
                className={` p-2 rounded-[16px] flex items-center justify-center ml-2 min-h-[44px] min-w-[44px] ${
                    isEmpty ? 'bg-grayscale-300' : `bg-${primaryColor}`
                }`}
                disabled={!topic}
                type="submit"
            >
                <PaperPlane className="text-white" />
            </button>
        </form>
    );
};

export default TopicInput;
