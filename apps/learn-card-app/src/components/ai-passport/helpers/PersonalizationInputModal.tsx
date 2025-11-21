import React, { useState } from 'react';

import { IonInput } from '@ionic/react';
import FormatQuestionTitle from '../helpers/FormatQuestionTitle';

import { PersonalizedQuestionType } from '../personalizedQuestions.helpers';
import { PERSONALIZED_QUESTION_EMPHASIS_MAP } from '../personalizedQuestions.helpers';

import { useTheme } from '../../../theme/hooks/useTheme';

export const PersonalizationInputModal: React.FC<{
    question: PersonalizedQuestionType;
    placeholderText: string;
    handleCloseModal: () => void;
    handleCreateAnswer: (answer: string) => void;
}> = ({ question, placeholderText, handleCloseModal, handleCreateAnswer }) => {
    const [answer, setAnswer] = useState<string>('');

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <div className="w-full flex flex-col items-center justify-center relative text-grayscale-900 p-2">
            <p className="text-left text-grayscale-900 text-[17px] font-notoSans w-full mb-2">
                <FormatQuestionTitle
                    title={question.title}
                    phraseToEmphasize={PERSONALIZED_QUESTION_EMPHASIS_MAP?.[question.type]}
                />
            </p>
            <IonInput
                className="bg-grayscale-100 text-grayscale-900 font-poppins w-full !pb-[20px] rounded-[15px] text-[15px] !px-[15px]"
                placeholder={placeholderText}
                id="textInput"
                value={answer}
                onIonInput={e => {
                    setAnswer(e.detail.value ?? '');
                }}
            />
            <div className="w-full flex items-center justify-end mt-4">
                <button
                    onClick={handleCloseModal}
                    className="bg-grayscale-200 text-grayscale-900 font-poppins text-[15px] font-semibold px-[15px] py-[8px] rounded-full w-full mr-2"
                >
                    Cancel
                </button>
                <button
                    disabled={answer.length === 0}
                    onClick={() => handleCreateAnswer(answer)}
                    className={`bg-${primaryColor} text-white font-poppins text-[15px] font-semibold px-[15px] py-[8px] rounded-full w-full`}
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default PersonalizationInputModal;
