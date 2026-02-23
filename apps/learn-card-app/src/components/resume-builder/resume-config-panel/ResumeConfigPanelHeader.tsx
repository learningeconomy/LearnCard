import React from 'react';

import X from 'learn-card-base/svgs/X';

import { useModal } from 'learn-card-base';

export const ResumeConfigPanelHeader: React.FC<{
    panelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
}> = ({ panelOpen, setPanelOpen }) => {
    const { closeModal } = useModal();
    const handleClose = () => {
        if (panelOpen) {
            setPanelOpen(false);
        }

        closeModal();
    };

    return (
        <div className="sticky top-0 z-10 bg-white border-b border-grayscale-100 px-4 py-3 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-grayscale-900">Resume Builder</h2>
            <button onClick={handleClose} className="text-grayscale-400 hover:text-grayscale-700">
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ResumeConfigPanelHeader;
