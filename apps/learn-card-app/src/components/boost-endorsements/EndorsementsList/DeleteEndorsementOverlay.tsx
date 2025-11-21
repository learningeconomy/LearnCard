import React from 'react';

import TrashBin from 'learn-card-base/svgs/TrashBin';

const DeleteEndorsementOverlay: React.FC<{
    setShowDeleteOverlay: (show: boolean) => void;
    showDeleteOverlay: boolean;
    hideIcon?: boolean;
    text?: string;
    handleDeleteEndorsement?: () => void;
}> = ({ setShowDeleteOverlay, showDeleteOverlay, hideIcon, text, handleDeleteEndorsement }) => {
    return (
        <div className="flex flex-col items-center justify-center absolute top-0 left-0 w-full h-full bg-grayscale-900 bg-opacity-80 z-10 gap-4 px-4 rounded-[20px]">
            {!hideIcon && <TrashBin className="w-6 h-6 text-white" />}
            <h1 className="text-xl font-semibold text-white">Delete Endorsement?</h1>
            <button
                className="text-rose-600 px-4 py-[12px] bg-white text-[17px] font-semibold  rounded-full w-full"
                onClick={() => {
                    handleDeleteEndorsement?.();
                    setShowDeleteOverlay(false);
                }}
            >
                {text || 'Yes, Delete'}
            </button>
            <button
                className="text-grayscale-900 px-4 py-[12px] bg-white text-[17px] font-semibold rounded-full w-full"
                onClick={() => setShowDeleteOverlay(false)}
            >
                Cancel
            </button>
        </div>
    );
};

export default DeleteEndorsementOverlay;
