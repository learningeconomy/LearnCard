import React, { useState } from 'react';

import { IonTextarea } from '@ionic/react';
import {
    PersonalizedQuestionEnum,
    PersonalizedQuestionType,
} from './personalizedQuestions.helpers';
import AnimatedPlusToXIcon from './helpers/AnimatedPlusToXIcon';
import PersonalizationInputModal from './helpers/PersonalizationInputModal';

import { ModalTypes, useDeviceTypeByWidth, useModal } from 'learn-card-base';

export const AIPassportPersonalizationAnswerInput: React.FC<{
    question: PersonalizedQuestionType;
    handleSetAnswer: (questionType: PersonalizedQuestionEnum, answer: string) => void;
}> = ({ question, handleSetAnswer }) => {
    const { newModal, closeModal } = useModal({ mobile: ModalTypes.Center });
    const [answer, setAnswer] = useState<string>('');

    const questionType = question?.type;
    const placeholderText = question.inputPlaceholderText;

    const minWidth =
        questionType === PersonalizedQuestionEnum.favFictionalCharacter
            ? '!min-w-[200px]'
            : '!min-w-[150px] w-[150px]';

    const isAnswerEmpty = answer?.length === 0;

    const { isMobile } = useDeviceTypeByWidth();

    const handleCreateAnswer = () => {
        handleSetAnswer(questionType, answer);
        setAnswer('');
    };

    const handleModalAnswer = (modalAnswer: string) => {
        handleSetAnswer(questionType, modalAnswer);
        setAnswer('');
        closeModal();
    };

    const handleInputModal = () => {
        if (isMobile) {
            newModal(
                <PersonalizationInputModal
                    question={question}
                    placeholderText={placeholderText ?? ''}
                    handleCloseModal={closeModal}
                    handleCreateAnswer={handleModalAnswer}
                />,
                {
                    sectionClassName: '!max-w-[80%]',
                }
            );
            return;
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && answer.length > 0) {
            event.preventDefault();
            handleCreateAnswer();
        }
    };

    return (
        <div
            className="flex items-center justify-between rounded-full !py-[5px] px-[16px] font-semibold text-[17px] font-notoSans mt-2 mr-2 bg-grayscale-100 text-grayscale-500"
            onClick={() => {
                if (!isAnswerEmpty) {
                    handleCreateAnswer();
                }
            }}
        >
            {isMobile ? (
                <button
                    type="button"
                    onClick={handleInputModal}
                    className={`
                        ${minWidth}
                        text-left
                        bg-transparent
                        outline-none
                        border-none
                        w-full
                        text-grayscale-500
                        whitespace-nowrap
                        overflow-hidden
                        text-ellipsis
                        pr-2
                    `}
                >
                    {answer || placeholderText}
                </button>
            ) : (
                <IonTextarea
                    value={answer}
                    onIonInput={e => {
                        setAnswer(e.detail.value);
                    }}
                    placeholder={placeholderText}
                    className={`${minWidth} ion-no-padding !mb-0 !min-h-[0]`}
                    autoGrow
                    rows={1}
                    onKeyDown={handleKeyDown}
                />
            )}

            <AnimatedPlusToXIcon
                isPlus
                className="text-grayscale-500 h-[24px] w-auto ml-[10px] flex-shrink-0 !pt-0"
            />
        </div>
    );
};

export default AIPassportPersonalizationAnswerInput;
