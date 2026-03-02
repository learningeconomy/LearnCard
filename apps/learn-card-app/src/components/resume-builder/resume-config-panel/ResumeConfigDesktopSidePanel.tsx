import React from 'react';

import ResumeConfigPanelOptions from './resume-config-panel-options/ResumeConfigPanelOptions';
import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import ResumeDownloadButton from './ResumeDownloadButton';

export const ResumeConfigDesktopSidePanel: React.FC<{
    panelOpen: boolean;
    setPanelOpen: (panelOpen: boolean) => void;
    isPreviewing?: boolean;
    setIsPreviewing?: (val: boolean) => void;
    onDownload?: () => void;
}> = ({ panelOpen, setPanelOpen, isPreviewing, setIsPreviewing, onDownload }) => {
    return (
        <div
            className={`shrink-0 h-full border-l border-grayscale-100 bg-white flex flex-col transition-all duration-300 overflow-hidden ${
                panelOpen ? 'w-[400px]' : 'w-0'
            }`}
        >
            {panelOpen && (
                <>
                    {/* Panel header */}
                    <ResumeConfigPanelHeader
                        panelOpen={panelOpen}
                        setPanelOpen={setPanelOpen}
                        isPreviewing={isPreviewing}
                        setIsPreviewing={setIsPreviewing}
                    />

                    {/* Scrollable sections */}
                    <div className="flex-1 overflow-y-auto">
                        <ResumeConfigPanelOptions />
                    </div>

                    {/* Panel footer */}
                    <ResumeDownloadButton onDownload={onDownload} />
                </>
            )}
        </div>
    );
};

export default ResumeConfigDesktopSidePanel;
