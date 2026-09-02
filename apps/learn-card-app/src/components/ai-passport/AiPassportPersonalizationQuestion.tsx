import React from 'react';

import PersonalizationQuestionTitle, {
    getPersonalizedOptionText,
} from './helpers/personalizationI18n';
import { AIPassportPersonalizationAnswer } from './AIPassportPersonalizationAnswer';
import AIPassportPersonalizationAnswerInput from './AiPassportPersonaliztionAnswerInput';

import {
    PersonalizedQuestionType,
    PersonalizedQuestionEnum,
} from './personalizedQuestions.helpers';

export const PersonalizedQuestion: React.FC<{
    question: PersonalizedQuestionType;
    answers: string[];
    handleSetAnswer: (questionType: PersonalizedQuestionEnum, answer: string) => void;
    handleRemoveAnswer: (questionType: PersonalizedQuestionEnum, answer: string) => void;
}> = ({ question, answers, handleSetAnswer, handleRemoveAnswer }) => {
    const questionType = question?.type;

    const predefinedAnswers = question.predefinedAnswers;
    const questionHasPredefinedAnswers = questionType === PersonalizedQuestionEnum.iLearnBest;

    const showInputField = question.showInput ?? false;

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-6 mt-4 rounded-[15px]">
            <div className="w-full">
                <p className="text-left text-grayscale-900 text-[17px] font-notoSans">
                    <PersonalizationQuestionTitle questionType={questionType} />
                </p>

                <div className="w-full flex flex-wrap items-center justify-start">
                    {questionHasPredefinedAnswers &&
                        predefinedAnswers.map((answer, index) => {
                            // The English `answer` stays the stable state/VC
                            // identifier; only the display text is translated.
                            const displayText = getPersonalizedOptionText(questionType, index);
                            return (
                                <AIPassportPersonalizationAnswer
                                    question={question}
                                    answer={answer}
                                    displayAnswer={displayText}
                                    answers={answers}
                                    handleSetAnswer={handleSetAnswer}
                                    handleRemoveAnswer={handleRemoveAnswer}
                                    key={index}
                                />
                            );
                        })}

                    {!questionHasPredefinedAnswers &&
                        answers.map((answer, index) => {
                            return (
                                <AIPassportPersonalizationAnswer
                                    question={question}
                                    answer={answer}
                                    answers={answers}
                                    handleRemoveAnswer={handleRemoveAnswer}
                                    key={index}
                                />
                            );
                        })}

                    <div className="w-full" />

                    {showInputField && !questionHasPredefinedAnswers && (
                        <AIPassportPersonalizationAnswerInput
                            question={question}
                            handleSetAnswer={handleSetAnswer}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalizedQuestion;
