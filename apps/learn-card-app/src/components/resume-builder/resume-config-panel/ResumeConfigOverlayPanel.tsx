import React from 'react';

import ResumeConfigPanelOptions from './resume-config-panel-options/ResumeConfigPanelOptions';
import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import ResumeDownloadButton from './ResumeDownloadButton';

export const ResumeConfigOverlayPanel: React.FC<{
    drawerOpen: boolean;
    setDrawerOpen: (drawerOpen: boolean) => void;
    isPreviewing?: boolean;
    setIsPreviewing?: (val: boolean) => void;
    onDownload?: () => void;
}> = ({ drawerOpen, setDrawerOpen, isPreviewing, setIsPreviewing, onDownload }) => {
    return (
        <div className="fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />

            {/* Drawer panel */}
            <div className="w-full max-w-[420px] h-full bg-white flex flex-col shadow-2xl">
                {/* Drawer header */}
                <ResumeConfigPanelHeader
                    panelOpen={drawerOpen}
                    setPanelOpen={setDrawerOpen}
                    isPreviewing={isPreviewing}
                    setIsPreviewing={setIsPreviewing}
                />

                {/* Scrollable sections */}
                <div className="flex-1 overflow-y-auto">
                    <ResumeConfigPanelOptions />
                </div>

                {/* Drawer footer */}
                <ResumeDownloadButton onDownload={onDownload} />
            </div>
        </div>
    );
};

export default ResumeConfigOverlayPanel;
