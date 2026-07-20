import React, { useState } from 'react';

import { IonInput } from '@ionic/react';
import PersonalizationQuestionTitle from '../helpers/personalizationI18n';

import { PersonalizedQuestionType } from '../personalizedQuestions.helpers';

import { useTheme } from '../../../theme/hooks/useTheme';
import * as m from '../../../paraglide/messages.js';

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
                <PersonalizationQuestionTitle questionType={question.type} />
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
                    {m['common.cancel']()}
                </button>
                <button
                    disabled={answer.length === 0}
                    onClick={() => handleCreateAnswer(answer)}
                    className={`bg-${primaryColor} text-white font-poppins text-[15px] font-semibold px-[15px] py-[8px] rounded-full w-full`}
                >
                    {m['common.add']()}
                </button>
            </div>
        </div>
    );
};

export default PersonalizationInputModal;
