import React, { useState } from 'react';

export const ResumeDownloadButton: React.FC<{ onDownload?: () => void | Promise<void> }> = ({
    onDownload,
}) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!onDownload || loading) return;
        setLoading(true);
        try {
            await onDownload();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sticky bottom-0 bg-white border-t border-grayscale-100 px-4 py-3 shrink-0">
            <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-full py-3 transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Generating PDF…
                    </>
                ) : (
                    'Download Resume'
                )}
            </button>
        </div>
    );
};

export default ResumeDownloadButton;
