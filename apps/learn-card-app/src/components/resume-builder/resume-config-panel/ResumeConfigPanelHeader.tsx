import React from 'react';

import X from 'learn-card-base/svgs/X';
import { IonIcon } from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

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
        <div className="sticky top-0 z-10 bg-white border-b border-grayscale-100 px-4 py-3 flex items-center justify-between shrink-0">
            <h2 className="text-sm font-bold text-grayscale-900">Resume Builder</h2>
            <div className="flex items-center gap-2">
                {setIsPreviewing && (
                    <button
                        onClick={() => setIsPreviewing(!isPreviewing)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-grayscale-200 text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        <IonIcon
                            icon={isPreviewing ? eyeOffOutline : eyeOutline}
                            className="w-[13px] h-[13px]"
                        />
                        {isPreviewing ? 'Edit' : 'Preview'}
                    </button>
                )}
                <button
                    onClick={handleClose}
                    className="text-grayscale-400 hover:text-grayscale-700"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default ResumeConfigPanelHeader;
