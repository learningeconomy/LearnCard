import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import ResumePreview from './resume-preview/ResumePreview';
import ResumeConfigPanelFAB from './resume-config-panel/ResumeConfigPanelFAB';
import ResumeConfigOverlayPanel from './resume-config-panel/ResumeConfigOverlayPanel';
import ResumeConfigDesktopSidePanel from './resume-config-panel/ResumeConfigDesktopSidePanel';

import { useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';

export const ResumeBuilder: React.FC = () => {
    const { newModal } = useModal({ mobile: ModalTypes.FullScreen });
    const { isMobile } = useDeviceTypeByWidth();

    const [panelOpen, setPanelOpen] = useState<boolean>(true);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

    const openResumeConfigPanel = () => {
        if (isMobile) {
            newModal(
                <ResumeConfigOverlayPanel drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            );
        } else {
            setPanelOpen(true);
        }
    };

    const previewWrapperStyles = isMobile
        ? 'flex-1 overflow-y-auto py-6 px-4 flex flex-col py-[100px]'
        : 'flex-1 overflow-y-auto py-10 px-6 flex justify-center';

    return (
        <div className="flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            <div className={previewWrapperStyles}>
                <ResumePreview />
            </div>

            {/* ── Desktop side panel ── */}
            {!isMobile && (
                <>
                    <ResumeConfigDesktopSidePanel
                        panelOpen={panelOpen}
                        setPanelOpen={setPanelOpen}
                    />
                </>
            )}

            {/* ── Mobile FAB ── */}
            {isMobile && !drawerOpen && (
                <ResumeConfigPanelFAB openResumeConfigPanel={openResumeConfigPanel} />
            )}

            {/* ── Desktop panel button when closed ── */}
            {!isMobile && !panelOpen && (
                <button
                    onClick={() => openResumeConfigPanel()}
                    className="absolute top-4 right-4 z-20 bg-white border border-grayscale-200 shadow-sm rounded-full p-2 h-[40px] w-[40px] text-grayscale-600 hover:text-grayscale-900"
                >
                    <IonIcon icon={menuOutline} className="w-[20px] h-[20px]" />
                </button>
            )}
        </div>
    );
};

export default ResumeBuilder;
