import React from 'react';

import ResumeConfigPanelOptions from './ResumeConfigPanelOptions';
import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import ResumeDownloadButton from './ResumeDownloadButton';

export const ResumeConfigDesktopSidePanel: React.FC<{
    panelOpen: boolean;
    setPanelOpen: (panelOpen: boolean) => void;
}> = ({ panelOpen, setPanelOpen }) => {
    return (
        <div
            className={`shrink-0 h-full border-l border-grayscale-100 bg-white flex flex-col transition-all duration-300 overflow-hidden ${
                panelOpen ? 'w-[400px]' : 'w-0'
            }`}
        >
            {panelOpen && (
                <>
                    {/* Panel header */}
                    <ResumeConfigPanelHeader panelOpen={panelOpen} setPanelOpen={setPanelOpen} />

                    {/* Scrollable sections */}
                    <div className="flex-1 overflow-y-auto">
                        <ResumeConfigPanelOptions />
                    </div>

                    {/* Panel footer */}
                    <ResumeDownloadButton />
                </>
            )}
        </div>
    );
};

export default ResumeConfigDesktopSidePanel;
