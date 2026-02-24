import React, { useState, useRef, useCallback } from 'react';

import { IonIcon, IonFab, IonFabButton } from '@ionic/react';
import { menuOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import ResumePreview, { ResumePreviewHandle } from './resume-preview/ResumePreview';
import ResumeConfigPanelFAB from './resume-config-panel/ResumeConfigPanelFAB';
import ResumeConfigOverlayPanel from './resume-config-panel/ResumeConfigOverlayPanel';
import ResumeConfigDesktopSidePanel from './resume-config-panel/ResumeConfigDesktopSidePanel';
import { useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';

export const ResumeBuilder: React.FC = () => {
    const { newModal } = useModal({ mobile: ModalTypes.FullScreen });
    const { isMobile } = useDeviceTypeByWidth();

    const [panelOpen, setPanelOpen] = useState<boolean>(true);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
    const resumePreviewRef = useRef<ResumePreviewHandle>(null);
    const handleDownload = useCallback(() => resumePreviewRef.current?.generatePDF(), []);

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
        ? 'flex-1 overflow-y-auto py-6 px-3 flex flex-col pb-[100px]'
        : 'flex-1 overflow-y-auto py-10 px-6 flex justify-center';

    return (
        <div className="flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            <div className={previewWrapperStyles}>
                <ResumePreview
                    ref={resumePreviewRef}
                    isMobile={isMobile}
                    isPreviewing={isPreviewing}
                />
            </div>

            {/* ── Desktop side panel ── */}
            {!isMobile && (
                <ResumeConfigDesktopSidePanel
                    panelOpen={panelOpen}
                    setPanelOpen={setPanelOpen}
                    isPreviewing={isPreviewing}
                    setIsPreviewing={setIsPreviewing}
                    onDownload={handleDownload}
                />
            )}

            {/* ── Mobile FABs ── */}
            {isMobile && !drawerOpen && (
                <>
                    {/* Preview toggle FAB — sits to the left of the edit FAB */}
                    <IonFab
                        slot="fixed"
                        vertical="bottom"
                        horizontal="end"
                        style={{ marginRight: '72px' }}
                    >
                        <IonFabButton onClick={() => setIsPreviewing(p => !p)} color="light">
                            <IonIcon icon={isPreviewing ? eyeOffOutline : eyeOutline} />
                        </IonFabButton>
                    </IonFab>
                    <ResumeConfigPanelFAB openResumeConfigPanel={openResumeConfigPanel} />
                </>
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
