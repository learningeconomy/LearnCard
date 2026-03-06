import React, { useState, useRef, useCallback, useEffect } from 'react';

import { IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import ResumeIframePreview from './ResumeIframePreview';
import ResumePreviewFAB from './resume-preview/ResumePreviewFAB';
import ResumeConfigPanelFAB from './resume-config-panel/ResumeConfigPanelFAB';
import ResumePreview, { ResumePreviewHandle } from './resume-preview/ResumePreview';
import ResumeConfigOverlayPanel from './resume-config-panel/ResumeConfigOverlayPanel';
import ResumeConfigDesktopSidePanel from './resume-config-panel/ResumeConfigDesktopSidePanel';
import ResumeBuilderHeader, { ResumeBuilderHeaderAction } from './ResumeBuilderHeader';
import { ResumePdfPreviewData } from './resume-preview/useResumePdf';

import { useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';
import { useResumePreselection } from './useResumePreselection';

export const ResumeBuilder: React.FC = () => {
    useResumePreselection();

    const { newModal } = useModal({ mobile: ModalTypes.FullScreen });
    const resumePreviewRef = useRef<ResumePreviewHandle>(null);
    const { isMobile } = useDeviceTypeByWidth();

    const [panelOpen, setPanelOpen] = useState<boolean>(true); // Desktop side panel
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false); // Mobile drawer

    const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
    const [inlinePreview, setInlinePreview] = useState<ResumePdfPreviewData | null>(null);

    const [loadingAction, setLoadingAction] = useState<ResumeBuilderHeaderAction>(null);

    const handlePreview = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('preview');
        try {
            const nextPreview = await resumePreviewRef.current?.createPDFPreviewUrl();
            if (nextPreview) {
                setInlinePreview(prevPreview => {
                    if (prevPreview?.url) URL.revokeObjectURL(prevPreview.url);
                    return nextPreview;
                });
            }
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction]);

    const handleDownload = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('download');
        try {
            await resumePreviewRef.current?.generatePDF();
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction]);

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

    useEffect(() => {
        return () => {
            if (inlinePreview?.url) URL.revokeObjectURL(inlinePreview.url);
        };
    }, [inlinePreview]);

    const closeInlinePreview = useCallback(() => {
        setInlinePreview(prevPreview => {
            if (prevPreview?.url) URL.revokeObjectURL(prevPreview.url);
            return null;
        });
    }, []);

    return (
        <div className="resume-builder flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            <div className="flex-1 min-w-0 flex flex-col">
                <ResumeBuilderHeader
                    loadingAction={loadingAction}
                    isMobile={isMobile}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                />

                <div className={previewWrapperStyles}>
                    <ResumePreview
                        ref={resumePreviewRef}
                        isMobile={isMobile}
                        isPreviewing={isPreviewing}
                    />
                </div>
            </div>

            <ResumeIframePreview preview={inlinePreview} onClose={closeInlinePreview} />

            {/* ── Desktop side panel ── */}
            {!isMobile && (
                <ResumeConfigDesktopSidePanel
                    panelOpen={panelOpen}
                    setPanelOpen={setPanelOpen}
                    isPreviewing={isPreviewing}
                    setIsPreviewing={setIsPreviewing}
                />
            )}

            {/* ── Mobile FABs ── */}
            {isMobile && !drawerOpen && (
                <>
                    {/* Preview toggle FAB — sits to the left of the edit FAB */}
                    <ResumePreviewFAB
                        isPreviewing={isPreviewing}
                        setIsPreviewing={setIsPreviewing}
                    />
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
