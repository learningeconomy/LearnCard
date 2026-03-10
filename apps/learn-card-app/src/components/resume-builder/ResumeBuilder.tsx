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

import {
    useDeviceTypeByWidth,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
    CredentialCategoryEnum,
} from 'learn-card-base';
import { useResumePreselection } from './useResumePreselection';
import ResumeBuilderLoader from './ResumeBuilderLoader';
import { resumeBuilderStore } from '../../stores/resumeBuilderStore';
import { useIssueTcpResume } from '../../hooks/useIssueTcpResume';
import { useFlags } from 'launchdarkly-react-client-sdk';

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
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const hiddenSections = resumeBuilderStore.useTracked.hiddenSections();
    const flags = useFlags();
    const { presentToast } = useToast();
    const { publishTcpResume } = useIssueTcpResume();

    const revokePreviewBlobUrl = useCallback((preview: ResumePdfPreviewData | null) => {
        if (preview?.downloadUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(preview.downloadUrl);
        }
    }, []);

    const handlePreview = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('preview');
        try {
            const nextPreview = await resumePreviewRef.current?.createPDFPreviewUrl();
            if (nextPreview) {
                setInlinePreview(prevPreview => {
                    revokePreviewBlobUrl(prevPreview);
                    return nextPreview;
                });
            }
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction, revokePreviewBlobUrl]);

    const handleDownload = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('download');
        try {
            await resumePreviewRef.current?.generatePDF();
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction]);

    const handlePublish = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('publish');
        try {
            const wrapperId = crypto.randomUUID();
            const artifact = await resumePreviewRef.current?.createPDFArtifact();
            if (!artifact) {
                presentToast('Could not generate a PDF artifact for publishing.', {
                    type: ToastTypeEnum.Error,
                });
                return;
            }

            const includedCredentials = Object.entries(credentialEntries).flatMap(
                ([category, entries]) =>
                    (hiddenSections?.[category as CredentialCategoryEnum] ? [] : entries ?? []).map(
                        entry => ({
                            uri: entry.uri,
                            category: category || CredentialCategoryEnum.workHistory,
                        })
                    )
            );

            const { verificationUrl } = await publishTcpResume({
                pdfBlob: artifact.blob,
                fileName: artifact.fileName,
                pdfHash: artifact.hash,
                wrapperId,
                includedCredentials,
                enableCoSign: Boolean((flags as Record<string, unknown>)?.enableTcpResumeCosign),
            });

            presentToast('Resume wrapper VC published successfully.', {
                title: 'Published',
                details: verificationUrl,
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
                duration: 6000,
            });
        } catch (error: any) {
            presentToast(error?.message ?? 'Failed to publish resume wrapper VC.', {
                title: 'Publish Failed',
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLoadingAction(null);
        }
    }, [credentialEntries, flags, hiddenSections, loadingAction, presentToast, publishTcpResume]);

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
        ? 'flex-1 overflow-y-auto py-6 px-3 flex flex-col'
        : 'flex-1 overflow-y-auto py-10 px-6 flex justify-center';

    useEffect(() => {
        return () => {
            revokePreviewBlobUrl(inlinePreview);
        };
    }, [inlinePreview, revokePreviewBlobUrl]);

    const closeInlinePreview = useCallback(() => {
        setInlinePreview(prevPreview => {
            revokePreviewBlobUrl(prevPreview);
            return null;
        });
    }, [revokePreviewBlobUrl]);

    return (
        <div className="resume-builder flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            {loadingAction && (
                <div className="absolute inset-0 h-full w-full z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <ResumeBuilderLoader />
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col">
                <ResumeBuilderHeader
                    loadingAction={loadingAction}
                    isMobile={isMobile}
                    isDesktopPanelClosed={!panelOpen}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onPublish={handlePublish}
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
