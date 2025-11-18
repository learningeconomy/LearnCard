import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const AssessmentQuestion: React.FC<{ questionNumber: number; question: string }> = ({
    questionNumber,
    question,
}) => {
    return (
        <div className="text-grayscale-700 font-normal prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:bg-transparent prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!">
            <span className="text-grayscale-900 font-semibold">
                👉 Assessment Question {questionNumber}
            </span>
            <br />
            <br />
            <MarkdownRenderer>{question}</MarkdownRenderer>
        </div>
    );
};

export default AssessmentQuestion;
