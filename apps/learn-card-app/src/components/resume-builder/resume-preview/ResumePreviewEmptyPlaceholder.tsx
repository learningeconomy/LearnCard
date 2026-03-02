import React from 'react';

const ResumePreviewEmptyPlaceholder: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-grayscale-400 select-none">
            <div className="w-16 h-16 rounded-full bg-grayscale-100 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            </div>
            <p className="text-sm font-medium">Your resume will appear here</p>
            <p className="text-xs text-center max-w-[200px]">
                Fill in your details and select credentials from the panel
            </p>
        </div>
    );
};

export default ResumePreviewEmptyPlaceholder;
