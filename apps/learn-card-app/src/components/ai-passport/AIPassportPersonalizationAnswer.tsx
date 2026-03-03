import React from 'react';

import {
    PersonalizedQuestionEnum,
    PersonalizedQuestionType,
} from './personalizedQuestions.helpers';
import AnimatedPlusToXIcon from './helpers/AnimatedPlusToXIcon';

export const AIPassportPersonalizationAnswer: React.FC<{
    question: PersonalizedQuestionType;
    answer: string;
    answers: string[];
    handleSetAnswer?: (questionType: PersonalizedQuestionEnum, answer: string) => void;
    handleRemoveAnswer?: (questionType: PersonalizedQuestionEnum, answer: string) => void;
}> = ({ question, answer, answers, handleSetAnswer, handleRemoveAnswer }) => {
    const questionType = question?.type;

    const isPredefinedAnswer = question.predefinedAnswers.includes(answer);
    const answerExists = answers.includes(answer);

    const buttonStyles = answerExists
        ? `bg-cyan-50 text-grayscale-900`
        : `bg-grayscale-100 text-grayscale-500`;

    if (isPredefinedAnswer) {
        return (
            <button
                onClick={() => {
                    if (answerExists) {
                        handleRemoveAnswer?.(questionType, answer);
                    } else {
                        handleSetAnswer?.(questionType, answer);
                    }
                }}
                className={`text-left flex items-center justify-between rounded-full py-[5px] px-[16px] font-semibold text-[17px] font-notoSans mt-2 mr-2 ${buttonStyles}`}
            >
                {answer}
                <AnimatedPlusToXIcon
                    isPlus={!answerExists}
                    className="text-grayscale-500 h-[24px] w-auto ml-[10px]"
                />
            </button>
        );
    }

    return (
        <button
            onClick={() => {
                handleRemoveAnswer?.(questionType, answer);
            }}
            className="flex items-center justify-between rounded-full py-[5px] px-[16px] font-semibold text-[17px] font-notoSans mt-2 mr-2 bg-cyan-50 text-grayscale-900"
        >
            {answer}
            <AnimatedPlusToXIcon
                isPlus={false}
                className="text-grayscale-500 h-[24px] w-auto ml-[10px]"
            />
        </button>
    );
};

export default AIPassportPersonalizationAnswer;
