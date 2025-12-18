import React, { useEffect, useRef } from 'react';

import AssessmentQuestion from './helpers/AssessmentQuestion';
import AssessmentAnswer from './helpers/AssessmentAnswer';

import { AiAssesmentQuestionTypeEnum, AiAssessmentQuestion } from './ai-assessment.helpers';
import { AiAssessmentStepEnum } from './AiAssessmentContainer';

export const AiAssessmentQAItems: React.FC<{
    activeStep: AiAssessmentStepEnum;
    assessmentQA: AiAssessmentQuestion[];
    currentQuestionIndex: number;
    onAnswerChange: (index: number, answer: string) => void;
}> = ({ activeStep, assessmentQA, currentQuestionIndex, onAnswerChange }) => {
    const lastQuestionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (activeStep === AiAssessmentStepEnum.assessmentQA) {
            setTimeout(() => {
                lastQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 800);
        }
    }, [currentQuestionIndex, activeStep]);

    return (
        <>
            {assessmentQA.map((qa, index) => {
                if (index > currentQuestionIndex) return null;
                const questionNumber = index + 1;
                const hasAnswer = !!qa.answer;
                const hasMultipleChoice = qa.type === AiAssesmentQuestionTypeEnum.multipleChoice;

                const isCurrent = index === currentQuestionIndex;

                return (
                    <div
                        key={qa.id}
                        ref={isCurrent ? lastQuestionRef : null}
                        className="w-full mb-4 mt-12"
                    >
                        <div className="border-t-solid border-t-[1px] border-grayscale-200 pb-12" />
                        <AssessmentQuestion
                            questionNumber={questionNumber}
                            question={qa.question}
                        />
                        {hasMultipleChoice ? (
                            <div className="flex flex-col items-start justify-center">
                                {qa.choices?.map((choice, i) => {
                                    const choiceLetter = String.fromCharCode(65 + i).toLowerCase();
                                    return (
                                        <p className="text-grayscale-900 mb-1" key={i}>
                                            {choiceLetter})&nbsp;{choice}
                                        </p>
                                    );
                                })}
                            </div>
                        ) : null}
                        {hasAnswer ? <AssessmentAnswer answer={qa?.answer || ''} /> : null}
                    </div>
                );
            })}
        </>
    );
};

export default AiAssessmentQAItems;
