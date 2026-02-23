import React from 'react';

export const ResumeDownloadButton: React.FC<{}> = () => {
    const handleDownload = () => {
        // TODO: Implement download logic
    };

    return (
        <div className="sticky bottom-0 bg-white border-t border-grayscale-100 px-4 py-3 shrink-0">
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-full py-3 transition-colors">
                Download Resume
            </button>
        </div>
    );
};

export default ResumeDownloadButton;
