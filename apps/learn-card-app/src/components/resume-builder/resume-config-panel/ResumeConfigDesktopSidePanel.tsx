import React from 'react';

import ResumeConfigPanelOptions from './resume-config-panel-options/ResumeConfigPanelOptions';
import ResumeConfigPanelHeader from './ResumeConfigPanelHeader';
import type { ResumeSectionKey } from '../resume-builder.helpers';

export const ResumeConfigDesktopSidePanel: React.FC<{
    panelOpen: boolean;
    setPanelOpen: (panelOpen: boolean) => void;
    isPreviewing?: boolean;
    setIsPreviewing?: (val: boolean) => void;
    focusSectionKey?: ResumeSectionKey;
    focusRequestId?: number;
}> = ({
    panelOpen,
    setPanelOpen,
    isPreviewing,
    setIsPreviewing,
    focusSectionKey,
    focusRequestId,
}) => {
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
                        <ResumeConfigPanelOptions
                            focusSectionKey={focusSectionKey}
                            focusRequestId={focusRequestId}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default ResumeConfigDesktopSidePanel;
