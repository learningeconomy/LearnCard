import React from 'react';

import ResumeConfigPanelOptions from './resume-config-panel-options/ResumeConfigPanelOptions';
import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import type { ResumeSectionKey } from '../resume-builder.helpers';

export const ResumeConfigOverlayPanel: React.FC<{
    drawerOpen: boolean;
    setDrawerOpen: (drawerOpen: boolean) => void;
    isPreviewing?: boolean;
    setIsPreviewing?: (val: boolean) => void;
    focusSectionKey?: ResumeSectionKey;
    focusRequestId?: number;
}> = ({
    drawerOpen,
    setDrawerOpen,
    isPreviewing,
    setIsPreviewing,
    focusSectionKey,
    focusRequestId,
}) => {
    return (
        <div className="fixed inset-0 z-40 flex">
            {/* Drawer panel */}
            <div data-modal-root className="w-full h-full bg-white flex flex-col shadow-2xl">
                {/* Drawer header */}
                <ResumeConfigPanelHeader
                    panelOpen={drawerOpen}
                    setPanelOpen={setDrawerOpen}
                    isPreviewing={isPreviewing}
                    setIsPreviewing={setIsPreviewing}
                />

                {/* Scrollable sections */}
                <div className="flex-1 overflow-y-auto">
                    <ResumeConfigPanelOptions
                        focusSectionKey={focusSectionKey}
                        focusRequestId={focusRequestId}
                    />
                </div>
            </div>
        </div>
    );
};

export default ResumeConfigOverlayPanel;
