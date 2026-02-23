import React from 'react';

import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import ResumeDownloadButton from './ResumeDownloadButton';
import ResumeConfigPanel from './ResumeConfigPanelOptions';

export const ResumeConfigOverlayPanel: React.FC<{
    drawerOpen: boolean;
    setDrawerOpen: (drawerOpen: boolean) => void;
}> = ({ drawerOpen, setDrawerOpen }) => {
    return (
        <div className="fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />

            {/* Drawer panel */}
            <div className="w-full max-w-[420px] h-full bg-white flex flex-col shadow-2xl">
                {/* Drawer header */}
                <ResumeConfigPanelHeader panelOpen={drawerOpen} setPanelOpen={setDrawerOpen} />

                {/* Scrollable sections */}
                <div className="flex-1 overflow-y-auto">
                    <ResumeConfigPanel />
                </div>

                {/* Drawer footer */}
                <ResumeDownloadButton />
            </div>
        </div>
    );
};

export default ResumeConfigOverlayPanel;
