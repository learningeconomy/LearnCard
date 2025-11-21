import React from 'react';

import { AiAssessmentQuestion } from '../ai-assessment.helpers';

import { useDeviceTypeByWidth } from 'learn-card-base';

export const AssessmentMultipleChoiceAnswers: React.FC<{
    assessmentQA: AiAssessmentQuestion[];
    handleAnswer: (index: number, answer: string) => void;
    index: number;
}> = ({ assessmentQA, handleAnswer, index }) => {
    const { isDesktop } = useDeviceTypeByWidth();
    const answers = assessmentQA[index].choices;

    return (
        <div
            className={`w-full ion-padding flex items-center justify-center ${
                isDesktop ? 'bg-white rounded-[20px] shadow-box-bottom' : 'bg-cyan-50'
            }`}
        >
            {answers?.map((answer, i) => {
                const choiceLetter = String.fromCharCode(65 + i).toLowerCase();

                return (
                    <button
                        key={i}
                        className="bg-white rounded-full p-4 w-[50px] h-[50px] flex items-center justify-center mr-4 border-[1px] border-solid border-grayscale-200 last:mr-0"
                        onClick={() => handleAnswer(index, answer)}
                    >
                        <p className="text-grayscale-800 text-[17px] text-center">{choiceLetter}</p>
                    </button>
                );
            })}
        </div>
    );
};

export default AssessmentMultipleChoiceAnswers;
