import React, { useState } from 'react';

import {
    PERSONALIZED_QUESTION_SET,
    PersonalizedAnswersState,
    PersonalizedQuestionEnum,
} from './personalizedQuestions.helpers';
import PersonalizedQuestion from './AiPassportPersonalizationQuestion';

export const AiPassportPersonalizationQuestions: React.FC<{
    personalizedAnswers: PersonalizedAnswersState;
    setPersonalizedAnswers: React.Dispatch<React.SetStateAction<PersonalizedAnswersState>>;
}> = ({ personalizedAnswers, setPersonalizedAnswers }) => {
    const handleSetAnswer = (questionType: PersonalizedQuestionEnum, answer: string) => {
        setPersonalizedAnswers(prevState => {
            return {
                ...prevState,
                [questionType]: [...prevState?.[questionType], answer],
            };
        });
    };

    const handleRemoveAnswer = (questionType: PersonalizedQuestionEnum, answer: string) => {
        setPersonalizedAnswers(prevState => {
            return {
                ...prevState,
                [questionType]: [
                    ...prevState?.[questionType].filter(_answer => _answer !== answer),
                ],
            };
        });
    };

    return (
        <>
            {PERSONALIZED_QUESTION_SET.map((question, index) => {
                const answers = personalizedAnswers?.[question.type];

                return (
                    <PersonalizedQuestion
                        key={index}
                        question={question}
                        answers={answers}
                        handleSetAnswer={handleSetAnswer}
                        handleRemoveAnswer={handleRemoveAnswer}
                    />
                );
            })}
        </>
    );
};

export default AiPassportPersonalizationQuestions;
