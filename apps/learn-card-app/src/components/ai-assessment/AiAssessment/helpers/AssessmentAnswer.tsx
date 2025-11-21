import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

export const AssessmentAnswer: React.FC<{ answer: string }> = ({ answer }) => {
    return (
        <div className="flex items-center justify-end mt-4">
            <div className="bg-cyan-50 rounded-[20px] px-[15px] py-[10px] flex items-center prose prose-h1:mb-2 prose-p:mt-0 prose-li:my-0 prose-li:leading-6 prose-pre:bg-transparent prose-pre:p-0 prose-code:shadow prose-code:rounded prose-code:py-2!">
                <MarkdownRenderer>{answer}</MarkdownRenderer>
            </div>
        </div>
    );
};

export default AssessmentAnswer;
