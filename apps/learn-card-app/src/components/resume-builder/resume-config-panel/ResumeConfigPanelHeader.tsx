import React from 'react';

import X from 'learn-card-base/svgs/X';
import ResumeBuilderIcon from '../../../assets/images/resume-builder-icon.png';

import { useModal } from 'learn-card-base';

export const ResumeConfigPanelHeader: React.FC<{
    panelOpen: boolean;
    setPanelOpen: (open: boolean) => void;
    isPreviewing?: boolean;
    setIsPreviewing?: (val: boolean) => void;
}> = ({ panelOpen, setPanelOpen, isPreviewing = false, setIsPreviewing }) => {
    const { closeModal } = useModal();
    const handleClose = () => {
        if (panelOpen) {
            setPanelOpen(false);
        }

        closeModal();
    };

    return (
        <div className="sticky top-0 z-10 bg-white rounded-b-[30px] shadow-md overflow-hidden px-4 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <img src={ResumeBuilderIcon} alt="Resume Builder" className="w-[50px] h-[50px]" />
                <h2 className="text-2xl font-semibold text-grayscale-900">Resume Builder</h2>
            </div>

            <button
                onClick={handleClose}
                className="text-grayscale-400 hover:text-grayscale-700 border-[1px] border-solid border-grayscale-200 rounded-full p-3"
            >
                <X className="w-5 h-5 text-grayscale-700" />
            </button>
        </div>
    );
};

export default ResumeConfigPanelHeader;
