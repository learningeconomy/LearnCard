import React from 'react';

export const ResumeIframePreview: React.FC<{
    previewUrl: string | null;
    onClose: () => void;
}> = ({ previewUrl, onClose }) => {
    if (!previewUrl) return null;

    return (
        <div className="absolute inset-0 z-30 bg-black/50 p-3 sm:p-6">
            <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-grayscale-200 overflow-hidden flex flex-col">
                <div className="shrink-0 h-12 px-3 border-b border-grayscale-200 flex items-center justify-between bg-grayscale-50">
                    <p className="text-sm font-semibold text-grayscale-800">PDF Preview</p>
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-grayscale-200 bg-white text-grayscale-700 text-sm font-medium hover:bg-grayscale-50"
                    >
                        Close
                    </button>
                </div>
                <iframe
                    src={previewUrl}
                    title="Resume PDF Preview"
                    className="w-full flex-1 bg-grayscale-100"
                />
            </div>
        </div>
    );
};

export default ResumeIframePreview;
