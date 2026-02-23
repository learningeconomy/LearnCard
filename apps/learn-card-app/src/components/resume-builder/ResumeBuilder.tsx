import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import ResumePreview from './resume-config-panel/ResumePreview';
import ResumeConfigPanel from './resume-config-panel/ResumeConfigPanel';
import ResumeConfigPanelFAB from './resume-config-panel/ResumeConfigPanelFAB';
import ResumeDownloadButton from './resume-config-panel/ResumeDownloadButton';
import ResumeConfigPanelHeader from './resume-config-panel/ResumeConfigPanelHeader';

import { useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';

export const ResumeBuilder: React.FC = () => {
    const { newModal, closeModal } = useModal({ mobile: ModalTypes.FullScreen });
    const { isMobile } = useDeviceTypeByWidth();

    const [panelOpen, setPanelOpen] = useState<boolean>(true);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const openResumeConfigPanel = () => {
        if (isMobile) {
            newModal(
                <div className="fixed inset-0 z-40 flex">
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />

                    {/* Drawer panel */}
                    <div className="w-full max-w-[420px] h-full bg-white flex flex-col shadow-2xl">
                        {/* Drawer header */}
                        <ResumeConfigPanelHeader
                            panelOpen={drawerOpen}
                            setPanelOpen={setDrawerOpen}
                        />

                        {/* Scrollable sections */}
                        <div className="flex-1 overflow-y-auto">
                            <ResumeConfigPanel />
                        </div>

                        {/* Drawer footer */}
                        <ResumeDownloadButton />
                    </div>
                </div>
            );
        } else {
            setPanelOpen(true);
        }
    };

    return (
        <div className="flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            {/* ── Desktop Layout ── */}
            {!isMobile && (
                <>
                    {/* Preview canvas */}
                    <div className="flex-1 overflow-y-auto py-10 px-6 flex justify-center">
                        <ResumePreview />
                    </div>

                    {/* Side config panel */}
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
                                />

                                {/* Scrollable sections */}
                                <div className="flex-1 overflow-y-auto">
                                    <ResumeConfigPanel />
                                </div>

                                {/* Panel footer */}
                                <ResumeDownloadButton />
                            </>
                        )}
                    </div>

                    {/* Toggle panel button when closed */}
                    {!panelOpen && (
                        <button
                            onClick={() => openResumeConfigPanel()}
                            className="absolute top-4 right-4 z-20 bg-white border border-grayscale-200 shadow-sm rounded-full p-2 h-[40px] w-[40px] text-grayscale-600 hover:text-grayscale-900"
                        >
                            <IonIcon icon={menuOutline} className="w-[20px] h-[20px]" />
                        </button>
                    )}
                </>
            )}

            {/* ── Mobile Layout ── */}
            {isMobile && (
                <>
                    {/* Full-screen preview */}
                    <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
                        <ResumePreview />
                    </div>

                    {/* FAB to open drawer */}
                    {!drawerOpen && (
                        <ResumeConfigPanelFAB openResumeConfigPanel={openResumeConfigPanel} />
                    )}
                </>
            )}
        </div>
    );
};

export default ResumeBuilder;
